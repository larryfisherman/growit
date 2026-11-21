# GrowIt infrastructure (production)

Terraform for everything in AWS except secrets. State lives in S3 (`infra/bootstrap`
created the bucket). Region `eu-central-1`, AWS CLI profile `growit`.
The full plan, with the reasoning behind each choice, is in `docs/deploy-plan.md` (Polish).

| Piece | Where | Monthly cost |
|---|---|---|
| Database | Neon Free, Postgres 18, `neondb`, scale-to-zero | $0 (100 CU-h, 0.5 GB) |
| API | Lambda `growit-api` (dotnet10, arm64, 1 GB, 30 s, reserved concurrency 5) + Function URL | $0 (free tier: 1M requests, 400k GB-s) |
| API logs | CloudWatch `/aws/lambda/growit-api`, 14 days | $0 (up to 5 GB) |
| Auth | Cognito `growit-prod`, Lite tier, e-mail only | $0 (up to 10k MAU) |
| DB secret | SSM `/growit/prod/ConnectionStrings/DefaultConnection`, SecureString, Standard | $0 |
| Terraform state | S3 `growit-tfstate-d6e02fc1` | ~$0 |

Secrets never go through Terraform (its state would store them). They live in the macOS
Keychain (account `growit`) and reach AWS through the scripts below.

## Scripts

| Script | What it does |
|---|---|
| `scripts/deploy-api.sh` | builds `artifacts/growit-api.zip` and runs `terraform apply`; `--ref <tag>` builds older code (rollback) |
| `scripts/release.sh` | the full release, see below |
| `scripts/backup-db.sh` | `pg_dump` of production into `~/growit-backups/` (needs `brew install postgresql@18`) |
| `infra/scripts/put-db-secret.sh` | copies the app connection string from Keychain into SSM |
| `infra/scripts/create-test-user.sh` | creates a Cognito account or sets its password (own terminal) |
| `infra/scripts/smoke-api.sh` | signs in as a real user and calls an endpoint that needs the DB |

**Any `terraform apply` deploys `artifacts/growit-api.zip`** (`lambda.tf` hashes it), also
one made for an unrelated change. `deploy-api.sh` keeps that file equal to the deployed
code: if its apply is declined or fails, it puts the previous zip back. Still, in every
plan, a `~ source_code_hash` you did not intend means "this would change the API code".
On a fresh clone (no zip yet) run `scripts/deploy-api.sh` before a plain plan/apply.

## Release and rollback

### Release

```sh
docker compose up -d db      # the tests need the local Postgres
scripts/release.sh
```

In order, stopping at the first failure:

1. Checks: on `master`, clean tree, same commit as `growit/master` (the tag must point at
   code that is on GitHub), local Postgres running.
2. `dotnet test`.
3. `scripts/backup-db.sh`: Neon Free keeps only 6 hours of history, older mistakes can
   only be undone from these dumps.
4. Pending EF migrations, applied through the DIRECT host as the owner role (the app role
   `growit_app` cannot change the schema). Asks for confirmation first.
5. `scripts/deploy-api.sh`: Terraform shows the plan and asks `yes`.
6. Tag `release-YYYYMMDD-N`, pushed to GitHub, then a `/health` check.

**Migrations must be additive (expand/contract).** Add nullable columns or columns with
defaults, new tables, new indexes. Renaming or dropping something takes two releases:
first stop using it in code, release; only then drop it in a later release. Otherwise
rolling the code back breaks on a schema it does not know.

Back up by hand once a week as well: `scripts/backup-db.sh`.

### Rolling back the code

```sh
git tag --list 'release-*'                          # pick the previous good one
scripts/deploy-api.sh --ref release-20261121-1
```

`--ref` builds the API code of that tag in a temporary git worktree, while Terraform
applies the current `infra/` files. Do not `git checkout` the old tag and deploy from
there: that would also roll back the infrastructure and remove everything added since.

The database stays as it is, which is why migrations must be additive. To go forward
again, run `scripts/deploy-api.sh` on `master`.

### Rolling back the data

- **Mistake from the last 6 hours:** Neon console → project `growit` → Restore (to a
  point in time), or create a branch from that point first and inspect it.
- **Older:** restore a dump from `~/growit-backups/`. Restore into a new Neon branch or a
  local database first and check it; only then replace production data. Use
  `/opt/homebrew/opt/postgresql@18/bin/pg_restore` (it must not be older than the server).

### Rotating the database password

1. Neon console: reset the password of `growit_app`, put the new connection string in
   Keychain item `growit-neon-app-pooled` (via `pbpaste`, never typed: the Keychain
   prompt truncates at 128 characters).
2. `infra/scripts/put-db-secret.sh`
3. Bump `config_revision` in `infra/variables.tf`, then `scripts/deploy-api.sh`. Changing
   an environment variable makes Lambda start fresh environments, which read SSM again.

For the owner role (`neondb_owner`) only update Keychain item `growit-neon-owner-direct`:
it is used from this laptop only (migrations, backups).

## Logs

```sh
aws logs tail /aws/lambda/growit-api --follow --profile growit --region eu-central-1
```

Text format. The API writes only Warning and above (`appsettings.Production.json`); every
500 is logged at Error by `ApiExceptionHandler`. Lambda adds `START`/`END`/`REPORT` per
request; `REPORT` with `Init Duration` marks a cold start.
