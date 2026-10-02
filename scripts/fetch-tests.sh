#!/bin/sh

# Fetches the grasslands journey tests co-located in grants-config-grasslands
# (test/grants-ui), along with the GAS schema they validate against, at the
# latest config release tag. Mirrors how grants-ui resolves GRASSLANDS_TAG in
# tools/docker-compose-smoke-test.sh. Set GRASSLANDS_TAG to pin a release.

set -e

REPO="DEFRA/grants-config-grasslands"
DEST=".grasslands-config"

if [ -z "$GRASSLANDS_TAG" ]; then
  GRASSLANDS_TAG=$(curl -sf --ssl-no-revoke "https://api.github.com/repos/$REPO/tags" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.parse(d)[0]?.name ?? ''))")
fi

if [ -z "$GRASSLANDS_TAG" ]; then
  echo "Error: Could not fetch grasslands tag"
  exit 1
fi

echo "Using grasslands journey tests at version $GRASSLANDS_TAG"
rm -rf "$DEST"
mkdir -p "$DEST"
curl -sfL --ssl-no-revoke "https://codeload.github.com/$REPO/tar.gz/refs/tags/$GRASSLANDS_TAG" | tar -xz --strip-components=1 -C "$DEST"
echo "Saved to $DEST"
