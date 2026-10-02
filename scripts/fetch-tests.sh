#!/bin/sh

# Fetches the grasslands journey tests co-located in grants-config-grasslands
# (test/grants-ui), along with the GAS schema they validate against, at the
# latest config release tag. Mirrors how grants-ui resolves GRASSLANDS_TAG in
# tools/docker-compose-smoke-test.sh. Set GRASSLANDS_TAG to pin a release.

set -e

REPO="DEFRA/grants-config-grasslands"
DEST=".grasslands-config"

# On CDP, outbound traffic to GitHub must go via the egress proxy. Scoped to
# these curl calls so the browser's route to grants-ui is unaffected.
PROXY="${CDP_HTTPS_PROXY:-$CDP_HTTP_PROXY}"

fetch() {
  if [ -n "$PROXY" ]; then
    curl -sSfL --ssl-no-revoke --proxy "$PROXY" "$@"
  else
    curl -sSfL --ssl-no-revoke "$@"
  fi
}

if [ -z "$GRASSLANDS_TAG" ]; then
  TAGS=$(fetch "https://api.github.com/repos/$REPO/tags") || {
    echo "Error: Could not fetch grasslands tags from GitHub"
    exit 1
  }
  GRASSLANDS_TAG=$(printf '%s' "$TAGS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{process.stdout.write(JSON.parse(d)[0]?.name ?? '')}catch{}})")
fi

if [ -z "$GRASSLANDS_TAG" ]; then
  echo "Error: Could not fetch grasslands tag"
  exit 1
fi

echo "Using grasslands journey tests at version $GRASSLANDS_TAG"
ARCHIVE="$(mktemp)"
fetch "https://codeload.github.com/$REPO/tar.gz/refs/tags/$GRASSLANDS_TAG" -o "$ARCHIVE" || {
  echo "Error: Could not download grants-config-grasslands $GRASSLANDS_TAG"
  rm -f "$ARCHIVE"
  exit 1
}
rm -rf "$DEST"
mkdir -p "$DEST"
tar -xzf "$ARCHIVE" --strip-components=1 -C "$DEST"
rm -f "$ARCHIVE"
echo "Saved to $DEST"
