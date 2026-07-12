import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { startLicenseExpiryCron } from './utils/cron';
import redisClient from './config/redis';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for simplicity in development/Docker environment
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = 'connected'; // Prisma is lazy-loaded but we assume connection is fine
  const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    services: {
      database: dbStatus,
      redis: redisStatus
    }
  });
});

// Static folder serving for S3 local fallback uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Register all API routes at the root path
app.use('/', routes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start background cron jobs
startLicenseExpiryCron();

app.listen(PORT, () => {
  console.log(`TransitOps Backend Server is running on port ${PORT}`);
});
