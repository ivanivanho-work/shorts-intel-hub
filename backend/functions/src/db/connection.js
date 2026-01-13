/**
 * Database Connection Module
 *
 * Handles PostgreSQL connection with pgvector support
 */

import pg from 'pg';
import { Connector } from '@google-cloud/sql-connector';

const { Pool } = pg;

let pool = null;
let connector = null;

/**
 * Initialize database connection
 */
export async function initializeDatabase() {
  if (pool) {
    return pool;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Use Cloud SQL Connector for production
    connector = new Connector();
    const clientOpts = await connector.getOptions({
      instanceConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME,
      authType: 'IAM'
    });

    pool = new Pool({
      ...clientOpts,
      user: process.env.DB_USER || 'postgres',
      database: process.env.DB_NAME || 'shorts_intel_hub',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  } else {
    // Use direct connection for local development (via Cloud SQL Proxy)
    pool = new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'shorts_intel_hub',
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }

  // Test connection
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  return pool;
}

/**
 * Get database pool
 */
export function getPool() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (connector) {
    connector.close();
    connector = null;
  }
  console.log('Database connection closed');
}

/**
 * Execute query with error handling
 */
export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('Query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute transaction
 */
export async function transaction(callback) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check
 */
export async function healthCheck() {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    return {
      healthy: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message
    };
  }
}
