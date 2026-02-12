import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
} else {
  dotenv.config();
}

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cron from 'node-cron';

// Models
import { Car } from './models/Car';
import { Reservation } from './models/Reservation';

// Routes
import carRoutes from './routes/cars';
import reservationRoutes from './routes/reservations';
import authRoutes from './routes/auth';
import settingRoutes from './routes/settings';

// Mail Service
import { sendEmail } from './services/mail.service';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Dynamic IP Detection
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const nameLower = name.toLowerCase();
    // Ignorar interfaces virtuales comunes por nombre
    if (nameLower.includes('virtual') ||
      nameLower.includes('docker') ||
      nameLower.includes('vbox') ||
      nameLower.includes('vmware') ||
      nameLower.includes('wsl') ||
      nameLower.includes('pseudo') ||
      nameLower.includes('host-only')) {
      continue;
    }

    const ifaceList = interfaces[name];
    if (ifaceList) {
      for (const iface of ifaceList) {
        // Ignorar IPv6, interfaces internas y rangos virtuales conocidos por IP
        if (iface.family === 'IPv4' && !iface.internal) {
          // 192.168.56.x es clásicamente VirtualBox Host-Only
          if (iface.address.startsWith('192.168.56.')) continue;

          candidates.push(iface.address);
        }
      }
    }
  }

  // Priorizar rangos comunes de hogar (192.168.0.x, 192.168.1.x, etc.)
  // Intentamos buscar uno que no sea el de VirtualBox (que ya filtramos arriba)
  const preferred = candidates.find(ip =>
    (ip.startsWith('192.168.') && !ip.startsWith('192.168.56.')) ||
    ip.startsWith('10.0.') ||
    ip.startsWith('172.16.')
  );

  return preferred || candidates[0] || 'localhost';
}

const localIp = getLocalIp();
if (process.env.NODE_ENV !== 'production') {
  process.env.FRONTEND_URL = `http://${localIp}:5173`;
  console.log(`[DEV] Dynamic FRONTEND_URL set to: ${process.env.FRONTEND_URL}`);
}

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-dealer-dev';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Register Routes
app.use('/api/cars', carRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// --- CRON JOBS ---

// Every 5 minutes: Check Expired Reservations
cron.schedule('*/5 * * * *', async () => {
  console.log('[CRON] Checking expired reservations...');
  const now = new Date();

  const expiredReservations = await Reservation.find({
    status: 'CONFIRMED',
    expiresAt: { $lt: now }
  });

  for (const resv of expiredReservations) {
    resv.status = 'EXPIRED';
    await resv.save();

    const car = await Car.findById(resv.carId);
    if (car) {
      car.status = 'AVAILABLE';
      car.history.push({
        event: 'EXPIRATION',
        date: new Date(),
        details: `Reservation for ${resv.userEmail} expired automatically.`
      });
      await car.save();

      // Notify waitlist
      const { notifyWaitlist } = require('./services/waitlist.service');
      notifyWaitlist(car._id, 'AVAILABLE');
    }
    console.log(`[CRON] Reservation ${resv._id} marked as EXPIRED.`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('-----------------------------------------');
  console.log(`Backend: http://${localIp}:${PORT}`);
  console.log(`Frontend: http://${localIp}:5173`);
  console.log('-----------------------------------------');
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
