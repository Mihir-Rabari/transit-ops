import { Request, Response } from 'express';
import prisma from '../config/db';
import { TripStatus } from '@prisma/client';

export async function getFuelEfficiencyReport(req: Request, res: Response) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: {
          where: {
            status: TripStatus.COMPLETED,
            actualDistanceKm: { not: null },
            fuelConsumedL: { not: null }
          }
        }
      }
    });

    const report = vehicles.map((v) => {
      let totalDistance = 0;
      let totalFuel = 0;

      v.trips.forEach((t) => {
        totalDistance += t.actualDistanceKm || 0;
        totalFuel += t.fuelConsumedL || 0;
      });

      const efficiency = totalFuel > 0 ? parseFloat((totalDistance / totalFuel).toFixed(2)) : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        totalDistance,
        totalFuel,
        efficiency // km per Liter
      };
    });

    return res.json(report);
  } catch (err) {
    console.error('Fuel efficiency report error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUtilizationReport(req: Request, res: Response) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: true
      }
    });

    const report = vehicles.map((v) => {
      const totalTrips = v.trips.length;
      const completedTrips = v.trips.filter((t) => t.status === TripStatus.COMPLETED).length;
      const activeTrips = v.trips.filter((t) => t.status === TripStatus.DISPATCHED).length;
      const cancelledTrips = v.trips.filter((t) => t.status === TripStatus.CANCELLED).length;

      // Simple metric: percentage of trips completed vs created (excluding cancelled)
      const divisor = totalTrips - cancelledTrips;
      const tripUtilizationRate = divisor > 0 ? parseFloat(((completedTrips + activeTrips) / divisor * 100).toFixed(1)) : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        type: v.type,
        status: v.status,
        totalTrips,
        completedTrips,
        activeTrips,
        tripUtilizationRate
      };
    });

    return res.json(report);
  } catch (err) {
    console.error('Utilization report error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getROIReport(req: Request, res: Response) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
        trips: {
          where: {
            status: TripStatus.COMPLETED,
            actualDistanceKm: { not: null }
          }
        }
      }
    });

    const report = vehicles.map((v) => {
      const fuelCost = v.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const expenseCost = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalOperationalCost = fuelCost + maintenanceCost + expenseCost;

      // Estimated Revenue = SUM( cargoWeightKg * actualDistanceKm * 0.05 )
      const estimatedRevenue = v.trips.reduce((sum, trip) => {
        const distance = trip.actualDistanceKm || 0;
        const cargo = trip.cargoWeightKg || 0;
        return sum + (cargo * distance * 0.05);
      }, 0);

      const netProfit = estimatedRevenue - totalOperationalCost;
      const roi = v.acquisitionCost > 0 ? parseFloat((netProfit / v.acquisitionCost * 100).toFixed(2)) : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        acquisitionCost: v.acquisitionCost,
        fuelCost,
        maintenanceCost,
        expenseCost,
        totalOperationalCost,
        estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        roi
      };
    });

    return res.json(report);
  } catch (err) {
    console.error('ROI report error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function exportCSVReport(req: Request, res: Response) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
        expenses: { select: { amount: true } },
        trips: {
          where: {
            status: TripStatus.COMPLETED,
            actualDistanceKm: { not: null }
          }
        }
      }
    });

    // Generate CSV contents
    const headers = [
      'Registration Number',
      'Name',
      'Type',
      'Odometer (km)',
      'Status',
      'Acquisition Cost ($)',
      'Fuel Cost ($)',
      'Maintenance Cost ($)',
      'Expenses ($)',
      'Total Operational Cost ($)',
      'Estimated Revenue ($)',
      'Net Profit ($)',
      'ROI (%)'
    ];

    const rows = vehicles.map((v) => {
      const fuelCost = v.fuelLogs.reduce((sum, log) => sum + log.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
      const expenseCost = v.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalOperationalCost = fuelCost + maintenanceCost + expenseCost;

      const estimatedRevenue = v.trips.reduce((sum, trip) => {
        const distance = trip.actualDistanceKm || 0;
        const cargo = trip.cargoWeightKg || 0;
        return sum + (cargo * distance * 0.05);
      }, 0);

      const netProfit = estimatedRevenue - totalOperationalCost;
      const roi = v.acquisitionCost > 0 ? (netProfit / v.acquisitionCost * 100).toFixed(2) : '0.00';

      return [
        v.registrationNumber,
        `"${v.name.replace(/"/g, '""')}"`,
        v.type,
        v.odometer,
        v.status,
        v.acquisitionCost,
        fuelCost,
        maintenanceCost,
        expenseCost,
        totalOperationalCost,
        estimatedRevenue.toFixed(2),
        netProfit.toFixed(2),
        roi
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops_fleet_report.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('Export CSV report error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
