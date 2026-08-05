import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';

// Import routes
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import scoreRoutes from './routes/scores.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in production, or set to specific domain later
  credentials: true
}));
app.use(express.json());

// Routes
// Note: when Firebase Hosting rewrites /api/** to this function, 
// the request path will still include /api, so we keep /api prefixes.
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

// Export the express app as a Firebase Cloud Function named "api"
export const api = onRequest(app);

// Also export any cron jobs from cron.js here
export * from './cron.js';
