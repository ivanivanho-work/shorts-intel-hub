#!/bin/bash

# Shorts Intel Hub - Database Migration Script
# Applies schema.sql to Cloud SQL database

set -e

echo "=========================================="
echo "Shorts Intel Hub - Database Migration"
echo "=========================================="
echo ""

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
INSTANCE_NAME="${CLOUD_SQL_INSTANCE:-shorts-intel-hub-db}"
DATABASE_NAME="${DATABASE_NAME:-shorts_intel_hub}"

echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Instance: $INSTANCE_NAME"
echo "  Database: $DATABASE_NAME"
echo ""

# Check if schema file exists
SCHEMA_FILE="../backend/database/schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "ERROR: Schema file not found: $SCHEMA_FILE"
    exit 1
fi

echo "✓ Schema file found"
echo ""

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe "$INSTANCE_NAME" \
    --project="$PROJECT_ID" \
    --format="value(connectionName)")

echo "Connection Name: $CONNECTION_NAME"
echo ""

# Check if Cloud SQL Proxy is running
if ! pgrep -f "cloud-sql-proxy.*$CONNECTION_NAME" > /dev/null; then
    echo "WARNING: Cloud SQL Proxy doesn't appear to be running"
    echo "Start it with: cloud-sql-proxy $CONNECTION_NAME"
    echo ""
    echo "Do you want to continue with gcloud sql connect instead? (y/n)"
    read -r RESPONSE
    if [ "$RESPONSE" != "y" ]; then
        exit 1
    fi

    echo ""
    echo "Running migration via gcloud sql connect..."
    echo "You will be prompted for the database password"
    echo ""

    gcloud sql connect "$INSTANCE_NAME" \
        --user=postgres \
        --database="$DATABASE_NAME" \
        --project="$PROJECT_ID" \
        < "$SCHEMA_FILE"
else
    echo "Cloud SQL Proxy is running"
    echo "Please enter database password:"
    read -s DB_PASSWORD

    echo ""
    echo "Running migration..."

    PGPASSWORD="$DB_PASSWORD" psql \
        -h 127.0.0.1 \
        -p 5432 \
        -U postgres \
        -d "$DATABASE_NAME" \
        -f "$SCHEMA_FILE"
fi

echo ""
echo "=========================================="
echo "Migration Complete!"
echo "=========================================="
echo ""
echo "Database schema has been applied successfully"
echo ""
echo "Verify with:"
echo "  psql -h 127.0.0.1 -U postgres -d $DATABASE_NAME -c '\\dt'"
echo ""
