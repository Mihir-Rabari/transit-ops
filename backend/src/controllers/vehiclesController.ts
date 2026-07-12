import { Request, Response } from 'express';
import prisma from '../config/db';
import { VehicleStatus } from '@prisma/client';
import { invalidateDashboardCache } from '../utils/cache';

export async function getAllVehicles(req: Request, res: Response) {
  const user = (req as any).user;

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId: user.companyId },
      include: {
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = vehicles.map((v) => {
      const fuelCost = v.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const expenseCost = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalOperationalCost = fuelCost + maintenanceCost + expenseCost;

      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        type: v.type,
        maxLoadCapacityKg: v.maxLoadCapacityKg,
        odometer: v.odometer,
        acquisitionCost: v.acquisitionCost,
        status: v.status,
        region: v.region,
        createdAt: v.createdAt,
        totalOperationalCost,
        fuelCost,
        maintenanceCost,
        expenseCost
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Get all vehicles error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAvailableVehicles(req: Request, res: Response) {
  const user = (req as any).user;

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { 
        status: VehicleStatus.AVAILABLE,
        companyId: user.companyId 
      },
      orderBy: { name: 'asc' }
    });
    return res.json(vehicles);
  } catch (err) {
    console.error('Get available vehicles error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function registerVehicle(req: Request, res: Response) {
  const { registrationNumber, name, type, maxLoadCapacityKg, odometer, acquisitionCost, region } = req.body;
  const user = (req as any).user;

  if (!registrationNumber || !name || !type || maxLoadCapacityKg === undefined || acquisitionCost === undefined) {
    return res.status(400).json({ error: 'Required fields: registrationNumber, name, type, maxLoadCapacityKg, acquisitionCost' });
  }

  try {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { 
        registrationNumber: registrationNumber.toUpperCase().trim(),
        companyId: user.companyId 
      }
    });

    if (existingVehicle) {
      return res.status(400).json({ error: `Vehicle with registration number '${registrationNumber}' already exists` });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber: registrationNumber.toUpperCase().trim(),
        name: name.trim(),
        type: type.trim(),
        maxLoadCapacityKg: parseFloat(maxLoadCapacityKg),
        odometer: odometer ? parseFloat(odometer) : 0,
        acquisitionCost: parseFloat(acquisitionCost),
        region: region ? region.trim() : null,
        status: VehicleStatus.AVAILABLE,
        companyId: user.companyId
      }
    });

    await invalidateDashboardCache();

    return res.status(201).json(vehicle);
  } catch (err: any) {
    console.error('Register vehicle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateVehicle(req: Request, res: Response) {
  const { id } = req.params;
  const { name, type, maxLoadCapacityKg, odometer, acquisitionCost, status, region } = req.body;
  const user = (req as any).user;

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Validate status if updating
    if (status && !Object.values(VehicleStatus).includes(status as VehicleStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${Object.values(VehicleStatus).join(', ')}` });
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        type: type !== undefined ? type.trim() : undefined,
        maxLoadCapacityKg: maxLoadCapacityKg !== undefined ? parseFloat(maxLoadCapacityKg) : undefined,
        odometer: odometer !== undefined ? parseFloat(odometer) : undefined,
        acquisitionCost: acquisitionCost !== undefined ? parseFloat(acquisitionCost) : undefined,
        status: status !== undefined ? (status as VehicleStatus) : undefined,
        region: region !== undefined ? (region ? region.trim() : null) : undefined
      }
    });

    await invalidateDashboardCache();

    return res.json(updatedVehicle);
  } catch (err) {
    console.error('Update vehicle error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Vehicle documents metadata management
export async function getVehicleDocuments(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const documents = await prisma.vehicleDocument.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(documents);
  } catch (err) {
    console.error('Get vehicle documents error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadVehicleDocument(req: Request, res: Response) {
  const { id } = req.params;
  const { title, docType, expiryDate } = req.body;
  const user = (req as any).user;

  if (!title || !docType || !expiryDate) {
    return res.status(400).json({ error: 'Required fields: title, docType, expiryDate' });
  }

  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const document = await prisma.vehicleDocument.create({
      data: {
        vehicleId: id,
        title: title.trim(),
        docType: docType.trim(),
        expiryDate: new Date(expiryDate)
      }
    });

    return res.status(201).json(document);
  } catch (err) {
    console.error('Upload vehicle document error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
