#!/bin/bash

# Script to run Supabase migrations
# Usage: ./scripts/run-migration.sh <migration-file>

set -e

MIGRATION_FILE=$1

if [ -z "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not specified"
  echo "Usage: ./scripts/run-migration.sh <migration-file>"
  exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

echo "Running migration: $MIGRATION_FILE"
echo "----------------------------------------"

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "Error: psql is not installed. Please install PostgreSQL client."
  exit 1
fi

# Extract database URL from env
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in .env.local"
  echo "Please add your Supabase database URL to .env.local:"
  echo "DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres"
  exit 1
fi

# Run migration
echo "Executing migration..."
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

echo "----------------------------------------"
echo "Migration completed successfully!"
