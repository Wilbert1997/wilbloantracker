#!/bin/bash

SUPABASE_URL="https://mrdazjwhvisslhswhbsd.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZGF6andodmlzc2xoc3doYnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0Njk1MjMsImV4cCI6MjA5NjA0NTUyM30.ZO12jp_Vn3_eyq4LBHIIWCYfC617mRKCOCvlFMUER4Q"

echo "Initializing default admin account..."

curl -X POST "${SUPABASE_URL}/functions/v1/init-default-admin" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'

echo "Done!"
