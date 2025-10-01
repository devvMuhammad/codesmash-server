#!/bin/bash

# Load env vars
source ../.env

# Read source code and escape for JSON
SOURCE_CODE=$(cat 3_error_case.js | jq -Rs .)

# Submit to Judge0
curl -X POST "$JUDGE0_URL/submissions?base64_encoded=false&wait=true" \
  -H "content-type: application/json" \
  -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  -H "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  -d "{\"language_id\": 63, \"source_code\": $SOURCE_CODE}" \
  | jq '.' > test3_result.json

echo "Result saved to test3_result.json"