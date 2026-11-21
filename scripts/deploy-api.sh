#!/usr/bin/env bash
# Builds the API package and deploys it (plus any infra change) with Terraform.
# No secrets involved: the function reads its connection string from SSM at startup.
#
# Usage: scripts/deploy-api.sh                       code and infra from the working tree
#        scripts/deploy-api.sh --ref <tag|commit>     code from that ref, infra from the working tree
#        scripts/deploy-api.sh ... -auto-approve      extra arguments go to terraform apply
#
# --ref is the code rollback: it builds an older release in a temporary git worktree, but
# Terraform still applies the CURRENT infra/ files. Checking the old tag out instead would
# also roll back infra/ and remove whatever was added since (alarms, kill switch...).
#
# artifacts/growit-api.zip is what ANY `terraform apply` deploys (lambda.tf hashes it).
# So it must always hold the deployed code: if this run does not end with the new package
# in production (apply answered "no", failed, or the build broke), the previous zip is put back.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT=$(pwd)
export PATH="$HOME/.dotnet/tools:$PATH"

REF=""
if [[ "${1:-}" == "--ref" ]]; then
  REF="${2:?usage: $0 --ref <tag|commit> [terraform apply args]}"
  shift 2
fi

PACKAGE="$ROOT/artifacts/growit-api.zip"
PREVIOUS="$ROOT/artifacts/growit-api.previous.zip"
SRC="$ROOT"
WORKTREE=""

zip_hash() { openssl dgst -sha256 -binary "$1" | base64; } # same value as filebase64sha256()

finish() {
  local status=$?
  if [[ -f "$PREVIOUS" ]]; then
    # Hash Terraform recorded for the function = the code that is actually deployed.
    local deployed
    deployed=$(terraform -chdir="$ROOT/infra" state show -no-color aws_lambda_function.api 2>/dev/null |
      sed -n 's/^ *source_code_hash *= *"\(.*\)"$/\1/p' || true)
    if [[ -f "$PACKAGE" && -n "$deployed" && "$deployed" == "$(zip_hash "$PACKAGE")" ]]; then
      rm -f "$PREVIOUS"
    else
      mv -f "$PREVIOUS" "$PACKAGE"
      echo "The new package was not deployed: artifacts/growit-api.zip restored to the previous one." >&2
    fi
  fi
  [[ -z "$WORKTREE" ]] || git -C "$ROOT" worktree remove --force "$WORKTREE"
  exit "$status"
}
trap finish EXIT

[[ ! -f "$PACKAGE" ]] || cp -p "$PACKAGE" "$PREVIOUS"

if [[ -n "$REF" ]]; then
  WORKTREE="$(mktemp -d)/growit"
  git worktree add --detach "$WORKTREE" "$REF" >/dev/null
  SRC="$WORKTREE"
  echo "Building the API from $REF ($(git -C "$SRC" rev-parse --short HEAD)); infra/ stays as in the working tree."
fi

# Release build for linux-arm64, zipped. Settings come from
# src/GrowIt.API/aws-lambda-tools-defaults.json.
(cd "$SRC" && dotnet lambda package -pl src/GrowIt.API -o "$PACKAGE")

terraform -chdir=infra apply "$@"
