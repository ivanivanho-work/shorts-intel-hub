/**
 * File Upload Handler
 *
 * Handles bulk file uploads (CSV/JSON) for Internal and External data tracks.
 * Parses file content, stores raw files to Firebase Storage, and creates
 * topic entries ready for the matching pipeline.
 */

import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { createTopic } from '../db/topics.js';
import { query } from '../db/connection.js';

// Initialize firebase-admin only if not already initialized
if (!admin.apps.length) admin.initializeApp();

const VALID_MARKETS = ['JP', 'KR', 'IN', 'ID', 'AUNZ'];
const VALID_TRACKS = ['internal', 'external'];
const REQUIRED_FIELDS = ['topicName', 'description', 'targetDemo', 'referenceLink'];

/**
 * Parse CSV content into an array of objects.
 * Handles quoted fields, commas within quotes, and newlines within quotes.
 * No external dependencies.
 *
 * @param {string} csvContent - Raw CSV string with headers
 * @returns {{ records: Object[], errors: string[] }}
 */
export function parseCSV(csvContent) {
  const errors = [];
  const lines = [];
  let current = '';
  let inQuotes = false;

  // Split into lines, respecting quoted newlines
  for (let i = 0; i < csvContent.length; i++) {
    const ch = csvContent[i];
    if (ch === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && i + 1 < csvContent.length && csvContent[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if ((ch === '\n' || (ch === '\r' && csvContent[i + 1] === '\n')) && !inQuotes) {
      lines.push(current.trim());
      current = '';
      if (ch === '\r') i++; // skip \n in \r\n
    } else if (ch === '\r' && !inQuotes) {
      lines.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    lines.push(current.trim());
  }

  if (lines.length < 2) {
    errors.push('CSV must have a header row and at least one data row');
    return { records: [], errors };
  }

  // Parse a single CSV line into fields
  function parseLine(line) {
    const fields = [];
    let field = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (ch === ',' && !insideQuotes) {
        fields.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.trim());

  // Validate required headers exist
  for (const req of REQUIRED_FIELDS) {
    if (!headers.includes(req)) {
      errors.push(`Missing required CSV column: "${req}"`);
    }
  }
  if (errors.length > 0) {
    return { records: [], errors };
  }

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue; // skip empty lines

    const values = parseLine(lines[i]);
    const record = {};

    headers.forEach((header, idx) => {
      const value = idx < values.length ? values[idx] : '';
      if (header === 'hashtags') {
        // Semicolon-separated hashtags
        record[header] = value
          ? value.split(';').map(h => h.trim()).filter(Boolean)
          : [];
      } else {
        record[header] = value;
      }
    });

    // Validate required fields on this record
    const rowErrors = [];
    for (const req of REQUIRED_FIELDS) {
      if (!record[req]) {
        rowErrors.push(`Row ${i + 1}: missing "${req}"`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      records.push(record);
    }
  }

  return { records, errors };
}

/**
 * Parse JSON content into an array of topic objects.
 *
 * @param {string} jsonContent - Raw JSON string (object or array)
 * @returns {{ records: Object[], errors: string[] }}
 */
export function parseJSON(jsonContent) {
  const errors = [];

  let parsed;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (e) {
    return { records: [], errors: [`Invalid JSON: ${e.message}`] };
  }

  // Normalize to array
  const items = Array.isArray(parsed) ? parsed : [parsed];

  const records = [];

  items.forEach((item, idx) => {
    const rowErrors = [];

    for (const req of REQUIRED_FIELDS) {
      if (!item[req]) {
        rowErrors.push(`Item ${idx + 1}: missing "${req}"`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      // Normalize hashtags to array if present
      if (item.hashtags && typeof item.hashtags === 'string') {
        item.hashtags = item.hashtags.split(';').map(h => h.trim()).filter(Boolean);
      }
      if (!item.hashtags) {
        item.hashtags = [];
      }
      records.push(item);
    }
  });

  return { records, errors };
}

/**
 * Upload raw file content and parsed JSON to Firebase Storage.
 *
 * @param {string} fileContent - Raw file content (CSV or JSON string)
 * @param {Object[]} parsedRecords - Parsed topic records
 * @param {string} fileName - Original file name
 * @param {string} sourceTrack - 'internal' or 'external'
 * @param {string} market - Market code
 * @returns {Promise<{ rawUrl: string, parsedUrl: string }>}
 */
export async function uploadToStorage(fileContent, parsedRecords, fileName, sourceTrack, market) {
  const bucket = admin.storage().bucket();
  const datePrefix = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const basePath = `uploads/${sourceTrack}/${market}/${datePrefix}`;

  // Upload raw file
  const rawPath = `${basePath}/${fileName}`;
  const rawFile = bucket.file(rawPath);
  await rawFile.save(fileContent, {
    contentType: fileName.endsWith('.csv') ? 'text/csv' : 'application/json',
    metadata: {
      sourceTrack,
      market,
      uploadedAt: new Date().toISOString()
    }
  });

  // Upload parsed JSON version
  const parsedFileName = fileName.replace(/\.[^.]+$/, '') + '_parsed.json';
  const parsedPath = `${basePath}/${parsedFileName}`;
  const parsedFile = bucket.file(parsedPath);
  await parsedFile.save(JSON.stringify(parsedRecords, null, 2), {
    contentType: 'application/json',
    metadata: {
      sourceTrack,
      market,
      originalFile: fileName,
      recordCount: String(parsedRecords.length),
      uploadedAt: new Date().toISOString()
    }
  });

  const bucketName = bucket.name;
  return {
    rawUrl: `gs://${bucketName}/${rawPath}`,
    parsedUrl: `gs://${bucketName}/${parsedPath}`
  };
}

/**
 * Main upload handler.
 *
 * @param {Object} params
 * @param {string} params.fileContent - Raw file content string
 * @param {string} params.fileName - Original file name
 * @param {string} params.fileType - 'csv' or 'json'
 * @param {string} params.sourceTrack - 'internal' or 'external'
 * @param {string} params.market - Market code (JP, KR, IN, ID, AUNZ)
 * @returns {Promise<Object>} Upload summary
 */
export async function handleUpload({ fileContent, fileName, fileType, sourceTrack, market }) {
  const uploadId = uuidv4();
  const errors = [];

  // --- Validate inputs ---
  if (!VALID_TRACKS.includes(sourceTrack)) {
    throw new Error(`Invalid sourceTrack: "${sourceTrack}". Must be one of: ${VALID_TRACKS.join(', ')}`);
  }
  if (!VALID_MARKETS.includes(market)) {
    throw new Error(`Invalid market: "${market}". Must be one of: ${VALID_MARKETS.join(', ')}`);
  }
  if (!['csv', 'json'].includes(fileType)) {
    throw new Error(`Invalid fileType: "${fileType}". Must be "csv" or "json"`);
  }
  if (!fileContent || typeof fileContent !== 'string') {
    throw new Error('fileContent must be a non-empty string');
  }

  // --- Parse file ---
  let records;
  let parseErrors;

  if (fileType === 'csv') {
    ({ records, errors: parseErrors } = parseCSV(fileContent));
  } else {
    ({ records, errors: parseErrors } = parseJSON(fileContent));
  }

  if (parseErrors.length > 0) {
    errors.push(...parseErrors);
  }

  if (records.length === 0) {
    return {
      success: false,
      uploadId,
      fileName,
      sourceTrack,
      market,
      topicsParsed: 0,
      topicsCreated: 0,
      storageUrl: null,
      errors: errors.length > 0 ? errors : ['No valid records found in file']
    };
  }

  // --- Upload to Firebase Storage ---
  let storageUrl;
  try {
    const { rawUrl } = await uploadToStorage(fileContent, records, fileName, sourceTrack, market);
    storageUrl = rawUrl;
  } catch (err) {
    console.error('Storage upload failed:', err);
    errors.push(`Storage upload failed: ${err.message}`);
    storageUrl = null;
  }

  // --- Create topic entries ---
  let topicsCreated = 0;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    try {
      // Parse target demo into gender and age
      const demoParts = record.targetDemo.toLowerCase().split(' ');
      let gender = 'female';
      if (demoParts[0] === 'males' || demoParts[0] === 'male') {
        gender = 'male';
      }
      const age = demoParts[1] || '18-24';

      const newTopic = await createTopic({
        topicName: record.topicName,
        description: record.description,
        referenceLink: record.referenceLink,
        market,
        gender,
        age,
        source: record.source || sourceTrack,
        hashtags: record.hashtags || [],
        audio: record.audio || null,
        rawData: {
          uploadId,
          sourceTrack,
          originalIndex: i,
          fileName
        }
      });

      // Update data_track on the created topic
      if (newTopic && newTopic.topic_id) {
        await query(
          `UPDATE topics SET data_track = $1, status = 'active' WHERE topic_id = $2`,
          [sourceTrack, newTopic.topic_id]
        );
      }

      topicsCreated++;
    } catch (err) {
      console.error(`Error creating topic for record ${i + 1}:`, err);
      errors.push(`Record ${i + 1} ("${record.topicName}"): ${err.message}`);
    }
  }

  return {
    success: true,
    uploadId,
    fileName,
    sourceTrack,
    market,
    topicsParsed: records.length,
    topicsCreated,
    storageUrl,
    errors
  };
}
