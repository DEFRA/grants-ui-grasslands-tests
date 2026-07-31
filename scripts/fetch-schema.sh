#!/bin/sh

set -e

TAG=$(curl -sf --ssl-no-revoke "https://api.github.com/repos/DEFRA/grants-config-grasslands/tags" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.parse(d)[0].name))")

if [ -z "$TAG" ]; then
  echo "Error: Could not fetch tag"
  exit 1
fi

echo "Fetching grasslands/fg-gas-backend/grasslands.json at tag $TAG"
mkdir -p test/schemas
curl -fL --ssl-no-revoke "https://raw.githubusercontent.com/DEFRA/grants-config-grasslands/$TAG/configurations/grasslands/fg-gas-backend/grasslands.json" -o test/schemas/gas.schema.json
echo "Saved to test/schemas/gas.schema.json"
