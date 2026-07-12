import { Request, Response } from 'express';
import prisma from '../config/db';
import { DriverStatus } from '@prisma/client';
import { invalidateDashboardCache } from '../utils/cache';

export async function getAllDrivers(req: Request, res: Response) {
  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(drivers);
  } catch (err) {
    console.error('Get all drivers error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAvailableDrivers(req: Request, res: Response) {
  try {
    const today = new Date();
    // Exclude SUSPENDED, OFF_DUTY, ON_TRIP (status must be AVAILABLE)
    // Exclude drivers with expired licenses (licenseExpiryDate >= today)
    const drivers = await prisma.driver.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        licenseExpiryDate: {
          gt: today
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(drivers);
  } catch (err) {
    console.error('Get available drivers error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function addDriver(req: Request, res: Response) {
  const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore } = req.body;

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
    return res.status(400).json({ error: 'Required fields: name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber' });
  }

  try {
    const existingDriver = await prisma.driver.findUnique({
      where: { licenseNumber: licenseNumber.toUpperCase().trim() }
    });

    if (existingDriver) {
      return res.status(400).json({ error: `Driver with license number '${licenseNumber}' already registered` });
    }

    const driver = await prisma.driver.create({
      data: {
        name: name.trim(),
        licenseNumber: licenseNumber.toUpperCase().trim(),
        licenseCategory: licenseCategory.trim(),
        licenseExpiryDate: new Date(licenseExpiryDate),
        contactNumber: contactNumber.trim(),
        safetyScore: safetyScore !== undefined ? parseFloat(safetyScore) : 100,
        status: DriverStatus.AVAILABLE
      }
    });

    await invalidateDashboardCache();

    return res.status(201).json(driver);
  } catch (err) {
    console.error('Add driver error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateDriver(req: Request, res: Response) {
  const { id } = req.params;
  const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status } = req.body;

  try {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Validate status if updating
    if (status && !Object.values(DriverStatus).includes(status as DriverStatus)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${Object.values(DriverStatus).join(', ')}` });
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        licenseNumber: licenseNumber !== undefined ? licenseNumber.toUpperCase().trim() : undefined,
        licenseCategory: licenseCategory !== undefined ? licenseCategory.trim() : undefined,
        licenseExpiryDate: licenseExpiryDate !== undefined ? new Date(licenseExpiryDate) : undefined,
        contactNumber: contactNumber !== undefined ? contactNumber.trim() : undefined,
        safetyScore: safetyScore !== undefined ? parseFloat(safetyScore) : undefined,
        status: status !== undefined ? (status as DriverStatus) : undefined
      }
    });

    await invalidateDashboardCache();

    return res.json(updatedDriver);
  } catch (err) {
    console.error('Update driver error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
