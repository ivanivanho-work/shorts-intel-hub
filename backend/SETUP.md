# Backend Setup Guide

## Overview

This guide covers setting up the Shorts Intel Hub backend infrastructure on Google Cloud Platform.

## Prerequisites

- Node.js 18+
- Google Cloud SDK (`gcloud`)
- PostgreSQL client (for local testing)
- Firebase CLI
- Git

## Step 1: GCP Project Setup

### 1.1 Create or Select Project

```bash
# Create new project
gcloud projects create shorts-intel-hub --name="Shorts Intel Hub"

# Set active project
gcloud config set project shorts-intel-hub

# Enable billing (required)
# Visit: https://console.cloud.google.com/billing
```

### 1.2 Enable Required APIs

```bash
# Enable APIs
gcloud services enable sqladmin.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

## Step 2: Database Setup

### 2.1 Create Cloud SQL Instance

```bash
cd scripts
chmod +x setup-db.sh
./setup-db.sh
```

**What it does:**
- Creates PostgreSQL 15 instance
- Enables pgvector extension
- Sets up daily backups
- Creates database `shorts_intel_hub`
- Sets postgres password

**Takes:** ~5-10 minutes

### 2.2 Apply Database Schema

```bash
chmod +x migrate-db.sh
./migrate-db.sh
```

**What it creates:**
- 7 tables (topics, topic_duplicates, ranking_configs, etc.)
- 5 enums (market_type, source_type, etc.)
- 3 views (active_topics, top_10_topics, market_stats)
- Functions and triggers
- Initial data (30 ranking configs, 5 schedules)

### 2.3 Local Development with Cloud SQL Proxy

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.0.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Run proxy (keep this running in a separate terminal)
./cloud-sql-proxy YOUR_PROJECT:YOUR_REGION:shorts-intel-hub-db
```

## Step 3: Firebase Setup

### 3.1 Create Firebase Project

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize project
cd backend/functions
firebase init
```

Select:
- ✅ Functions
- ✅ Hosting (for frontend later)
- ✅ Use existing project: shorts-intel-hub

### 3.2 Configure Firebase Functions

The `functions/` directory is already set up with:
- package.json
- src/ directory structure
- All service modules

Install dependencies:

```bash
cd backend/functions
npm install
```

## Step 4: Environment Configuration

### 4.1 Create .env File

```bash
cd backend/functions
cp .env.example .env
```

### 4.2 Fill in Environment Variables

Edit `.env`:

```env
# Node
NODE_ENV=development

# Database (for local via Cloud SQL Proxy)
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_FROM_SETUP
DB_NAME=shorts_intel_hub

# For production
CLOUD_SQL_CONNECTION_NAME=YOUR_PROJECT:YOUR_REGION:shorts-intel-hub-db

# GCP
GCP_PROJECT_ID=shorts-intel-hub
GCP_REGION=us-central1

# Firebase
FIREBASE_PROJECT_ID=shorts-intel-hub

# Storage
STORAGE_BUCKET=shorts-intel-hub-uploads

# Gemini AI (get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# MCP Bridge (TBC later)
MCP_BRIDGE_URL=https://your-agent-collective-url
MCP_BRIDGE_API_KEY=your-mcp-api-key
```

## Step 5: Cloud Storage Setup

```bash
# Create bucket for file uploads
gsutil mb -p shorts-intel-hub -l us-central1 gs://shorts-intel-hub-uploads

# Set CORS for uploads
cat > cors.json << EOF
[
  {
    "origin": ["http://localhost:3000", "https://shorts-intel-hub.web.app"],
    "method": ["GET", "POST", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://shorts-intel-hub-uploads
rm cors.json
```

## Step 6: Test Local Development

### 6.1 Start Firebase Emulators

```bash
cd backend/functions
npm run serve
```

**Emulators start:**
- Functions: http://localhost:5001
- UI: http://localhost:4000

### 6.2 Test Health Check

```bash
curl http://localhost:5001/shorts-intel-hub/us-central1/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T...",
  "service": "shorts-intel-hub",
  "version": "1.0.0"
}
```

### 6.3 Test Database Connection

In another terminal (with Cloud SQL Proxy running):

```bash
psql -h 127.0.0.1 -U postgres -d shorts_intel_hub

-- Test queries
\dt                                    -- List tables
SELECT * FROM markets_stats;           -- View stats
SELECT * FROM refresh_schedules;       -- View schedules
SELECT * FROM ranking_configs LIMIT 5; -- View configs
```

## Step 7: Deploy to Production

### 7.1 Deploy Functions

```bash
cd backend/functions

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:api
```

### 7.2 Verify Deployment

```bash
# Get function URL
firebase functions:list

# Test health check
curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/api/health
```

### 7.3 Set Production Environment Variables

```bash
# Set Cloud SQL connection
firebase functions:config:set database.connection_name="YOUR_PROJECT:YOUR_REGION:shorts-intel-hub-db"

# Set other configs
firebase functions:config:set \
  gcp.project_id="shorts-intel-hub" \
  gcp.region="us-central1" \
  storage.bucket="shorts-intel-hub-uploads" \
  gemini.api_key="YOUR_GEMINI_KEY"

# Deploy to apply configs
firebase deploy --only functions
```

## Step 8: Setup Cloud Scheduler

Cloud Scheduler is already configured in `src/index.js` for weekly refresh.

Verify in console:
```bash
gcloud scheduler jobs list
```

## Troubleshooting

### Database Connection Issues

**Problem:** Can't connect to Cloud SQL

**Solutions:**
```bash
# Check Cloud SQL Proxy is running
ps aux | grep cloud-sql-proxy

# Check instance status
gcloud sql instances describe shorts-intel-hub-db

# Test direct connection
gcloud sql connect shorts-intel-hub-db --user=postgres
```

### Function Deployment Errors

**Problem:** Deployment fails

**Solutions:**
```bash
# Check logs
firebase functions:log

# Verify Node version
node --version  # Should be 18+

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading

**Problem:** .env not working

**Solutions:**
- Ensure .env is in `backend/functions/` directory
- Check .env is not gitignored locally
- For production, use `firebase functions:config:set`

## Architecture

```
┌─────────────────────────────────────────┐
│         Cloud Functions (API)            │
│         /api/* endpoints                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Database Services (src/db/)           │
│    - connection.js (Pool)                │
│    - topics.js (CRUD)                    │
│    - ranking.js (Scores)                 │
│    - schedules.js (Refresh)              │
│    - uploads.js (Files)                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    Cloud SQL (PostgreSQL + pgvector)     │
│    - 7 tables, 5 enums, 3 views          │
│    - Vector similarity search            │
│    - Auto-expiry, audit logs             │
└─────────────────────────────────────────┘
```

## Next Steps

1. **Phase 2:** Implement file upload processing
2. **Phase 3:** Integrate Gemini AI for normalization
3. **Phase 4:** Complete ranking calculation pipeline
4. **Frontend:** Connect React app to API

## Useful Commands

```bash
# View function logs
firebase functions:log --only api

# Test function locally
cd backend/functions
npm run serve

# Deploy only API
firebase deploy --only functions:api

# Database backup
gcloud sql backups create --instance=shorts-intel-hub-db

# View database size
psql -h 127.0.0.1 -U postgres -d shorts_intel_hub -c "
  SELECT
    pg_size_pretty(pg_database_size('shorts_intel_hub')) as db_size;
"
```

---

**Backend setup complete!** Marco has built a solid foundation. 🚀
