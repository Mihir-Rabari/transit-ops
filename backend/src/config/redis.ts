import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';

const redisClient = createClient({
  url: redisUrl
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Immediately connect
redisClient.connect().catch((err) => {
  console.error('Failed to connect to Redis', err);
});

export default redisClient;
