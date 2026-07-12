import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

export async function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const key = `login-attempts:${email.toLowerCase().trim()}`;
  const maxAttempts = 5;
  const blockWindowSeconds = 300; // 5 minutes

  try {
    if (!redisClient.isOpen) {
      // Redis is not connected, skip rate limit check so service remains functional
      return next();
    }

    const attemptsVal = await redisClient.get(key);
    const attempts = attemptsVal ? parseInt(attemptsVal, 10) : 0;

    if (attempts >= maxAttempts) {
      const ttl = await redisClient.ttl(key);
      return res.status(429).json({
        error: `Too many login attempts. Account temporarily locked. Try again in ${ttl > 0 ? ttl : blockWindowSeconds} seconds.`
      });
    }

    // Increment attempts
    await redisClient.incr(key);
    // If it was the first attempt, set TTL
    if (attempts === 0) {
      await redisClient.expire(key, blockWindowSeconds);
    }

    next();
  } catch (err) {
    console.error('Rate limiter middleware error:', err);
    next(); // Fail-open: do not block users if Redis fails
  }
}
