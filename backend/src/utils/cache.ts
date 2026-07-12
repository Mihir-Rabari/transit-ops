import redisClient from '../config/redis';

export async function invalidateDashboardCache() {
  try {
    if (redisClient.isOpen) {
      // Find all dashboard KPI keys
      const keys = await redisClient.keys('dashboard:kpis*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`Redis Dashboard KPI cache invalidated. Cleared keys: ${keys.join(', ')}`);
      }
    }
  } catch (err) {
    console.error('Error invalidating Redis dashboard cache:', err);
  }
}
