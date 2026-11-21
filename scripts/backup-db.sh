#!/usr/bin/env bash
# Full backup of the production database (Neon) to ~/growit-backups, outside the repo.
# Run by release.sh before every migration, and by hand once a week: Neon Free keeps
# only 6 hours of history, so older mistakes can only be undone from these files.
#
# Usage: scripts/backup-db.sh       prints the path of the new dump on the last line
#
# Connects as the owner role through the DIRECT host (not the pooler: pg_dump needs a
# real session). The password goes to a private temporary .pgpass file, never to argv or
# the screen.
set -euo pipefail

PG_BIN=/opt/homebrew/opt/postgresql@18/bin # must be >= the server version (Neon runs 18)
BACKUP_DIR="$HOME/growit-backups"

[[ -x "$PG_BIN/pg_dump" ]] || { echo "Missing $PG_BIN/pg_dump: brew install postgresql@18" >&2; exit 1; }

umask 077 # dumps contain users' data: readable only by you
mkdir -p "$BACKUP_DIR"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# The Keychain holds an Npgsql string ("Host=..; Database=..; Password=.."); libpq tools
# want separate settings. Python splits it: the password goes into the .pgpass file, the
# rest comes back as shell exports.
eval "$(security find-generic-password -a growit -s growit-neon-owner-direct -w | tr -d '\n' |
  python3 -I -c '
import shlex, sys
parts = dict(kv.split("=", 1) for kv in (p.strip() for p in sys.stdin.read().split(";")) if kv)
parts = {k.strip().lower(): v.strip() for k, v in parts.items()}
esc = lambda v: v.replace("\\", "\\\\").replace(":", "\\:")
with open(sys.argv[1], "w") as f:
    f.write(":".join(esc(v) for v in (parts["host"], "5432", parts["database"], parts["username"], parts["password"])) + "\n")
for name, key in (("PGHOST", "host"), ("PGDATABASE", "database"), ("PGUSER", "username")):
    print(f"export {name}={shlex.quote(parts[key])}")
' "$TMP/pgpass")"

[[ "$PGHOST" != *-pooler.* ]] || { echo "growit-neon-owner-direct points at the pooler, expected the direct host." >&2; exit 1; }

export PGPASSFILE="$TMP/pgpass" PGPORT=5432
export PGSSLMODE=verify-full PGSSLROOTCERT=system PGCHANNELBINDING=require # same strictness as the app

FILE="$BACKUP_DIR/growit-$(date +%Y%m%d-%H%M%S).dump"
PARTIAL="$TMP/backup.dump" # moved into ~/growit-backups only once verified, so a broken
                           # dump never sits there looking like a good backup

# -Fc: compressed custom format, restorable selectively with pg_restore.
"$PG_BIN/pg_dump" -Fc --no-owner --no-privileges -f "$PARTIAL"

# A dump that pg_restore cannot list is not a backup.
tables=$("$PG_BIN/pg_restore" --list "$PARTIAL" | grep -c ' TABLE DATA ' || true)
[[ "$tables" -gt 0 ]] || { echo "Dump has no table data, not saved!" >&2; exit 1; }
mv "$PARTIAL" "$FILE"

echo "Backup OK: $tables tables, $(du -h "$FILE" | cut -f1)"
echo "$FILE"
