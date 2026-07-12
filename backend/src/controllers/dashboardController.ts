import { Request, Response } from 'express';
import prisma from '../config/db';
import redisClient from '../config/redis';
import { VehicleStatus, DriverStatus, TripStatus } from '@prisma/client';

export async function getDashboardKPIs(req: Request, res: Response) {
  const { type, status, region } = req.query;
  const user = (req as any).user;

  // Build a unique Redis cache key scoped by companyId
  const cacheParams = [];
  if (type) cacheParams.push(`type=${type}`);
  if (status) cacheParams.push(`status=${status}`);
  if (region) cacheParams.push(`region=${region}`);
  
  const cacheKey = `dashboard:kpis:${user.companyId}:${cacheParams.sort().join('&') || 'default'}`;
  const cacheTTL = 15; // 15 seconds

  try {
    // Try to get from Redis
    if (redisClient.isOpen) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`Serving dashboard KPIs from Redis cache for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }
    }

    // Build Prisma query filters scoped to companyId
    const vehicleWhere: any = { companyId: user.companyId };
    if (type) vehicleWhere.type = type as string;
    if (status) vehicleWhere.status = status as VehicleStatus;
    if (region) vehicleWhere.region = region as string;

    const tripWhere: any = { companyId: user.companyId };
    if (type || region) {
      tripWhere.vehicle = {};
      if (type) tripWhere.vehicle.type = type as string;
      if (region) tripWhere.vehicle.region = region as string;
    }

    const driverWhere: any = { companyId: user.companyId };
    if (region) {
      driverWhere.trips = {
        some: {
          status: TripStatus.DISPATCHED,
          vehicle: { region: region as string }
        }
      };
    }

    // Query counts in parallel
    const [
      totalVehicles,
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      retiredVehicles,
      totalDrivers,
      activeDrivers,
      availableDrivers,
      activeTrips,
      pendingTrips
    ] = await Promise.all([
      prisma.vehicle.count({ where: vehicleWhere }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.ON_TRIP } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.AVAILABLE } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.IN_SHOP } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.RETIRED } }),
      prisma.driver.count({ where: driverWhere }),
      prisma.driver.count({ where: { ...driverWhere, status: DriverStatus.ON_TRIP } }),
      prisma.driver.count({ where: { ...driverWhere, status: DriverStatus.AVAILABLE } }),
      prisma.trip.count({ where: { ...tripWhere, status: TripStatus.DISPATCHED } }),
      prisma.trip.count({ where: { ...tripWhere, status: TripStatus.DRAFT } })
    ]);

    const utilization = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    const kpis = {
      totalVehicles,
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      retiredVehicles,
      totalDrivers,
      activeDrivers, // Drivers On Duty
      availableDrivers,
      activeTrips,
      pendingTrips,
      utilization
    };

    // Cache in Redis
    if (redisClient.isOpen) {
      await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(kpis));
    }

    return res.json(kpis);
  } catch (err) {
    console.error('Get dashboard KPIs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
