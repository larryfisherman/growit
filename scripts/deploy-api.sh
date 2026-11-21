#!/usr/bin/env bash
# Builds the API package and deploys it (plus any infra change) with Terraform.
# No secrets involved: the function reads its connection string from SSM at startup.
#
# Usage: scripts/deploy-api.sh                 (Terraform shows the plan and asks "yes")
#        scripts/deploy-api.sh -auto-approve   (extra arguments go to terraform apply)
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH="$HOME/.dotnet/tools:$PATH"

# Release build for linux-arm64, zipped. Settings come from
# src/GrowIt.API/aws-lambda-tools-defaults.json.
dotnet lambda package -pl src/GrowIt.API -o artifacts/growit-api.zip

terraform -chdir=infra apply "$@"
