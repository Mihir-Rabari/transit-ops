import { Request, Response } from 'express';
import prisma from '../config/db';
import { MaintenanceStatus, VehicleStatus } from '@prisma/client';
import { invalidateDashboardCache } from '../utils/cache';

export async function getAllMaintenanceLogs(req: Request, res: Response) {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, name: true, status: true }
        }
      },
      orderBy: { openedAt: 'desc' }
    });
    return res.json(logs);
  } catch (err) {
    console.error('Get all maintenance logs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createMaintenanceLog(req: Request, res: Response) {
  const { vehicleId, description, cost } = req.body;

  if (!vehicleId || !description) {
    return res.status(400).json({ error: 'Required fields: vehicleId, description' });
  }

  const logCost = cost !== undefined ? parseFloat(cost) : 0;

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.status === VehicleStatus.RETIRED) {
      return res.status(400).json({ error: 'Cannot create maintenance log for a RETIRED vehicle' });
    }

    // Transaction: Create maintenance log and set Vehicle status to IN_SHOP
    const log = await prisma.$transaction(async (tx) => {
      const createdLog = await tx.maintenanceLog.create({
        data: {
          vehicleId,
          description: description.trim(),
          cost: logCost,
          status: MaintenanceStatus.ACTIVE
        },
        include: { vehicle: true }
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: VehicleStatus.IN_SHOP }
      });

      return createdLog;
    });

    await invalidateDashboardCache();

    return res.status(201).json(log);
  } catch (err) {
    console.error('Create maintenance log error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function closeMaintenanceLog(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true }
    });

    if (!log) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    if (log.status !== MaintenanceStatus.ACTIVE) {
      return res.status(400).json({ error: 'Only ACTIVE maintenance logs can be closed' });
    }

    // Transaction: Close log and revert vehicle status (unless RETIRED)
    const updatedLog = await prisma.$transaction(async (tx) => {
      const closed = await tx.maintenanceLog.update({
        where: { id },
        data: {
          status: MaintenanceStatus.CLOSED,
          closedAt: new Date()
        },
        include: { vehicle: true }
      });

      // Get latest vehicle status
      const latestVehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
      
      if (latestVehicle && latestVehicle.status !== VehicleStatus.RETIRED) {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: VehicleStatus.AVAILABLE }
        });
      }

      return closed;
    });

    await invalidateDashboardCache();

    return res.json(updatedLog);
  } catch (err) {
    console.error('Close maintenance log error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
