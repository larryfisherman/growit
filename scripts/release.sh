#!/usr/bin/env bash
# One production release, always in the same order:
#   1. checks   clean master, pushed to GitHub (the tag must point at code others can see)
#   2. tests    dotnet test (needs the docker Postgres: docker compose up -d db)
#   3. backup   scripts/backup-db.sh (Neon Free keeps only 6 h of history)
#   4. migrate  pending EF migrations through the DIRECT host as the owner role
#   5. deploy   scripts/deploy-api.sh (Terraform shows the plan and asks "yes")
#   6. tag      /health must answer 200, then tag release-YYYYMMDD-N and push it;
#               rollback = scripts/deploy-api.sh --ref <older tag>
#
# Usage: scripts/release.sh
#
# Migrations must be additive (expand/contract): new columns nullable or with defaults,
# nothing renamed or dropped in the same release. The previous code version must keep
# working on the new schema, otherwise rolling back the code is impossible.
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH="$HOME/.dotnet/tools:$PATH"

step() { printf '\n==> %s\n' "$*"; }
die() { echo "release: $*" >&2; exit 1; }

step "1/6 Checks"
[[ "$(git branch --show-current)" == "master" ]] || die "not on master"
[[ -z "$(git status --porcelain)" ]] || die "uncommitted changes: commit first, the tag must match the deployed code"
git fetch --quiet growit master
[[ "$(git rev-parse HEAD)" == "$(git rev-parse growit/master)" ]] || die "HEAD differs from growit/master: push (or pull) first"
docker compose ps --status running --services 2>/dev/null | grep -qx db || die "local Postgres is not running: docker compose up -d db"

step "2/6 Tests"
dotnet test GrowIt.sln

step "3/6 Backup"
scripts/backup-db.sh

step "4/6 Migrations"
dotnet tool restore >/dev/null
# Read once and check: an assignment prefix like VAR="$(cmd)" dotnet ... would ignore a
# failing cmd and run dotnet ef with an empty connection string.
OWNER_CONN=$(security find-generic-password -a growit -s growit-neon-owner-direct -w | tr -d '\n') ||
  die "cannot read Keychain item growit-neon-owner-direct"
[[ -n "$OWNER_CONN" ]] || die "Keychain item growit-neon-owner-direct is empty"
# Passed through an env var, never --connection (argv is visible in `ps`).
ef() {
  ConnectionStrings__DefaultConnection="$OWNER_CONN" dotnet ef "$@" \
    --project src/GrowIt.Infrastructure --startup-project src/GrowIt.API --no-color
}
# Fails closed: when the database cannot be reached, `dotnet ef migrations list` still
# exits 0 and only marks every migration "applied": null. That must stop the release,
# never read as "nothing pending".
listing=$(ef migrations list --json --prefix-output) || die "dotnet ef migrations list failed"
pending=$(printf '%s\n' "$listing" | python3 -I -c '
import json, sys
data = "\n".join(line[5:] for line in sys.stdin.read().splitlines() if line.startswith("data:"))
migrations = json.loads(data) if data.strip() else []
if not migrations:
    sys.exit("no migrations listed")
unknown = [m["name"] for m in migrations if m["applied"] is None]
if unknown:
    sys.exit("database state unknown (could not read __EFMigrationsHistory)")
print("\n".join(m["id"] for m in migrations if m["applied"] is False))
') || die "cannot tell which migrations are pending: is Neon reachable? (details above)"
if [[ -z "$pending" ]]; then
  echo "No pending migrations."
else
  echo "Pending migrations:"
  echo "$pending"
  read -rp "Are they additive (old code still works on the new schema)? [y/N] " answer
  [[ "$answer" == [yY] ]] || die "stopped before migrating; nothing changed in the database"
  ef database update
fi
unset OWNER_CONN

step "5/6 Deploy"
scripts/deploy-api.sh

step "6/6 Health check and tag"
URL=$(terraform -chdir=infra output -raw api_url)
# `|| true`: a connection error must reach the message below, not end the script silently.
code=$(curl -s --max-time 30 -o /dev/null -w '%{http_code}' "$URL/health" || true)
# Tag only a release that answers: a tag means "deployed and healthy", a safe rollback target.
[[ "$code" == 200 ]] || die "/health returned HTTP ${code:-none}: not tagged. Logs: aws logs tail /aws/lambda/growit-api --profile growit --region eu-central-1"

today=$(date +%Y%m%d)
n=1
while git rev-parse -q --verify "refs/tags/release-$today-$n" >/dev/null; do n=$((n + 1)); done
tag="release-$today-$n"
git tag -a "$tag" -m "Production release $tag"
git push --quiet growit "$tag" || die "tag $tag created locally but not pushed: git push growit $tag"
echo "Released $tag. /health: HTTP $code"
