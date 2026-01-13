/**
 * File Uploads Service
 *
 * Tracks agency and music team file uploads
 */

import { query, transaction } from './connection.js';

/**
 * Create upload record
 */
export async function createUpload(uploadData) {
  const {
    filename,
    fileSize,
    fileType,
    source,
    market = null,
    storagePath,
    storageBucket,
    uploadedBy = null,
    rawContent = null
  } = uploadData;

  const queryText = `
    INSERT INTO file_uploads (
      filename,
      file_size,
      file_type,
      source,
      market,
      storage_path,
      storage_bucket,
      uploaded_by,
      raw_content,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'uploaded')
    RETURNING *
  `;

  const params = [
    filename,
    fileSize,
    fileType,
    source,
    market,
    storagePath,
    storageBucket,
    uploadedBy,
    rawContent
  ];

  const result = await query(queryText, params);

  return result.rows[0];
}

/**
 * Get uploads with filters
 */
export async function getUploads(filters = {}) {
  const {
    source,
    market,
    status,
    limit = 50,
    offset = 0
  } = filters;

  let whereConditions = [];
  const params = [];
  let paramCounter = 1;

  if (source) {
    params.push(source);
    whereConditions.push(`source = $${paramCounter++}`);
  }

  if (market) {
    params.push(market);
    whereConditions.push(`market = $${paramCounter++}`);
  }

  if (status) {
    params.push(status);
    whereConditions.push(`status = $${paramCounter++}`);
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const queryText = `
    SELECT
      upload_id,
      filename,
      file_size,
      file_type,
      source,
      market,
      status,
      topics_created,
      uploaded_by,
      uploaded_at,
      processed_at,
      error_message
    FROM file_uploads
    ${whereClause}
    ORDER BY uploaded_at DESC
    LIMIT $${paramCounter++}
    OFFSET $${paramCounter++}
  `;

  params.push(limit, offset);

  const result = await query(queryText, params);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM file_uploads
    ${whereClause}
  `;

  const countResult = await query(countQuery, params.slice(0, -2));

  return {
    uploads: result.rows,
    pagination: {
      limit,
      offset,
      total: parseInt(countResult.rows[0].total)
    }
  };
}

/**
 * Get upload by ID
 */
export async function getUploadById(uploadId) {
  const queryText = `
    SELECT *
    FROM file_uploads
    WHERE upload_id = $1
  `;

  const result = await query(queryText, [uploadId]);

  return result.rows[0] || null;
}

/**
 * Update upload status
 */
export async function updateUploadStatus(uploadId, status, updates = {}) {
  const {
    topicsCreated = null,
    errorMessage = null,
    parsedData = null
  } = updates;

  const queryText = `
    UPDATE file_uploads
    SET status = $1,
        processed_at = CASE WHEN $1 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE processed_at END,
        topics_created = COALESCE($2, topics_created),
        error_message = $3,
        parsed_data = COALESCE($4, parsed_data)
    WHERE upload_id = $5
    RETURNING *
  `;

  const result = await query(queryText, [
    status,
    topicsCreated,
    errorMessage,
    parsedData ? JSON.stringify(parsedData) : null,
    uploadId
  ]);

  return result.rows[0];
}
