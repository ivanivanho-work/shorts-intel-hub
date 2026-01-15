/**
 * Shorts Intel Hub - Cloud Functions Entry Point
 *
 * Main entry point for all Cloud Functions
 */

import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupRoutes } from './api/implemented-routes.js';
import { initializeDatabase } from './db/connection.js';
import 'dotenv/config';
import { weeklyRefresh } from './scheduler/refresh.js';

// Initialize database connection
await initializeDatabase().catch(err => {
  console.error('Database initialization failed:', err);
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'shorts-intel-hub',
    version: '1.0.0'
  });
});

// Setup API routes
setupRoutes(app);

// For local development server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Shorts Intel Hub API
━━━━━━━━━━━━━━━━━━━━━━━━
Server: http://localhost:${PORT}
Health: http://localhost:${PORT}/health
API:    http://localhost:${PORT}/api
━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Export HTTP function
export const api = onRequest(
  {
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    maxInstances: 10
  },
  app
);

// Export scheduled functions
export const weeklyRefreshJob = onSchedule(
  {
    schedule: 'every monday 06:00',
    timeZone: 'UTC',
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540
  },
  weeklyRefresh
);

// Export individual function modules (for future expansion)
export * from './ingestion/upload.js';
export * from './processing/normalize.js';
export * from './ranking/calculate.js';
export * from './mcp/bridge.js';
