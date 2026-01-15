#!/bin/bash

# ============================================================================
# SEED DATA SCRIPT - Shorts Intel Hub
# ============================================================================
# This script loads mock data into the database for Alpha MVP testing
# ============================================================================

set -e

echo "🌱 Starting database seed process..."

# Database connection parameters
DB_NAME="${DB_NAME:-shorts_intel_hub}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Check if database exists
echo "Checking database connection..."
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo "❌ Error: Cannot connect to database '$DB_NAME'"
    echo "Please ensure the database is created and accessible."
    echo "Run ./setup.sh first if you haven't already."
    exit 1
fi

echo "✅ Database connection successful"

# Load seed data
echo "Loading seed data..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f seed-data.sql

if [ $? -eq 0 ]; then
    echo "✅ Seed data loaded successfully!"

    # Show summary
    echo ""
    echo "📊 Database Summary:"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT
            market,
            COUNT(*) as total_trends,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
        FROM topics
        GROUP BY market
        ORDER BY market;
    "

    echo ""
    echo "🎯 Trends by Source:"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT
            source,
            COUNT(*) as count
        FROM topics
        WHERE status = 'active'
        GROUP BY source
        ORDER BY count DESC;
    "

    echo ""
    echo "✨ Seed complete! Your database now has:"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
        SELECT COUNT(*) || ' trends across 5 markets' FROM topics WHERE status = 'active';
    "

else
    echo "❌ Error loading seed data"
    exit 1
fi

echo ""
echo "🚀 Ready to start the backend server!"
echo "   cd ../functions && npm run dev"
