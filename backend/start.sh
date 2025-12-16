#!/bin/sh

echo "Running database migrations..."

NEEDED_BASELINE=false

# Try to deploy migrations, capture output
MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1) || {
  MIGRATE_EXIT_CODE=$?
  
  # Check if the error is P3005 (database schema not empty - needs baselining)
  if echo "$MIGRATE_OUTPUT" | grep -q "P3005\|database schema is not empty"; then
    echo "Database has tables but no migration history. Baselining migration..."
    NEEDED_BASELINE=true
    # Mark the initial migration as applied (baseline)
    npx prisma migrate resolve --applied 20251214183813_init || {
      echo "Warning: Could not baseline migration. The database may already be up to date."
    }
  else
    echo "Migration failed with error:"
    echo "$MIGRATE_OUTPUT"
    exit $MIGRATE_EXIT_CODE
  fi
}

# Only check/execute migration SQL if we baselined (tables might not exist yet)
if [ "$NEEDED_BASELINE" = "true" ]; then
  echo "Checking if tables exist after baselining..."
  # Try to execute migration SQL - if tables already exist, that's fine
  MIGRATION_OUTPUT=$(cat prisma/migrations/20251214183813_init/migration.sql | npx prisma db execute --stdin 2>&1)
  MIGRATION_EXIT_CODE=$?

  if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
    echo "Migration SQL executed successfully."
  elif echo "$MIGRATION_OUTPUT" | grep -q "already exists\|duplicate\|relation.*already exists"; then
    echo "Tables already exist. This is expected if tables were created before baselining."
  else
    echo "Error: Failed to execute migration SQL:"
    echo "$MIGRATION_OUTPUT"
    exit 1
  fi
else
  echo "Migrations deployed successfully. No manual SQL execution needed."
fi

echo "Migrations completed. Starting application..."
exec npm run start:prod

