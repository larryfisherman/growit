#!/usr/bin/env bash
# Copies the Neon connection string for the app role (growit_app, pooled host) from the
# macOS Keychain into SSM Parameter Store, where the Lambda reads it (Stage 5).
#
# Deliberately NOT in Terraform: anything Terraform manages ends up in its state file.
# The secret never appears on screen, in shell history or in command-line arguments
# (`ps`): it flows Keychain -> pipe -> aws CLI (via file:///dev/stdin).
#
# Usage: infra/scripts/put-db-secret.sh     (re-run after rotating the Neon password)
set -euo pipefail

export AWS_PROFILE="${AWS_PROFILE:-growit}" AWS_REGION="${AWS_REGION:-eu-central-1}"
PARAM=/growit/prod/ConnectionStrings/DefaultConnection

secret() { security find-generic-password -a growit -s growit-neon-app-pooled -w | tr -d '\n'; }

# Sanity check of the shape without printing anything.
secret | grep -q '^Host=.*-pooler\..*Username=growit_app;' \
  || { echo "Keychain entry growit-neon-app-pooled does not look like the pooled growit_app string." >&2; exit 1; }

# SecureString = encrypted with the free AWS-managed key aws/ssm; Standard tier = free.
version=$(secret | aws ssm put-parameter --name "$PARAM" --type SecureString --tier Standard \
  --overwrite --value file:///dev/stdin --query Version --output text)

# Verify by comparing hashes, again without printing the value.
stored=$(aws ssm get-parameter --name "$PARAM" --with-decryption --query Parameter.Value --output text | tr -d '\n' | shasum -a 256)
local_=$(secret | shasum -a 256)
[[ "$stored" == "$local_" ]] || { echo "Stored value differs from the Keychain value!" >&2; exit 1; }

echo "OK: $PARAM version $version, matches the Keychain."
