import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeDatabase } from './db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import farmsRoutes from './routes/farms.js';
import plotsRoutes from './routes/plots.js';
import cropsRoutes from './routes/crops.js';
import cropCyclesRoutes from './routes/cropCycles.js';
import inventoryRoutes from './routes/inventory.js';
import suppliersRoutes from './routes/suppliers.js';
import harvestsRoutes from './routes/harvests.js';
import salesRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes from './routes/reports.js';
import yieldTrendsRoutes from './routes/yieldTrends.js';
import weatherRoutes from './routes/weather.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      console.log(`[HTTP] ${req.method} ${req.url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/farms', farmsRoutes);
app.use('/api/plots', plotsRoutes);
app.use('/api/crops', cropsRoutes);
app.use('/api/crop-cycles', cropCyclesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/harvests', harvestsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/yield-trends', yieldTrendsRoutes);
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'FarmLedger DBMS Core',
    database: 'SQLite (Node standard engine with 3NF portable schema)',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static assets in production (if client/dist exists)
const clientDistPath = path.resolve(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database and start HTTP listener
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🌾 FarmLedger Server running at http://localhost:${PORT}`);
      console.log(`📡 API Endpoints ready at http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });
  })
  .catch((err) => {
    console.error('[DB Startup Failure]', err);
    process.exit(1);
  });

