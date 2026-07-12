import { Request, Response } from 'express';
import prisma from '../config/db';
import { TripStatus, VehicleStatus, DriverStatus, Role } from '@prisma/client';
import { invalidateDashboardCache } from '../utils/cache';
import { uploadFile } from '../utils/s3';

export async function getAllTrips(req: Request, res: Response) {
  const user = (req as any).user;
  const where: any = { companyId: user.companyId };

  try {
    if (user && user.role === Role.DRIVER) {
      // Find associated Driver profile
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver) {
        return res.json([]);
      }
      where.driverId = driver.id;
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, name: true, maxLoadCapacityKg: true, odometer: true }
        },
        driver: {
          select: { id: true, name: true, licenseNumber: true, status: true, licenseExpiryDate: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(trips);
  } catch (err) {
    console.error('Get all trips error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTrip(req: Request, res: Response) {
  const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm } = req.body;
  const user = (req as any).user;

  if (!source || !destination || !vehicleId || !driverId || cargoWeightKg === undefined || plannedDistanceKm === undefined) {
    return res.status(400).json({ error: 'Required fields: source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm' });
  }

  const weight = parseFloat(cargoWeightKg);
  const distance = parseFloat(plannedDistanceKm);

  try {
    // 1. Fetch Vehicle and check business rules
    const vehicle = await prisma.vehicle.findFirst({ 
      where: { id: vehicleId, companyId: user.companyId } 
    });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.status === VehicleStatus.RETIRED || vehicle.status === VehicleStatus.IN_SHOP) {
      return res.status(400).json({ error: `Vehicle is currently in '${vehicle.status}' status and cannot be dispatched` });
    }

    if (vehicle.status === VehicleStatus.ON_TRIP) {
      return res.status(400).json({ error: 'Vehicle is already assigned to an ongoing trip' });
    }

    // 2. Fetch Driver and check business rules
    const driver = await prisma.driver.findFirst({ 
      where: { id: driverId, companyId: user.companyId } 
    });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (driver.status === DriverStatus.SUSPENDED) {
      return res.status(400).json({ error: 'Driver is suspended and cannot be assigned to trips' });
    }

    if (driver.status === DriverStatus.ON_TRIP) {
      return res.status(400).json({ error: 'Driver is already assigned to an ongoing trip' });
    }

    // Expiry check
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return res.status(400).json({ error: 'Driver driving license is expired and cannot be dispatched' });
    }

    // Capacity check
    if (weight > vehicle.maxLoadCapacityKg) {
      return res.status(400).json({ 
        error: `Cargo weight (${weight} kg) exceeds vehicle max load capacity (${vehicle.maxLoadCapacityKg} kg)` 
      });
    }

    // 3. Create Draft Trip
    const trip = await prisma.trip.create({
      data: {
        source: source.trim(),
        destination: destination.trim(),
        cargoWeightKg: weight,
        plannedDistanceKm: distance,
        vehicleId,
        driverId,
        status: TripStatus.DRAFT,
        companyId: user.companyId
      },
      include: {
        vehicle: true,
        driver: true
      }
    });

    await invalidateDashboardCache();

    return res.status(201).json(trip);
  } catch (err) {
    console.error('Create trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function dispatchTrip(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const trip = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId },
      include: { vehicle: true, driver: true }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Role check: DRIVER can only dispatch their own trip
    if (user && user.role === Role.DRIVER) {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver || trip.driverId !== driver.id) {
        return res.status(403).json({ error: 'Forbidden: You can only dispatch trips assigned to you' });
      }
    }

    if (trip.status !== TripStatus.DRAFT) {
      return res.status(400).json({ error: `Only DRAFT trips can be dispatched. Current status: ${trip.status}` });
    }

    // Double check availability and capacity rules server-side
    if (trip.vehicle.status === VehicleStatus.ON_TRIP) {
      return res.status(400).json({ error: 'Vehicle is already ON_TRIP' });
    }
    if (trip.vehicle.status === VehicleStatus.RETIRED || trip.vehicle.status === VehicleStatus.IN_SHOP) {
      return res.status(400).json({ error: `Vehicle is in '${trip.vehicle.status}' status` });
    }

    if (trip.driver.status === DriverStatus.ON_TRIP) {
      return res.status(400).json({ error: 'Driver is already ON_TRIP' });
    }
    if (trip.driver.status === DriverStatus.SUSPENDED) {
      return res.status(400).json({ error: 'Driver is SUSPENDED' });
    }
    if (new Date(trip.driver.licenseExpiryDate) < new Date()) {
      return res.status(400).json({ error: 'Driver driving license is expired' });
    }

    if (trip.cargoWeightKg > trip.vehicle.maxLoadCapacityKg) {
      return res.status(400).json({
        error: `Cargo weight (${trip.cargoWeightKg} kg) exceeds vehicle capacity (${trip.vehicle.maxLoadCapacityKg} kg)`
      });
    }

    // Single DB Transaction to dispatch
    const updatedTrip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.DISPATCHED,
          dispatchedAt: new Date()
        },
        include: { vehicle: true, driver: true }
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.ON_TRIP }
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.ON_TRIP }
      });

      return updated;
    });

    await invalidateDashboardCache();

    return res.json(updatedTrip);
  } catch (err) {
    console.error('Dispatch trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function completeTrip(req: Request, res: Response) {
  const { id } = req.params;
  const { actualDistanceKm, fuelConsumedL } = req.body;
  const user = (req as any).user;

  if (actualDistanceKm === undefined || fuelConsumedL === undefined) {
    return res.status(400).json({ error: 'Required fields: actualDistanceKm, fuelConsumedL' });
  }

  const distance = parseFloat(actualDistanceKm);
  const fuel = parseFloat(fuelConsumedL);

  if (isNaN(distance) || distance <= 0) {
    return res.status(400).json({ error: 'actualDistanceKm must be a positive number' });
  }
  if (isNaN(fuel) || fuel < 0) {
    return res.status(400).json({ error: 'fuelConsumedL must be a non-negative number' });
  }

  try {
    const trip = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId },
      include: { vehicle: true, driver: true }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Role check: DRIVER can only complete their own trip
    if (user && user.role === Role.DRIVER) {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver || trip.driverId !== driver.id) {
        return res.status(403).json({ error: 'Forbidden: You can only complete trips assigned to you' });
      }
    }

    if (trip.status !== TripStatus.DISPATCHED) {
      return res.status(400).json({ error: `Only DISPATCHED trips can be completed. Current status: ${trip.status}` });
    }

    // Transaction to complete trip
    const updatedTrip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.COMPLETED,
          completedAt: new Date(),
          actualDistanceKm: distance,
          fuelConsumedL: fuel
        },
        include: { vehicle: true, driver: true }
      });

      const dbVehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
      const nextVehicleStatus = dbVehicle?.status === VehicleStatus.RETIRED ? VehicleStatus.RETIRED : VehicleStatus.AVAILABLE;

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: {
          status: nextVehicleStatus,
          odometer: { increment: distance }
        }
      });

      const dbDriver = await tx.driver.findUnique({ where: { id: trip.driverId } });
      const nextDriverStatus = dbDriver?.status === DriverStatus.SUSPENDED ? DriverStatus.SUSPENDED : DriverStatus.AVAILABLE;

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: nextDriverStatus }
      });

      return updated;
    });

    await invalidateDashboardCache();

    return res.json(updatedTrip);
  } catch (err) {
    console.error('Complete trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelTrip(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const trip = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId },
      include: { vehicle: true, driver: true }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Role check: DRIVER can only cancel their own trip
    if (user && user.role === Role.DRIVER) {
      const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
      if (!driver || trip.driverId !== driver.id) {
        return res.status(403).json({ error: 'Forbidden: You can only cancel trips assigned to you' });
      }
    }

    if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
      return res.status(400).json({ error: `Cannot cancel a trip that is already ${trip.status}` });
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id },
        data: {
          status: TripStatus.CANCELLED,
          cancelledAt: new Date()
        },
        include: { vehicle: true, driver: true }
      });

      if (trip.status === TripStatus.DISPATCHED) {
        const dbVehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
        const nextVehicleStatus = dbVehicle?.status === VehicleStatus.RETIRED ? VehicleStatus.RETIRED : VehicleStatus.AVAILABLE;
        
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: nextVehicleStatus }
        });

        const dbDriver = await tx.driver.findUnique({ where: { id: trip.driverId } });
        const nextDriverStatus = dbDriver?.status === DriverStatus.SUSPENDED ? DriverStatus.SUSPENDED : DriverStatus.AVAILABLE;

        await tx.driver.update({
          where: { id: trip.driverId },
          data: { status: nextDriverStatus }
        });
      }

      return updated;
    });

    await invalidateDashboardCache();

    return res.json(updatedTrip);
  } catch (err) {
    console.error('Cancel trip error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Trip Document attachments (BOL, POD, Receipt) using S3
export async function getTripDocuments(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const trip = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const documents = await prisma.tripDocument.findMany({
      where: { tripId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(documents);
  } catch (err) {
    console.error('Get trip documents error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadTripDocument(req: Request, res: Response) {
  const { id } = req.params;
  const { title, docType } = req.body;
  const user = (req as any).user;
  const file = req.file;

  if (!title || !docType) {
    return res.status(400).json({ error: 'Required fields: title, docType' });
  }
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const trip = await prisma.trip.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Upload to S3 (or fallback to local disk)
    const { s3Key, s3Url } = await uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      user.companyId
    );

    const document = await prisma.tripDocument.create({
      data: {
        tripId: id,
        title: title.trim(),
        docType: docType.trim(),
        s3Key,
        s3Url
      }
    });

    return res.status(201).json(document);
  } catch (err) {
    console.error('Upload trip document error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
