import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.js';
import worldRoutes from './routes/world.js';
import walletRoutes from './routes/wallet.js';
import scoreRoutes from './routes/scores.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import { onRequest } from 'firebase-functions/v2/https';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth/world', worldRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export const api = onRequest({ invoker: 'public' }, app);

export * from './cron.js';

export default app;
