#!/usr/bin/env sh
# Verify Dining image layer không chứa Google OAuth / Auth module
set -e
IMG="${1:-phngnbnn-app}"
echo "Checking image: $IMG"
docker run --rm --entrypoint sh "$IMG" -c '
  if [ -e src/modules/auth/services/GoogleAuthService.ts ] || [ -e src/modules/auth ]; then
    echo "FAIL: Auth module still present in dining image"
    exit 1
  fi
  if grep -R "GoogleAuthService\|accounts.google.com" src --include="*.ts" 2>/dev/null; then
    echo "FAIL: Google OAuth references found"
    exit 1
  fi
  echo "OK: Dining image has no Auth/Google OAuth sources"
'
