#!/bin/bash

# Database setup script for Shorts Intel Hub
# Creates database and runs schema

set -e

DB_NAME="shorts_intel_hub"
DB_USER="postgres"

echo "🚀 Setting up database: $DB_NAME"

# Create database
echo "Creating database..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

# Run schema
echo "Running schema..."
psql -U $DB_USER -d $DB_NAME -f schema.sql

echo "✅ Database setup complete!"
