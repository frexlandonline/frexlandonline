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
import { startCron } from './cron.js';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Solo iniciar el servidor web si este archivo se ejecuta directamente (no si es importado por Firebase)
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const isMainModule = process.argv[1] && (process.argv[1].endsWith('server/index.js') || process.argv[1].endsWith('server\\index.js'));

if (isMainModule) {
  // Start Cron Jobs locally
  startCron();
  
  app.listen(PORT, () => {
    console.log(`\n🚀 BlockDrop API server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
  });
}

export let api;

if (!isMainModule) {
  const { onRequest } = await import('firebase-functions/v2/https');
  // Export the express app as a Firebase Cloud Function named "api"
  api = onRequest({ invoker: 'public' }, app);
}

// Also export any cron jobs from cron.js here
export * from './cron.js';

export default app;
