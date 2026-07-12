import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { Role } from '@prisma/client';
import { sendCredentialsEmail } from '../utils/mailer';

export async function getAllUsers(req: Request, res: Response) {
  const user = (req as any).user;

  try {
    const users = await prisma.user.findMany({
      where: { companyId: user.companyId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            licenseNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
      driver: u.driver ? {
        id: u.driver.id,
        name: u.driver.name,
        licenseNumber: u.driver.licenseNumber
      } : null
    }));

    return res.json(result);
  } catch (err) {
    console.error('Get all users error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role, driverId } = req.body;
  const currentUser = (req as any).user;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Required fields: name, email, password, role' });
  }

  if (!Object.values(Role).includes(role as Role)) {
    return res.status(400).json({ error: 'Invalid user role' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      // 1. Create the user under the admin's companyId
      const createdUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: role as Role,
          companyId: currentUser.companyId
        }
      });

      // 2. Link to driver if role is DRIVER and driverId is provided
      if (role === Role.DRIVER && driverId) {
        // Disassociate other users linked to this driver first (clean link)
        await tx.driver.updateMany({
          where: { userId: createdUser.id },
          data: { userId: null }
        });
        
        await tx.driver.update({
          where: { id: driverId },
          data: { userId: createdUser.id }
        });
      }

      return createdUser;
    });

    // Send credentials to user via email (asynchronously)
    sendCredentialsEmail(user.email, user.name, user.role, password, currentUser.companyId).catch(console.error);

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, role, driverId, password } = req.body;
  const currentUser = (req as any).user;

  try {
    const user = await prisma.user.findFirst({
      where: { id, companyId: currentUser.companyId }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role && !Object.values(Role).includes(role as Role)) {
      return res.status(400).json({ error: 'Invalid user role' });
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (role !== undefined) data.role = role as Role;
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update User details
      const u = await tx.user.update({
        where: { id },
        data
      });

      // Handle driver link updates
      const targetRole = role || user.role;
      if (targetRole === Role.DRIVER) {
        if (driverId !== undefined) {
          // Break existing link for this user
          await tx.driver.updateMany({
            where: { userId: id },
            data: { userId: null }
          });
          
          if (driverId) {
            // Break existing link for the target driver
            await tx.driver.updateMany({
              where: { userId: { not: null }, id: driverId },
              data: { userId: null }
            });
            // Establish new link
            await tx.driver.update({
              where: { id: driverId },
              data: { userId: id }
            });
          }
        }
      } else {
        // If role was changed from DRIVER to something else, remove driver relation
        await tx.driver.updateMany({
          where: { userId: id },
          data: { userId: null }
        });
      }

      return u;
    });

    // If password was reset, send notification (or print to console)
    if (password) {
      sendCredentialsEmail(updatedUser.email, updatedUser.name, updatedUser.role, password, currentUser.companyId).catch(console.error);
    }

    return res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const currentUser = (req as any).user;

  try {
    const user = await prisma.user.findFirst({
      where: { id, companyId: currentUser.companyId }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting oneself
    if (currentUser && currentUser.id === id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    await prisma.$transaction(async (tx) => {
      // Disassociate driver first
      await tx.driver.updateMany({
        where: { userId: id },
        data: { userId: null }
      });
      // Delete user
      await tx.user.delete({ where: { id } });
    });

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
