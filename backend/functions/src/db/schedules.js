/**
 * Refresh Schedules Service
 *
 * Manages weekly refresh schedules per market
 */

import { query, transaction } from './connection.js';

/**
 * Get all refresh schedules
 */
export async function getAllSchedules() {
  const queryText = `
    SELECT
      schedule_id,
      market,
      cron_expression,
      timezone,
      last_run_at,
      last_run_status,
      last_run_topics_processed,
      next_run_at,
      is_active,
      updated_by,
      updated_at,
      notes
    FROM refresh_schedules
    ORDER BY market
  `;

  const result = await query(queryText);

  return result.rows;
}

/**
 * Get schedule for specific market
 */
export async function getScheduleByMarket(market) {
  const queryText = `
    SELECT *
    FROM refresh_schedules
    WHERE market = $1
  `;

  const result = await query(queryText, [market]);

  return result.rows[0] || null;
}

/**
 * Update refresh schedule
 */
export async function updateSchedule(market, scheduleData, updatedBy) {
  const { cronExpression, timezone, isActive, notes } = scheduleData;

  return transaction(async (client) => {
    const updateQuery = `
      UPDATE refresh_schedules
      SET cron_expression = COALESCE($1, cron_expression),
          timezone = COALESCE($2, timezone),
          is_active = COALESCE($3, is_active),
          notes = COALESCE($4, notes),
          updated_by = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE market = $6
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      cronExpression,
      timezone,
      isActive,
      notes,
      updatedBy,
      market
    ]);

    if (result.rows.length === 0) {
      throw new Error(`Schedule not found for market: ${market}`);
    }

    // Log audit
    const auditQuery = `
      INSERT INTO audit_logs (
        user_email,
        action,
        resource_type,
        resource_id,
        details,
        market
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await client.query(auditQuery, [
      updatedBy,
      'schedule_updated',
      'refresh_schedule',
      result.rows[0].schedule_id,
      JSON.stringify({
        market,
        cronExpression,
        timezone,
        isActive
      }),
      market
    ]);

    return result.rows[0];
  });
}

/**
 * Record schedule run
 */
export async function recordScheduleRun(market, status, topicsProcessed, nextRunAt) {
  const queryText = `
    UPDATE refresh_schedules
    SET last_run_at = CURRENT_TIMESTAMP,
        last_run_status = $1,
        last_run_topics_processed = $2,
        next_run_at = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE market = $4
    RETURNING *
  `;

  const result = await query(queryText, [status, topicsProcessed, nextRunAt, market]);

  return result.rows[0];
}
