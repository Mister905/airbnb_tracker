#!/bin/sh

echo "Running database migrations..."

# Try to deploy migrations, capture output
MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1) || {
  MIGRATE_EXIT_CODE=$?
  
  # Check if the error is P3005 (database schema not empty - needs baselining)
  if echo "$MIGRATE_OUTPUT" | grep -q "P3005\|database schema is not empty"; then
    echo "Database has tables but no migration history. Baselining migration..."
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

# Always check if tables exist after migrations (in case migration was baselined but tables weren't created)
echo "Checking if tables exist..."
TABLE_EXISTS=$(echo "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TrackedUrl');" | npx prisma db execute --stdin 2>/dev/null | grep -i "true" || echo "")

if [ -z "$TABLE_EXISTS" ]; then
  echo "Tables don't exist. Executing migration SQL..."
  # Execute the migration SQL file by piping it to db execute
  cat prisma/migrations/20251214183813_init/migration.sql | npx prisma db execute --stdin || {
    echo "Error: Failed to execute migration SQL. Exiting..."
    exit 1
  }
  echo "Migration SQL executed successfully."
else
  echo "Tables already exist. Skipping migration SQL execution."
fi

echo "Migrations completed. Starting application..."
exec npm run start:prod

