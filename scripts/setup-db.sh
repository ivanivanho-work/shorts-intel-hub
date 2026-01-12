#!/bin/bash

# Shorts Intel Hub - Database Setup Script
# This script initializes Cloud SQL PostgreSQL database

set -e

echo "=========================================="
echo "Shorts Intel Hub - Database Setup"
echo "=========================================="
echo ""

# Configuration (update these with your actual values)
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
INSTANCE_NAME="${CLOUD_SQL_INSTANCE:-shorts-intel-hub-db}"
DATABASE_NAME="${DATABASE_NAME:-shorts_intel_hub}"
REGION="${GCP_REGION:-us-central1}"
DB_VERSION="POSTGRES_15"
TIER="db-custom-2-7680" # 2 vCPUs, 7.5 GB RAM

echo "Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Instance Name: $INSTANCE_NAME"
echo "  Database: $DATABASE_NAME"
echo "  Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "ERROR: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "ERROR: Not authenticated with gcloud"
    echo "Run: gcloud auth login"
    exit 1
fi

echo "✓ gcloud CLI authenticated"
echo ""

# Set project
echo "Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

# Check if Cloud SQL instance exists
echo "Checking if Cloud SQL instance exists..."
if gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" &> /dev/null; then
    echo "✓ Cloud SQL instance '$INSTANCE_NAME' already exists"
else
    echo "Creating Cloud SQL instance '$INSTANCE_NAME'..."
    echo "This may take 5-10 minutes..."

    gcloud sql instances create "$INSTANCE_NAME" \
        --database-version="$DB_VERSION" \
        --tier="$TIER" \
        --region="$REGION" \
        --network=default \
        --enable-bin-log \
        --backup-start-time="03:00" \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=4 \
        --database-flags=cloudsql.enable_pgvector=on \
        --project="$PROJECT_ID"

    echo "✓ Cloud SQL instance created successfully"
fi

# Wait for instance to be ready
echo "Waiting for instance to be ready..."
gcloud sql operations list \
    --instance="$INSTANCE_NAME" \
    --filter="status:RUNNING" \
    --project="$PROJECT_ID" \
    --limit=1 &> /dev/null

echo "✓ Instance is ready"
echo ""

# Create database
echo "Creating database '$DATABASE_NAME'..."
if gcloud sql databases describe "$DATABASE_NAME" \
    --instance="$INSTANCE_NAME" \
    --project="$PROJECT_ID" &> /dev/null; then
    echo "✓ Database '$DATABASE_NAME' already exists"
else
    gcloud sql databases create "$DATABASE_NAME" \
        --instance="$INSTANCE_NAME" \
        --project="$PROJECT_ID"
    echo "✓ Database created successfully"
fi

# Set postgres user password (if not already set)
echo ""
echo "Setting postgres user password..."
echo "Please enter a password for the postgres user:"
read -s POSTGRES_PASSWORD

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "ERROR: Password cannot be empty"
    exit 1
fi

gcloud sql users set-password postgres \
    --instance="$INSTANCE_NAME" \
    --password="$POSTGRES_PASSWORD" \
    --project="$PROJECT_ID"

echo "✓ Password set successfully"
echo ""

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe "$INSTANCE_NAME" \
    --project="$PROJECT_ID" \
    --format="value(connectionName)")

echo "=========================================="
echo "Database Setup Complete!"
echo "=========================================="
echo ""
echo "Connection Details:"
echo "  Instance Connection Name: $CONNECTION_NAME"
echo "  Database Name: $DATABASE_NAME"
echo "  Database User: postgres"
echo ""
echo "Next Steps:"
echo "1. Save these credentials to your .env file"
echo "2. Run the schema migration: ./scripts/migrate-db.sh"
echo "3. Set up Cloud SQL Proxy for local development"
echo ""
echo "Cloud SQL Proxy command:"
echo "  cloud-sql-proxy $CONNECTION_NAME"
echo ""
echo "Connection string for local development:"
echo "  postgresql://postgres:[PASSWORD]@127.0.0.1:5432/$DATABASE_NAME"
echo ""
