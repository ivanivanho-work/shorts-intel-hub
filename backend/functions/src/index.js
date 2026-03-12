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
import { setupMatchingRoutes } from './api/topic-matching-routes.js';
import { setupRankingRoutes } from './api/ranking-routes.js';
import { initializeDatabase } from './db/connection.js';
import 'dotenv/config';
import { weeklyRefresh } from './scheduler/refresh.js';

// Initialize Express app
const app = express();

// Initialize database connection (optional for Alpha MVP)
// Done after app creation to avoid top-level await issues
initializeDatabase().catch(err => {
  console.warn('⚠️  Database not available - API will use fallback responses');
  console.warn('To enable database, ensure PostgreSQL is running on port 5432');
});

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
setupMatchingRoutes(app);
setupRankingRoutes(app);

// For local development server only (not during Firebase deployment analysis)
if (process.env.NODE_ENV !== 'production' && !process.env.FUNCTIONS_EMULATOR) {
  const PORT = process.env.PORT || 3000;
  // Only start server if explicitly running dev script
  if (process.argv[1]?.includes('index.js')) {
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
    maxInstances: 10,
    secrets: [],
    // Cloud SQL connection
    vpc: {
      connector: null, // Automatically managed
      egressSettings: 'PRIVATE_RANGES_ONLY'
    }
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
