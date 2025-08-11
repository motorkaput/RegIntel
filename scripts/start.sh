#!/bin/sh
set -e

echo "Starting PerMeaTe Enterprise..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until nc -z ${DATABASE_HOST:-localhost} ${DATABASE_PORT:-5432}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
  echo "Database migration failed!"
  exit 1
fi

# Generate Prisma client (in case it's not available)
echo "Generating Prisma client..."
npx prisma generate

# Seed database in demo mode
if [ "$DEMO_MODE" = "1" ] || [ "$DEMO_MODE" = "true" ]; then
  echo "Demo mode enabled - seeding database..."
  npm run demo:seed || echo "Demo seed failed, continuing..."
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js