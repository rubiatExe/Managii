#!/bin/bash
set -e

PROJECT_ID="wanderwise-478707"
INSTANCE_NAME="managify-db"
DB_NAME="managify"
REGION="us-central1"

echo "Waiting for instance $INSTANCE_NAME to be ready..."
until gcloud sql instances describe $INSTANCE_NAME --project $PROJECT_ID --format="value(state)" 2>/dev/null | grep -q "RUNNABLE"; do
  sleep 10
  echo -n "."
done
echo ""
echo "Instance is ready."

echo "Creating database $DB_NAME..."
# Check if db exists
if ! gcloud sql databases list --instance=$INSTANCE_NAME --project $PROJECT_ID | grep -q $DB_NAME; then
    gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME --project $PROJECT_ID
    echo "Database created."
else
    echo "Database already exists."
fi

echo "Starting Cloud SQL Auth Proxy..."
./cloud-sql-proxy $PROJECT_ID:$REGION:$INSTANCE_NAME &
PROXY_PID=$!

echo "Waiting for proxy to start..."
sleep 5

echo "Running Prisma migrations..."
cd web
# Ensure .env exists (I created it via run_command, but good to be safe)
if [ ! -f .env ]; then
    echo "Creating .env..."
    echo 'DATABASE_URL="postgresql://postgres:FCCXwcE4RozZJWJf@localhost:5432/managify?schema=public"' > .env
    echo 'GEMINI_API_KEY=""' >> .env
fi

npx prisma migrate dev --name init_cloud_sql

echo "Stopping proxy..."
kill $PROXY_PID

echo "Setup complete!"
