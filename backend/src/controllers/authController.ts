import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';
import redisClient from '../config/redis';
import { Role } from '@prisma/client';
import { sendWelcomeEmail, sendLoginAlertEmail } from '../utils/mailer';

const JWT_SECRET = process.env.JWT_SECRET || 'transitops_access_secret_token_99887766';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'transitops_refresh_secret_token_11223344';

// JWT TTL configurations (seconds)
const REFRESH_EXPIRY_SEC = 604800; // 7 days

function generateAccessToken(user: { id: string; email: string; role: Role; companyId: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user: { id: string; email: string; role: Role; companyId: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req: Request, res: Response) {
  const { email, password, name, companyName } = req.body;

  if (!email || !password || !name || !companyName) {
    return res.status(400).json({ error: 'All fields (email, password, name, companyName) are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create Company and Admin user in transaction
    const { company, user } = await prisma.$transaction(async (tx) => {
      // 1. Create company
      const createdCompany = await tx.company.create({
        data: { name: companyName.trim() }
      });

      // 2. Create admin user
      const createdUser = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name.trim(),
          role: Role.ADMIN,
          companyId: createdCompany.id
        }
      });

      return { company: createdCompany, user: createdUser };
    });

    // Send welcome email (asynchronously)
    sendWelcomeEmail(user.email, user.name, company.id).catch(console.error);

    return res.status(201).json({
      message: 'Company and Administrator registered successfully',
      tenantId: company.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  const { tenantId, email, password } = req.body;

  if (!tenantId || !email || !password) {
    return res.status(400).json({ error: 'Tenant ID, email, and password are required' });
  }

  const lowercaseEmail = email.toLowerCase().trim();

  try {
    // 1. Verify company exists
    const company = await prisma.company.findUnique({ where: { id: tenantId } });
    if (!company) {
      return res.status(401).json({ error: 'Invalid Tenant ID' });
    }

    // 2. Find user in the company partition
    const user = await prisma.user.findFirst({
      where: {
        email: lowercaseEmail,
        companyId: tenantId
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset rate-limiter attempts on successful login
    const rateLimiterKey = `login-attempts:${lowercaseEmail}`;
    if (redisClient.isOpen) {
      await redisClient.del(rateLimiterKey).catch(console.error);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in Redis
    if (redisClient.isOpen) {
      await redisClient.setEx(`refresh:${user.id}`, REFRESH_EXPIRY_SEC, refreshToken);
    }

    // Send login alert (asynchronously)
    sendLoginAlertEmail(user.email, user.name).catch(console.error);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { 
      id: string; 
      email: string; 
      role: Role; 
      companyId: string 
    };

    // Check Redis session store
    if (redisClient.isOpen) {
      const storedToken = await redisClient.get(`refresh:${decoded.id}`);
      if (!storedToken || storedToken !== refreshToken) {
        return res.status(401).json({ error: 'Session expired or invalid refresh token' });
      }
    }

    // Retrieve fresh user info
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token in Redis
    if (redisClient.isOpen) {
      await redisClient.setEx(`refresh:${user.id}`, REFRESH_EXPIRY_SEC, newRefreshToken);
    }

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

export async function logout(req: Request, res: Response) {
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (redisClient.isOpen) {
      await redisClient.del(`refresh:${user.id}`);
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
