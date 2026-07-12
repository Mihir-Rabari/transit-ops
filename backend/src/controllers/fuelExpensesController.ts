import { Request, Response } from 'express';
import prisma from '../config/db';
import { invalidateDashboardCache } from '../utils/cache';

// Fuel logs
export async function getAllFuelLogs(req: Request, res: Response) {
  try {
    const logs = await prisma.fuelLog.findMany({
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, name: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return res.json(logs);
  } catch (err) {
    console.error('Get all fuel logs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFuelLog(req: Request, res: Response) {
  const { vehicleId, liters, cost, date } = req.body;

  if (!vehicleId || liters === undefined || cost === undefined) {
    return res.status(400).json({ error: 'Required fields: vehicleId, liters, cost' });
  }

  const lts = parseFloat(liters);
  const val = parseFloat(cost);

  if (isNaN(lts) || lts <= 0) {
    return res.status(400).json({ error: 'liters must be a positive number' });
  }
  if (isNaN(val) || val <= 0) {
    return res.status(400).json({ error: 'cost must be a positive number' });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        liters: lts,
        cost: val,
        date: date ? new Date(date) : new Date()
      },
      include: { vehicle: true }
    });

    await invalidateDashboardCache();

    return res.status(201).json(log);
  } catch (err) {
    console.error('Create fuel log error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Expenses
export async function getAllExpenses(req: Request, res: Response) {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        vehicle: {
          select: { id: true, registrationNumber: true, name: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return res.json(expenses);
  } catch (err) {
    console.error('Get all expenses error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createExpense(req: Request, res: Response) {
  const { vehicleId, type, amount, date } = req.body;

  if (!vehicleId || !type || amount === undefined) {
    return res.status(400).json({ error: 'Required fields: vehicleId, type, amount' });
  }

  const val = parseFloat(amount);
  if (isNaN(val) || val <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        type: type.trim(),
        amount: val,
        date: date ? new Date(date) : new Date()
      },
      include: { vehicle: true }
    });

    await invalidateDashboardCache();

    return res.status(201).json(expense);
  } catch (err) {
    console.error('Create expense error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
