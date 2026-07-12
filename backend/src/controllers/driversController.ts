import { Request, Response } from 'express';
import prisma from '../config/db';
import { DriverStatus } from '@prisma/client';
import { invalidateDashboardCache } from '../utils/cache';
import { uploadFile } from '../utils/s3';

export async function getAllDrivers(req: Request, res: Response) {
  const user = (req as any).user;

  try {
    const drivers = await prisma.driver.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(drivers);
  } catch (err) {
    console.error('Get all drivers error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAvailableDrivers(req: Request, res: Response) {
  const user = (req as any).user;

  try {
    const today = new Date();
    const drivers = await prisma.driver.findMany({
      where: {
        status: DriverStatus.AVAILABLE,
        companyId: user.companyId,
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
  const user = (req as any).user;

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
    return res.status(400).json({ error: 'Required fields: name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber' });
  }

  try {
    const existingDriver = await prisma.driver.findFirst({
      where: { 
        licenseNumber: licenseNumber.toUpperCase().trim(),
        companyId: user.companyId
      }
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
        status: DriverStatus.AVAILABLE,
        companyId: user.companyId
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
  const user = (req as any).user;

  try {
    const driver = await prisma.driver.findFirst({
      where: { id, companyId: user.companyId }
    });
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

// Driver Document Management (using S3 Uploads)
export async function getDriverDocuments(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const driver = await prisma.driver.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const documents = await prisma.driverDocument.findMany({
      where: { driverId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(documents);
  } catch (err) {
    console.error('Get driver documents error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadDriverDocument(req: Request, res: Response) {
  const { id } = req.params;
  const { title, docType, expiryDate } = req.body;
  const user = (req as any).user;
  const file = req.file;

  if (!title || !docType) {
    return res.status(400).json({ error: 'Required fields: title, docType' });
  }
  if (!file) {
    return res.status(400).json({ error: 'No document file uploaded' });
  }

  try {
    const driver = await prisma.driver.findFirst({
      where: { id, companyId: user.companyId }
    });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Upload to S3 (or fallback to local disk)
    const { s3Key, s3Url } = await uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      user.companyId
    );

    const document = await prisma.driverDocument.create({
      data: {
        driverId: id,
        title: title.trim(),
        docType: docType.trim(),
        s3Key,
        s3Url,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });

    return res.status(201).json(document);
  } catch (err) {
    console.error('Upload driver document error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
