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
import { setupRoutes } from './api/routes.js';
import { weeklyRefresh } from './scheduler/refresh.js';

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
