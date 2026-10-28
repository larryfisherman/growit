# Plan wdrożenia GrowIt MVP: Neon + Lambda + Cognito (Terraform)

> **Pierwsza czynność po zatwierdzeniu:**
> - zaktualizować pamięć projektu (`dynamodb-migration.md`: migracja ANULOWANA, decyzje: Neon, Lambda, Cognito Lite z otwartą rejestracją i breakerem, guardrails; nowy wpis z tym planem i wskaźnikiem na ten plik);
> - skopiować ten plan do repo jako `docs/deploy-plan.md`;
> - dopiero potem Etap 0. Każdy etap to osobna sesja w trybie nauki; po każdym etapie dobry moment na `/clear`.

## Kontekst

- **Prod nie działa.** Elastic Beanstalk i RDS są usunięte. Dystrybucja CloudFront `E1CO6SRWLRM3B5` jest tylko wyłączona, nie usunięta. Zostały też bucket S3 Beanstalka, stary budżet `maj2026` (5 USD) i snapshot `growit-db-final-2026-10-02`. Stary Cognito pool przepadł na zawsze.
- **Migrację na DynamoDB anulowaliśmy.** Zostajemy przy Postgres + EF Core, bez przepisywania handlerów.
- **Cel:** MVP dla Ciebie i ok. 20 znajomych (iOS i Android) za ok. 0 USD miesięcznie, bez niespodzianek na rachunku. Każdy składnik ma podany koszt.
- **Tryb nauki:** Claude pisze cały kod (Terraform, C#, skrypty) i po polsku tłumaczy każdą decyzję. Ty przechodzisz kolejne etapy i sam robisz kroki w konsolach (Neon, IAM).
- **Wymuszony krok: przejście na .NET 10.** API celuje w `net9.0`, a Lambda nie ma zarządzanego runtime'u dla .NET 9. Wsparcie Microsoftu dla .NET 8 i 9 kończy się 10.11.2026. Jedyna opcja bez kontenera to `dotnet10` (LTS do 14.11.2028, dostępny w eu-central-1).

## Architektura docelowa

```
 Aplikacja Expo (iOS/Android, offline-first)
   │ SignUp / InitiateAuth / Refresh (HTTPS JSON)
   ▼
 Cognito User Pool "growit-users" (LITE, email-only; tworzony ZAMKNIĘTY, otwierany na końcu Etapu 6)
   │ access token (JWT)
   ▼
 Lambda Function URL (auth NONE, bez CORS) ──► Lambda "growit-api"
                                               .NET 10, arm64, 1024 MB, timeout 30 s, RC 5, bez VPC
                                               logi Text, filtr ILogger = Warning
                                               connection string z SSM SecureString (parametr spoza TF)
                                               │ TLS, endpoint -pooler (PgBouncer, transaction mode)
                                               ▼
                                             Neon Postgres Free, aws-eu-central-1, 0.25 CU stałe
 Migracje: z laptopa przez endpoint DIRECT (scripts/release.sh)

 Guardrails:
  Alarm Invocations (5 min / 1 h) ──────────► Lambda "kill-switch" (RC=0 → 429) + SNS e-mail
  Budget 5 USD ACTUAL 100% → SNS budget ────► kill-switch + signup-breaker + e-mail
  Alarm SignUpSuccesses SampleCount (60 s / 1 h) ─► Lambda "signup-breaker": AllowAdminCreateUserOnly=true
  EventBridge Scheduler ────────────────────► Lambda "watchdog":
       co 10 min: EstimatedNumberOfUsers > limit → breaker
       raz dziennie: szacunek godzin czuwania Neona z Invocations → e-mail
```

## Koszty

Ceny dotyczą Frankfurtu. Wiersze oznaczone **(szac.)** to szacunki, nie pomiary.

| Składnik | Cena (zweryfikowana) | Normalny miesiąc (20 osób) | Atak przy działających guardrails |
|---|---|---|---|
| Lambda API (arm64) | $0.20 za 1M requestów; $0.0000133334 za GB-s; free tier 1M requestów + 400k GB-s miesięcznie (dostępny też na Paid plan). INIT jest billowany. | **$0** (szac. ~150k requestów, ~25k GB-s) | **~$0** za incydent (szac. ≤45k billowanych requestów, zanim alarm 5 min zabije API; odpowiedzi 429 nie są billowane) |
| Function URL | brak osobnej opłaty | $0 | jw. |
| Lambdy kill-switch, signup-breaker, watchdog (Python, 128 MB) | free tier Lambdy | $0 | $0 |
| EventBridge Scheduler | 14M wywołań miesięcznie za darmo, potem $1 za 1M | $0 (ok. 4,4k wywołań) | $0 |
| Cognito LITE | 10 000 MAU za darmo, potem $0.0055 za MAU. MAU liczy się także dla sign-upu i dla niepotwierdzonych kont. | **$0** | **Nie zawsze $0.** Limit 50 e-maili dziennie **nie** ogranicza tworzenia kont, bo SignUp po przekroczeniu limitu i tak tworzy konto UNCONFIRMED. Limit API to 50 RPS. Z breakerem 60 s (reakcja ok. 3 min): ≤ ok. 9k kont, czyli ~$0 (szac.). **Bez działającego breakera: ok. $860 za każdą godzinę ataku (szac.).** |
| Neon Free | $0; 100 CU-h na projekt miesięcznie, 1 GB storage, 5 GB egress | **$0** | $0, ale „wolny atak” (1 request co 4–5 min) nie pozwala bazie zasnąć, wyczerpuje CU-h w ok. 16 dni, a potem baza jest wyłączona do końca miesiąca. Wykrywa to watchdog. Na Neon Launch ten sam ruch kosztowałby ok. **$19/mies.** (szac.) |
| CloudWatch Logs | ingest ok. $0.50–0.63/GB, storage $0.0324/GB-mies.; 5 GB/mies. za darmo | **$0** (szac. <0.1 GB) | ok. $0.2 za 1M requestów (same linie START/END/REPORT, szac.) |
| CloudWatch Alarms (5 sztuk) | $0.10 za alarm, 10 za darmo | $0 | $0 |
| SNS | 1M publishów i 1000 e-maili za darmo | $0 | $0 |
| AWS Budgets (bez natywnych budget actions) | za darmo | $0 | $0 |
| SSM Parameter Store Standard + KMS `aws/ssm` | $0; 20k requestów KMS za darmo | $0 | $0 |
| S3 na stan Terraform (opcja) | ok. $0.0245/GB-mies. | ~$0.00–0.01 (szac.) | $0 |
| Data transfer out | 100 GB/mies. za darmo | $0 | $0 |
| Pozostałości: snapshot RDS 20 GB, bucket EB, ewentualny klucz KMS CMK po RDS ($1/mies.) | snapshot ok. $0.1 za GB danych (niska pewność) | **płacisz już dziś** do czasu sprzątania (Etap 8) | — |
| **Bez guardrails (dla porównania)** | 50 RPS przez 30 dni przy RC=5 | — | API ok. **$55** (szac.), sufit ok. $167; Cognito ok. $860 za godzinę spamu rejestracji |

Celowo pomijamy: VPC i NAT (ok. $35+/mies.), SnapStart (ok. $2–4/mies.), Provisioned Concurrency, API Gateway, Secrets Manager ($0.40 za sekret), KMS CMK ($1/mies.).

## Kroki

### Etap 0: Przygotowanie i inwentaryzacja (tylko instalacje i odczyty, $0)

1. **Instalacje:**
   - Terraform z `hashicorp/tap` (1.17.x)
   - `brew install gitleaks`
   - .NET 10 SDK
   - `dotnet tool install -g Amazon.Lambda.Tools`
2. **Limit concurrency:** `aws lambda get-account-settings --profile growit --region eu-central-1`. Jeśli `AccountLimit.ConcurrentExecutions` < 105, **od razu** składasz bezpłatny wniosek w Service Quotas (L-B99A9384) o 1000. Etap 6 czeka na akceptację albo idzie z fallbackiem z Pułapki 17.
3. **Snapshot (odczyt):**
   - `aws rds describe-db-snapshots --db-snapshot-identifier growit-db-final-2026-10-02` → `EngineVersion`, `Encrypted`, `KmsKeyId`
   - `aws kms describe-key --key-id <KmsKeyId>` → `KeyState`
   - Stara instancja padła w stanie `inaccessible-encryption-credentials`, więc snapshot może być nie do odtworzenia. Na tej podstawie **zamykasz Decyzję 1 i 2 przed Etapem 3**.
4. **Inwentaryzacja pozostałości (odczyt):**
   - `aws cloudfront list-distributions`
   - `aws s3 ls`
   - `aws budgets describe-budgets --account-id <id>`
   - `aws kms list-keys` i `describe-key` (czy jest klucz z `KeyManager=CUSTOMER`)
5. **Czego się uczysz:** oficjalne binarki, limit konta Lambdy, szyfrowanie snapshotów.
6. **Weryfikacja:** `terraform version`, `dotnet --list-sdks` (10.0.x), `gitleaks version`. Wyniki punktów 2–4 zapisane w notatce.

### Etap 1: Higiena repo i ochrona sekretów ($0)

Repo `larryfisherman/growit` jest **publiczne**.

- **Pliki:**
  - `/.gitignore`. Blok Terraform: `**/.terraform/`, `*.tfstate`, `*.tfstate.*`, `*.tfplan`, `tfplan`, `crash*.log`, `*.tfvars`, `*.tfvars.json`, `!*.tfvars.example`, `override.tf*`, `*_override.tf*`, `infra/build/`, `artifacts/`. Blok env: `.env.*`, `!.env.example`, `!.env.*.example`. Plik `.terraform.lock.hcl` commitujemy.
  - `/.githooks/pre-commit`: `gitleaks git --pre-commit --redact --staged --verbose`, plus `git config core.hooksPath .githooks`.
  - `/.gitleaksignore`: tylko fingerprinty przejrzanych false-positive'ów (lokalne hasło dockera).
- **Skan historii:** `gitleaks git -v --redact --log-opts="--all"`.
- **GitHub:** potwierdzasz, że secret scanning i push protection są włączone.
- **Czego się uczysz:** dlaczego `sensitive` nie chroni stanu Terraform, dlaczego hook trzymamy w repo.
- **Weryfikacja:** próbny commit z fałszywym ciągiem `AKIA…` zostaje zablokowany.

### Etap 2: .NET 10 i kod gotowy na Lambdę (osobny branch)

- **Pliki:**
  - `src/*/*.csproj` i `tests/*/*.csproj`: `net10.0`.
    - `Microsoft.AspNetCore.*`, `Microsoft.EntityFrameworkCore.*` i `Mvc.Testing` w wersji 10.0.14 (exact pin)
    - `Npgsql.EntityFrameworkCore.PostgreSQL` 10.0.3
  - `GrowIt.API.csproj` dodatkowo:
    - `Amazon.Lambda.AspNetCoreServer.Hosting` 2.2.1
    - `Amazon.Extensions.Configuration.SystemsManager` (wersję potwierdzamy na nuget.org)
  - `/.config/dotnet-tools.json`: `dotnet-ef` 10.0.x. Opcjonalnie `/global.json`.
  - `Program.cs`:
    - `AddSystemsManager` tylko gdy ustawione jest `Ssm:Path`
    - `AddAWSLambdaHosting(LambdaEventSource.HttpApi)`
    - `MigrateAsync` tylko gdy `Database:MigrateOnStartup` (domyślnie `true`)
  - `DependencyInjection.cs:14`: `EnableRetryOnFailure(maxRetryCount: 2, maxRetryDelay: 2 s, errorCodesToAdd: null)`.
  - NOWY `appsettings.Production.json`: poziomy `Default`, `Microsoft.AspNetCore` i `Microsoft.EntityFrameworkCore` = `Warning`. To **jedyny** filtr logów. Konsola wypisuje Warning i wyższe, Lambda w formacie Text przepuszcza je bez zmian.
  - NOWY `aws-lambda-tools-defaults.json`: `dotnet10`, `arm64`, Release, handler `GrowIt.API`.
- **Czego się uczysz:** runtime'y Lambdy, hosting ASP.NET w Lambdzie, dlaczego migracje nie powinny iść przy cold starcie.
- **Weryfikacja:**
  1. `docker compose up -d && dotnet build && dotnet test`: 38 testów integracyjnych i testy jednostkowe są zielone.
  2. `dotnet ef migrations has-pending-model-changes`: brak zmian.
  3. `dotnet run` na :5053 działa jak wcześniej.
  4. `dotnet lambda package -pl src/GrowIt.API -o artifacts/growit-api.zip --function-architecture arm64` tworzy zip (<50 MB).

### Etap 3: Neon i migracje ($0)

Warunek wejścia: zamknięte Decyzje 1 i 2.

1. **Konsola Neon:**
   - projekt `growit`, **aws-eu-central-1**, wersja Postgresa według Decyzji 2 (domyślnie 16, albo zgodna ze snapshotem), baza `growit`
   - autoscaling **min = max = 0.25 CU**
2. **Connection stringi** (DIRECT i POOLED) do password managera, w formacie Npgsql key=value:
   - Pooled: `Host=…-pooler…;Database=growit;Username=…;Password=…;SSL Mode=VerifyFull;Channel Binding=Require;No Reset On Close=true;Timeout=10;Command Timeout=15;Maximum Pool Size=5;Connection Idle Lifetime=60`
   - Direct: bez `-pooler` i bez `No Reset On Close`, z `Timeout=30;Command Timeout=120`
   - Kombinacja `VerifyFull` + `Channel Binding=Require` przez pooler jest nieprzetestowana. Fallback: `SSL Mode=Require` i `Channel Binding=Prefer`.
3. **(Polecam)** Rola `growit_app` tylko z DML i `ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner`. Lambda używa `growit_app`, migracje roli `neondb_owner`.
4. **Migracje:** `read -rs NEON_DIRECT`, `dotnet tool restore`, potem `dotnet ef database update --project src/GrowIt.Infrastructure --startup-project src/GrowIt.API --connection "$NEON_DIRECT"`, na koniec `unset NEON_DIRECT`.
5. **Czego się uczysz:** pooled kontra direct, scale-to-zero, budżet CU-h.
6. **Weryfikacja (tylko SQL; API sprawdzamy w Etapie 4, bo dopiero tam powstaje token):**
   - `select count(*) from "__EFMigrationsHistory"` zwraca 5
   - `select count(*) from "Exercises"` zwraca 16
   - jeśli jest `growit_app`: w SQL editorze jako `growit_app` `SELECT` działa, a `DROP TABLE` jest odrzucony

### Etap 4: Terraform (baza), Cognito, sekret w SSM, konto testowe ($0)

- **Pliki** (płaskie, bez modułów):
  - `infra/bootstrap/main.tf` (opcja S3 state): bucket z versioning, SSE-S3, public access block, wygaszaniem wersji po 90 dniach i `prevent_destroy`.
  - `infra/versions.tf`: `required_version >= 1.15`, `hashicorp/aws ~> 6.70`, `hashicorp/archive`. Backend `s3` z `use_lockfile = true` albo local.
  - `infra/providers.tf`: eu-central-1, profil `growit`, `default_tags`.
  - `infra/variables.tf`:
    - `alert_email`, `budget_limit_usd = 5`, progi alarmów, `api_reserved_concurrency = 5`, `signup_user_cap`
    - `config_revision = 1` (patrz Etap 5)
    - **brak zmiennej z sekretem**
  - `infra/terraform.tfvars.example`
  - `infra/outputs.tf`:
    - `user_pool_id`, `app_client_id`, `cognito_authority = "https://${aws_cognito_user_pool.main.endpoint}"`
    - później `api_url = trimsuffix(aws_lambda_function_url.api.function_url, "/")`
  - `infra/cognito.tf`, **pool `main`:**
    - `user_pool_tier = "LITE"`
    - `username_attributes = ["email"]`, `case_sensitive = false`, `auto_verified_attributes = ["email"]`
    - **bez bloku `schema`**. Email jest atrybutem standardowym. Blok schema bez `string_attribute_constraints` dawałby przy każdym planie „forces replacement”, a z `prevent_destroy` blokowałby każdy apply.
    - `password_policy`: min 6, bez klas znaków, `temporary_password_validity_days = 7`
    - `mfa_configuration = "OFF"`, bez `sms_configuration`, `COGNITO_DEFAULT` email, recovery `verified_email`
    - polski `verification_message_template` (`CONFIRM_WITH_CODE`)
    - **`allow_admin_create_user_only = true` na start.** Rejestrację otwiera `signup-open.sh` na końcu Etapu 6.
    - `deletion_protection = "ACTIVE"`, `lifecycle { prevent_destroy = true, ignore_changes = [admin_create_user_config] }`
  - `infra/cognito.tf`, **app client `mobile`:**
    - `generate_secret = false`
    - `explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH","ALLOW_REFRESH_TOKEN_AUTH"]`
    - `enable_token_revocation = true`, `prevent_user_existence_errors = "ENABLED"`
    - `token_validity_units { access_token = "hours", id_token = "hours", refresh_token = "days" }`, `access_token_validity = 1`, `id_token_validity = 1`, `refresh_token_validity` według Decyzji 9
    - `read_attributes = [email, email_verified, name]`, `write_attributes = [email, name]`
    - bez refresh token rotation (`cognito.ts:213`)
  - `infra/scripts/put-db-secret.sh` (**poza Terraform**): `read -rs CS; printf '%s' "$CS" | aws ssm put-parameter --name /growit/prod/ConnectionStrings/DefaultConnection --type SecureString --tier Standard --overwrite --value file:///dev/stdin; unset CS`. `printf` to builtin, więc wartość nie trafia do historii ani listy procesów. Jeśli `file:///dev/stdin` nie zadziała na macOS: plik z `mktemp` z `chmod 600`, potem `rm`. Terraform zna tylko nazwę i ARN parametru (w IAM), więc stan i `deploy-api.sh` zostają bez sekretu i bez pytań.
  - `infra/scripts/create-test-user.sh`: `admin-create-user --message-action SUPPRESS` (email z Decyzji 10, `email_verified=true`, `name=Testowy`), potem `admin-set-user-password --permanent` z `read -s`.
  - `src/GrowIt.API/appsettings.json`: nowe Authority i ClientId (publiczne identyfikatory).
  - `mobile/.env` (nieśledzony): `EXPO_PUBLIC_COGNITO_USER_POOL_ID`, `EXPO_PUBLIC_COGNITO_CLIENT_ID`, `EXPO_PUBLIC_COGNITO_REGION=eu-central-1` z `terraform output`. `EXPO_PUBLIC_API_URL` zostaje **pusty**, więc aplikacja trafia w lokalne API.
- **Czego się uczysz:** `init`/`plan`/`apply`, lock file, czytanie planu (szczególnie „forces replacement”), dlaczego sekret trzymamy poza stanem.
- **Weryfikacja:**
  1. Pierwszy apply, a potem **od razu** drugi `terraform plan` pokazuje „No changes”. Dopiero wtedy przechodzimy dalej.
  2. `aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH …` dla Testowy zwraca tokeny. To dowód, że hasło 6 znaków (małe litery + cyfry) przechodzi.
  3. `terraform state pull | grep -iE 'password|neon'` nic nie zwraca.
  4. Lokalne API na Neonie: `read -rs ConnectionStrings__DefaultConnection; export ConnectionStrings__DefaultConnection Database__MigrateOnStartup=false` (string pooled), potem `dotnet run`. Wywołanie `GET /api/...` z tokenem Testowy zwraca 200.
  5. Po 6 minutach bezczynności (Neon śpi) kolejny request też zwraca 200, bo retry wchłania martwe połączenie.
  6. Logowanie jako Testowy w aplikacji przy lokalnym API.

### Etap 4b: Import starych danych (tylko jeśli Decyzja 1 = a)

1. Odtworzenie `db.t4g.micro` ze snapshotu.
2. `pg_dump --data-only` z pominięciem `"Exercises"` i `"__EFMigrationsHistory"`. Dump robimy narzędziem w wersji ≥ wersji silnika.
3. `pg_restore` do Neona przez DIRECT.
4. `UPDATE … SET "UserId" = '<nowy sub>'`.
5. Natychmiast usuwasz instancję i ustalasz datę usunięcia snapshotu.

Koszt ok. $0.05–0.20 (szac.), czas 1–1.5 h. Jeśli `KeyState` ≠ `Enabled`, opcja (a) odpada.

### Etap 5: Deploy API na Lambdę (~$0, free tier)

- **Pliki:**
  - `infra/lambda.tf`:
    - `aws_cloudwatch_log_group "/aws/lambda/growit-api"` z retencją 14 dni, tworzona przed funkcją
    - IAM role: `logs:CreateLogStream`/`PutLogEvents` na tę grupę; `ssm:GetParametersByPath` i `ssm:GetParameter` na `parameter/growit/prod*`. `kms:Decrypt` z warunkiem `kms:ViaService` dodajemy tylko przy AccessDenied.
  - `aws_lambda_function "growit-api"`:
    - `runtime = "dotnet10"`, `handler = "GrowIt.API"`, `architectures = ["arm64"]`, `memory_size = 1024`, `timeout = 30`
    - `filename` + `source_code_hash`
    - `reserved_concurrent_executions = var.api_reserved_concurrency` (jeśli limit konta pozwala), `ignore_changes = [reserved_concurrent_executions]`
    - **bez `logging_config`**, czyli format Text. Filtrowanie zostaje po stronie ASP.NET (Warning), a linie START/REPORT z `Init Duration` są widoczne. Przy formacie JSON Lambda traktuje stdout jako INFO, więc `application_log_level = WARN` wyciąłby wszystkie błędy aplikacji.
    - env: `Ssm__Path=/growit/prod`, `Database__MigrateOnStartup=false`, `Cognito__Authority`/`Cognito__ClientId` z zasobów, `ASPNETCORE_ENVIRONMENT=Production`, `CONFIG_REVISION=var.config_revision`
    - brak `vpc_config`
  - `aws_lambda_function_url`: `authorization_type = "NONE"`, bez `cors`, `prevent_destroy`, bez qualifiera (`$LATEST`).
  - `scripts/deploy-api.sh`: `dotnet lambda package …` i `terraform -chdir=infra apply`, bez pytań o sekrety.
  - `scripts/release.sh` + sekcja „Wydanie i wycofanie” w `infra/README.md`:
    1. `dotnet test`
    2. `pg_dump -Fc` przez DIRECT do `~/growit-backups/` (poza repo)
    3. `dotnet ef database update` przez DIRECT. Tylko migracje addytywne (expand/contract), żeby poprzednia wersja kodu działała na nowym schemacie.
    4. `deploy-api.sh`
    5. `git tag release-YYYYMMDD-N`
    - **Wycofanie kodu:** `git checkout <poprzedni tag>` + `deploy-api.sh`.
    - **Wycofanie danych:** Neon restore/branch w oknie 6 h albo `pg_restore` z dumpa.
    - **Rotacja hasła DB:** nowe hasło w Neon, potem `put-db-secret.sh`, potem podbicie `config_revision` w `variables.tf` i `deploy-api.sh`. Zmiana env var wymusza nowe środowiska, które czytają SSM przy starcie.
- **Czego się uczysz:** IAM least privilege, resource policy Function URL, cold start w logu, dlaczego log group tworzymy sami.
- **Weryfikacja:**
  1. `aws lambda get-policy` pokazuje dwa statementy (`InvokeFunctionUrl` i `InvokeFunction` z `InvokedViaFunctionUrl`). Przy 403 dopisujemy dwa `aws_lambda_permission`.
  2. `curl "$(terraform -chdir=infra output -raw api_url)/health"` zwraca 200.
  3. Wywołanie z tokenem Testowy zwraca 200.
  4. Celowo zepsuty request (np. token z błędnym `client_id` albo chwilowo zły parametr SSM na teście) zostawia **widoczną** linię błędu w CloudWatch.
  5. Linia `REPORT … Init Duration` pokazuje realny cold start (szac. 2–4 s).

### Etap 6: Guardrails ($0 w ramach free tier)

Warunek wejścia: limit konta ≥105 albo przyjęty fallback z Pułapki 17.

- **Pliki:**
  - `infra/alerts.tf`:
    - SNS `growit-alerts` + subskrypcja e-mail (trzeba kliknąć link potwierdzający)
    - SNS `growit-budget` bez SSE, z topic policy dla `budgets.amazonaws.com` (`aws:SourceAccount`, `aws:SourceArn`)
  - `infra/kill_switch.tf` + `lambdas/kill_switch/index.py`:
    - Python 3.13, arm64, 128 MB, log group 14 dni
    - IAM: `lambda:PutFunctionConcurrency` na ARN API, `sns:Publish`
    - idempotentna, obsługuje eventy z SNS i z alarmu
    - `aws_lambda_permission` dla `lambda.alarms.cloudwatch.amazonaws.com` (z `source_arn` alarmu) i dla SNS
    - `on_failure` do SNS
  - `infra/alarms.tf`, wszystkie z `treat_missing_data = "notBreaching"`:
    - `api-invocations-5m`: Sum ≥ ~3000 w 300 s → kill + e-mail
    - `api-invocations-1h`: Sum ≥ ~8000 w 3600 s → kill + e-mail
    - `api-throttles`: Throttles > 0 w 300 s → tylko e-mail
  - `infra/budget.tf`:
    - 5 USD, COST, MONTHLY, `include_credit = false`, `include_refund = false`
    - ACTUAL ≥80% → e-mail
    - ACTUAL ≥100% → budget topic (kill API **i** zamknięcie rejestracji) + e-mail
    - FORECASTED ≥100% → e-mail. Prognoza zadziała dopiero po ok. 5 tygodniach danych.
    - `growit-1usd` zostaje jako wczesne ostrzeżenie
  - `infra/signup_breaker.tf` + `lambdas/signup_breaker/handler.py`:
    - alarm `signup-attempts-1m`: `AWS/Cognito SignUpSuccesses`, **statystyka SampleCount** (wszystkie próby, także te z LimitExceeded, które tworzą konto), wymiary UserPool + UserPoolClient, 60 s, próg z Decyzji 4
    - alarm `signup-attempts-1h`: SampleCount, 3600 s, próg z Decyzji 4
    - `alarm_actions`: Lambda + SNS; `ok_actions`: SNS
    - breaker subskrybuje też `growit-budget`
    - handler: Describe, potem kopia przez allow-listę pól `UpdateUserPool`, zmiana tylko `AllowAdminCreateUserOnly`, potem ponowny Describe, diff i raport przez SNS (Pułapka 13)
    - IAM: `cognito-idp:DescribeUserPool`/`UpdateUserPool` na ARN poola, `sns:Publish`
  - `infra/watchdog.tf` + `lambdas/watchdog/handler.py` (dwa harmonogramy EventBridge Scheduler):
    - **co 10 min:** `DescribeUserPool.EstimatedNumberOfUsers > var.signup_user_cap` → wywołuje breaker + e-mail. To kontrola niezależna od semantyki metryk.
    - **raz dziennie:** `GetMetricData` na Invocations `growit-api` z ostatnich 24 h w oknach 5 min. Liczba okien z ruchem, przeliczona razy 5 min razy 0.25 CU, daje szacunek CU-h na dobę. Przy prognozie > ok. 3 CU-h na dobę (~90 miesięcznie) wysyła e-mail.
    - IAM: `cognito-idp:DescribeUserPool`, `cloudwatch:GetMetricData`, `lambda:InvokeFunction` na breaker, `sns:Publish`
  - `infra/scripts/`:
    - `reopen-api.sh`: wypisuje koszt month-to-date z Cost Explorera i ostrzeżenie „po killu budżetowym do końca miesiąca budżet nie zadziała ponownie”. Potem rozgałęzia się: `put-function-concurrency 5` przy RC, `delete-function-concurrency` gdy konto bez RC, albo przywrócenie `auth-type NONE` przy fallbacku.
    - `signup-open.sh`: otwiera rejestrację tylko gdy oba alarmy signup są w stanie OK.
    - `signup-close.sh`
  - `infra/README.md`: koszt każdego składnika, procedury otwierania API i rejestracji, sekcja wydania.
- **Czego się uczysz:** alarmy (1 min) kontra Budgets (8–12 h), drift kontra automaty, testy przez `set-alarm-state`.
- **Weryfikacja:**
  1. `set-alarm-state` na `api-invocations-5m`: URL zwraca 429, przychodzi e-mail, `reopen-api.sh` przywraca 200.
  2. Testowy publish na `growit-budget`: API zwraca 429 i rejestracja jest zamknięta. Potem reopen obu.
  3. Test breakera:
     - `describe-user-pool` do `before.json`
     - `set-alarm-state` na `signup-attempts-1m`
     - SignUp zwraca `NotAuthorizedException`, a Testowy loguje się i odświeża token
     - diff pokazuje tylko flagę, `terraform plan` mówi „No changes”
  4. Test watchdoga: ręczne wywołanie z `signup_user_cap` chwilowo ustawionym na 0 (event testowy) zamyka rejestrację. Raport dzienny przychodzi mailem.
  5. Load test **60 RPS przez 30 s na `/health`** (ok. 1500 billowanych wywołań, poniżej progu 3000): powyżej ~50 RPS pojawiają się 429 i przychodzi tylko e-mail o throttles. `/health` nie dotyka bazy, więc nie spala CU-h.
  6. **Ostatni krok etapu:** `signup-open.sh`. Nowy alarm po kilku minutach przechodzi z INSUFFICIENT_DATA na OK.

### Etap 7: Przełączenie aplikacji mobilnej i smoke test na telefonie ($0)

- **Pliki:**
  - `mobile/.env.production` (nieśledzony): `EXPO_PUBLIC_API_URL` = `terraform output -raw api_url` (bez końcowego `/`).
  - `mobile/src/api/baseUrl.ts`: normalizacja `prodUrl.replace(/\/+$/, '')`. Function URL kończy się `/`, a `healthUrl` to `${baseURL}/health`. Bez normalizacji probe trafia w `//health` i obwód offline się nie zamyka.
  - `mobile/package.json`: skrypt `dev:prod` wskazuje dziś na martwy CloudFront. Usuwamy go albo zmieniamy na wczytywanie `.env.production`.
  - `mobile/.env.example`: komentarz „wartości z `terraform -chdir=infra output`” zamiast „CloudFront URL”.
  - `mobile/src/auth/cognito.ts`:
    - `LimitExceededException` przy SignUp oznacza „konto utworzone, kod nie dotarł”. Komunikat: „Spróbuj ponownie wysłać kod później”, plus przejście do ekranu potwierdzenia z opcją ResendConfirmationCode.
    - `NotAuthorizedException` przy SignUp: „Rejestracja chwilowo wyłączona”
    - `UsernameExistsException`: „Konto z tym mailem już istnieje”
- **Do sprawdzenia w kodzie:** czy `isServerUnavailable` w `mobile/src/api/errors.ts` obejmuje 429 (kill switch). Timeout klienta to 12 s.
- **Weryfikacja:**
  1. `npx expo start -c`. Na urządzeniach najpierw wylogowanie lub reinstalacja.
  2. Logowanie Testowy, CRUD treningu.
  3. **Tryb samolotowy wł./wył.:** obwód offline zamyka się na Function URL i sync przechodzi bez duplikatów.
  4. Jedna prawdziwa rejestracja na alias Gmail (sprawdź spam).
  5. `aws cloudwatch get-metric-statistics --namespace AWS/Cognito --metric-name SignUpSuccesses --statistics SampleCount --period 60 …` z wymiarami alarmu zwraca punkt. Potwierdza to wymiary i rozdzielczość 1 min.

### Etap 8: Sprzątanie i rzeczy po MVP

- **Sprzątanie** (koszty i porządek, po Decyzji 1):
  - usunięcie snapshotu RDS
  - usunięcie wyłączonej dystrybucji CloudFront
  - opróżnienie i usunięcie bucketa `elasticbeanstalk-eu-central-1-…`
  - usunięcie lub scalenie budżetu `maj2026`
  - zaplanowanie usunięcia ewentualnego klucza KMS CMK po RDS (7–30 dni oczekiwania), jeśli nic go już nie używa
- **Po MVP:** zamiana stałych kluczy `growit` na `aws login` (MFA, krótkotrwałe poświadczenia), potem dezaktywacja starego access key.

## Pułapki

1. **Brak runtime'u `net9.0`; .NET 8/9 tracą wsparcie 10.11.2026.** Przechodzimy na `net10.0`/`dotnet10`.
2. **Domyślny timeout Lambdy to 3 s.** Ustawiamy `timeout = 30`; Npgsql `Timeout=10` + retry 2×2 s mieści się w 12 s klienta (szac., mierzymy).
3. **`MigrateAsync` przy cold starcie.** `Database__MigrateOnStartup=false` w Lambdzie **i lokalnie przy pracy na Neonie**. Migracje tylko przez DIRECT, rolą owner, w `release.sh`.
4. **Martwe połączenia po scale-to-zero.** `EnableRetryOnFailure(2, 2s)`, `Connection Idle Lifetime=60`.
5. **PgBouncer w transaction mode:** `No Reset On Close=true`, bez SET, LISTEN i advisory locks.
6. **Budżet CU-h.**
   - Stałe 0.25 CU, bez keep-warm i bez health checku dotykającego bazy.
   - 20 osób to 45–108 CU-h (szac.), czyli ryzyko przekroczenia.
   - Jeden zalogowany użytkownik może „po cichu” trzymać bazę obudzoną (1 request co 4–5 min, dużo poniżej progów alarmów) i spalić limit w ok. 16 dni.
   - Neon Free nie ma alertów ani API zużycia, dlatego działa dzienny raport watchdoga, a w pierwszym miesiącu dodatkowo sprawdzasz Neon › Usage.
7. **Tylko 6 h PITR na Free.** `pg_dump -Fc` w każdym `release.sh` i co tydzień.
8. **Sekret w state.** `value`, `value_wo` (wymaga wartości przy *każdym* apply) i data source SSM komplikują pracę lub zapisują wartość w stanie. Parametr zakłada skrypt CLI ze stdin, a Terraform zna tylko jego nazwę.
9. **Lambda w VPC wymaga NAT (ok. $35+/mies.).** Brak `vpc_config`.
10. **Terraform cofa kill switch i breaker.** `ignore_changes` na `reserved_concurrent_executions` i `admin_create_user_config`, a przy fallbacku także na `authorization_type` Function URL. Otwieranie tylko skryptami.
11. **SignUp przy wyczerpanym limicie e-maili zwraca LimitExceeded, ale konto POWSTAJE (UNCONFIRMED) i liczy się jako MAU.**
    - Limit 50 e-maili dziennie nie ogranicza więc rejestracji; limit API to 50 RPS na konto.
    - Statystyka `Sum` na `SignUpSuccesses` takich prób nie widzi. Dlatego alarmy używają `SampleCount`, a niezależnie działa watchdog na `EstimatedNumberOfUsers`.
12. **Limit `COGNITO_DEFAULT` to 50 e-maili dziennie na konto** (reset o 09:00 UTC). Spam ForgotPassword blokuje e-maile do resetu, ale nic nie kosztuje.
13. **`UpdateUserPool` resetuje nieprzekazane pola** (tier, polityka hasła, auto-verify, deletion protection). Breaker:
    - kopiuje pełną konfigurację przez allow-listę
    - usuwa `UnusedAccountValidityDays` i przestarzałe pola `EmailVerification*`/`SmsVerificationMessage`
    - pomija `*ByLink` i `UserPoolAddOns` przy `OFF`
    - robi diff po zmianie
14. **Alarmy odpalają akcje tylko przy zmianie stanu, a CloudWatch nie waliduje akcji.** Dlatego SNS e-mail przy każdej akcji, `on_failure`, testy `set-alarm-state`, a `signup-open.sh` działa tylko przy stanie OK.
15. **Budgets:**
    - opóźnienie 8–12 h, a kredyty maskują koszt
    - alert ACTUAL przychodzi **raz na okres**, więc po killu budżetowym i reopen do końca miesiąca chronią już tylko alarmy
    - FORECAST potrzebuje ok. 5 tygodni danych
    - budżet jest na całe konto, więc pozostałości z Etapu 8 zjadają zapas
    - topic budżetu bez SSE-KMS
16. **Format logów.** Przy JSON stdout jest traktowany jako INFO, więc `application_log_level=WARN` ukrywa błędy, a `system_log_level=WARN` ukrywa REPORT. Używamy Text i filtra ASP.NET Warning.
17. **Niski limit concurrency konta.** RC się nie zaaplikuje. Wniosek o 1000 składamy w Etapie 0. Jeśli test RC=0 zawiedzie, fallback kill: `update-function-url-config --auth-type AWS_IAM` (403, hostname bez zmian). Kill-switch dostaje wtedy `lambda:UpdateFunctionUrlConfig`, a reopen przywraca `NONE`.
18. **Usunięcie lub odtworzenie Function URL zmienia hostname.** `prevent_destroy`, bez qualifiera.
19. **Function URL kończy się `/`.** Output z `trimsuffix` i normalizacja w `baseUrl.ts`, inaczej probe offline trafia w `//health`.
20. **CORS na Function URL i w ASP.NET daje zdublowane nagłówki.** Nie ustawiamy bloku `cors`.
21. **Log group utworzona automatycznie przez Lambdę ma retencję „never”.** Deklarujemy log groups sami dla wszystkich 4 funkcji.
22. **Pool Cognito:**
    - zmiana `username_attributes` lub schemy oznacza replace i nowe `sub`; blok `schema` bez `string_attribute_constraints` daje wieczne „forces replacement”, dlatego go nie dodajemy
    - nigdy nie dodajemy `sms_configuration`
    - ochrona: `deletion_protection` i `prevent_destroy`
23. **`token_validity_units` domyślnie w godzinach.** `access_token_validity = 60` znaczyłoby 60 h, a to błąd przy apply. Jednostki ustawiamy jawnie.
24. **`Cognito:Authority` porównywane dosłownie**, bez końcowego `/`. Budujemy je z `endpoint`.
25. **`aws_cognito_user` zapisuje hasło w state.** Konto testowe zakłada skrypt CLI.
26. **Nowy pool to nowe `sub`.** Bez UPDATE (Etap 4b) stare dane są osierocone.
27. **Publiczne repo i klucze z AdministratorAccess.** Gitleaks, push protection, ignorowanie `.env.*` i `*.tfvars`. Wyciek oznacza rotację klucza.
28. **Niepewne:** czy przy zamkniętej rejestracji działa `ConfirmSignUp` (niska pewność). Awaryjnie `admin-confirm-sign-up`.

## Decyzje do potwierdzenia

> **Zamknięte 2026-10-28:** Decyzja 1 = (b), stare dane były testowe, więc Etap 4b pomijamy, a oba snapshoty RDS usuwamy w Etapie 8. Decyzja 2 = Postgres 16 (snapshoty też były 16.14).

1. **Stare dane ze snapshotu** (zamknąć po Etapie 0, przed Etapem 3).
   - (a) Import w Etapie 4b. Wymaga `KeyState=Enabled` i wersji Neona zgodnej z silnikiem.
   - (b) Wszyscy zaczynają od zera.
   - Potem usuwamy snapshot (Etap 8).
   - **Rekomendacja:** (a) tylko jeśli to Twoja prawdziwa historia treningów i snapshot jest czytelny; w przeciwnym razie (b).
2. **Wersja Postgresa na Neonie.** **Rekomendacja: 16** (zgodność z docker-compose). Wyjątek: opcja (a) z silnikiem 17+, wtedy wersja zgodna ze snapshotem i podbicie obrazu dockera (kasuje lokalne dane dev).
3. **Wyczerpanie 100 CU-h.** **Rekomendacja:** zostajemy na Free i reagujemy na raport watchdoga (próg 80–90 CU-h). Przejście na Launch ($0.106 za CU-h) **dopiero po** sprawdzeniu, czy zużycie nie wynika z ruchu „po cichu” (Pułapka 6), bo na Launch taki ruch byłby billowany (ok. $19/mies.).
4. **Progi breakera rejestracji** (SampleCount, czyli wszystkie próby, także błędne). **Rekomendacja:** ≥10 prób na minutę i ≥30 prób na godzinę. Wieczór startowy z 20 znajomymi mieści się z zapasem na literówki w haśle.
5. **Limit kont dla watchdoga (`signup_user_cap`).** **Rekomendacja: 150.** To daleko od 10k darmowych MAU, a 7× więcej niż grupa MVP.
6. **Progi kill switcha API:** ~3000 na 5 min i ~8000 na godzinę. **Rekomendacja:** tak, korekta po pierwszym tygodniu.
7. **Niski limit concurrency.** **Rekomendacja:** wniosek w Etapie 0. Jeśli nie zostanie przyjęty przed Etapem 6, deploy bez RC i kill przez fallback AWS_IAM.
8. **Stan Terraform.** **Rekomendacja: S3 z `use_lockfile`** (ok. $0.00–0.01/mies., szac.).
9. **Cold start 2–4 s bez SnapStart.** **Rekomendacja:** bez SnapStart, 1024 MB.
10. **Ważność refresh tokenu.** **Rekomendacja: 90 dni.**
11. **E-mail konta Testowy.** **Rekomendacja:** alias Gmail z `mobile/.env.dev-account`.

## Weryfikacja end-to-end

1. `dotnet test`: wszystkie testy zielone na `net10.0`.
2. `curl "$API_URL/health"` zwraca 200; `get-policy` pokazuje dwa statementy; celowy błąd jest widoczny w logach.
3. Telefon (iOS i Android) z Function URL:
   - logowanie Testowy (6 znaków, małe litery + cyfry)
   - CRUD, offline, tryb samolotowy wł./wył., obwód offline się zamyka, sync bez duplikatów i 5xx
4. Rejestracja aliasu Gmail: polski kod przychodzi, konto potwierdzone, `SignUpSuccesses` (SampleCount, 60 s) ma wymiary zgodne z alarmem.
5. Cold path: ≥6 min bez ruchu, potem request z aplikacji. Odpowiedź w <12 s, w logach `Init Duration` i ewentualnie wchłonięty retry 57P01.
6. Guardrails:
   - `set-alarm-state` na alarmie API: 429, e-mail, reopen przywraca 200
   - publish na budget topic: 429 **i** rejestracja zamknięta
   - breaker: diff czysty, logowanie działa
   - watchdog: test cap i raport dzienny
   - load test 60 RPS przez 30 s: 429 i tylko e-mail o throttles
7. Drift i sekrety:
   - `terraform plan` pokazuje „No changes”
   - `state pull | grep -iE 'password|neon'` nic nie zwraca
   - `gitleaks git --redact --log-opts="--all"` bez nowych znalezisk
   - `git status` nie pokazuje stanu, tfvars ani `.env*`
8. Koszty po 48 h: Cost Explorer pokazuje $0 dla Lambdy, Cognito, CloudWatch, SNS i Scheduler; Neon Usage zgodne z raportem watchdoga; po Etapie 8 znika `ChargedBackupUsage`.
9. Wydanie: jedno przejście `release.sh` (test, dump, migrate, deploy, tag) i próbne wycofanie na poprzedni tag.

### Źródła (wybrane)

- https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
- https://aws.amazon.com/blogs/compute/net-10-runtime-now-available-in-aws-lambda
- https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
- https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html
- https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html
- https://docs.aws.amazon.com/lambda/latest/dg/csharp-logging.html
- https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs-log-level.html
- https://aws.amazon.com/blogs/compute/aws-lambda-standardizes-billing-for-init-phase/
- https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AWSLambda/current/eu-central-1/index.json
- https://aws.amazon.com/eventbridge/pricing/ (Scheduler: 14M wywołań miesięcznie za darmo)
- https://neon.com/docs/introduction/plans
- https://neon.com/docs/connect/connection-pooling
- https://neon.com/docs/guides/consumption-metrics
- https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_SignUp.html (LimitExceeded, a użytkownik i tak utworzony jako UNCONFIRMED)
- https://docs.aws.amazon.com/cognito/latest/developerguide/metrics-for-cognito-user-pools.html (SignUpSuccesses: niepowodzenie = 0; SampleCount = wszystkie próby)
- https://docs.aws.amazon.com/cognito/latest/developerguide/quotas.html
- https://aws.amazon.com/cognito/pricing/
- https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_UpdateUserPool.html
- https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-best-practices.html
- https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-sns-policy.html
- https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool
- https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool_client
- https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter
- https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function_url
- https://developer.hashicorp.com/terraform/language/backend/s3

## Uwagi z recenzji

- **cost/blocker (Cognito spam, Sum, LimitExceeded, MAU): PRZYJĘTE.** Zweryfikowane w dokumentacji SignUp i metryk. Zmiany:
  - alarmy na SampleCount z okresem 60 s i 1 h
  - watchdog `EstimatedNumberOfUsers`
  - breaker podpięty pod budżet
  - poprawiony wiersz kosztów
  - obsługa LimitExceeded w `cognito.ts`
  - liczba alarmów: 5
- **cost/major (wolny ruch spala CU-h Neona): PRZYJĘTE.** Dzienny raport watchdoga z Invocations, ostrzeżenie przy Decyzji 3, wiersz kosztu Launch.
- **works/major (logging_config JSON ukrywa błędy): PRZYJĘTE, wariant (a).** Format Text i filtr ASP.NET Warning, plus weryfikacja widocznego błędu.
- **works/major (schema bez `string_attribute_constraints`): PRZYJĘTE.** Blok `schema` usunięty, a weryfikacja „No changes” idzie zaraz po pierwszym apply.
- **works/major (`value_wo` wymaga wartości przy każdym apply): PRZYJĘTE.** Parametr SSM zakładany przez CLI ze stdin, poza Terraform.
- **works/major (końcowy `/` w Function URL psuje probe `//health`): PRZYJĘTE.** Potwierdzone w `baseUrl.ts:22`. Wprowadzone `trimsuffix` i normalizacja URL, a w smoke teście tryb samolotowy.
- **works/minor (`system_log_level=WARN` ukrywa REPORT): PRZYJĘTE.** Rozwiązane przez format Text.
- **works/minor (jednostki tokenów): PRZYJĘTE.** Jawne `token_validity_units`, wartości 1 h.
- **works/minor i scope/minor (load test przekracza próg kill): PRZYJĘTE.** Teraz 60 RPS przez 30 s na `/health`, ok. 1500 wywołań.
- **scope/major (Etap 3 bez fake auth i tokenu): PRZYJĘTE.** Potwierdzone, fake auth jest tylko w `ApiFactory.cs`. Etap 3 sprawdza tylko SQL, test API i retry przeniesione do Etapu 4.
- **scope/major (snapshot: wersja, KMS, kolejność, seed): PRZYJĘTE.** Odczyt w Etapie 0, decyzja przed Etapem 3, Etap 4b z restore data-only bez seedów.
- **scope/major (sekret bez default, rotacja): PRZYJĘTE częściowo.** Odrzucony wariant `default = null`, bo recenzent „works” wykazał, że nie przechodzi walidacji providera. Przyjęte `put-parameter` i procedura rotacji przez `config_revision`.
- **scope/major (brak procedury wydania i wycofania): PRZYJĘTE.** `scripts/release.sh`, tagi, migracje addytywne, ścieżki restore.
- **scope/minor (budżet raz na okres, prognoza po 5 tygodniach, konto współdzielone): PRZYJĘTE.** Próg 80%, ostrzeżenie i koszt MTD w `reopen-api.sh`.
- **scope/minor (pozostałości i martwy `dev:prod`): PRZYJĘTE.** Potwierdzone w `package.json:8` i `.env.example:6`. Dodane Etap 0 (inwentaryzacja), Etap 7 (poprawki) i Etap 8 (sprzątanie).
- **scope/minor (rejestracja otwarta przed guardrails): PRZYJĘTE.** Pool tworzony z `allow_admin_create_user_only = true`, otwarcie na końcu Etapu 6.
- **scope/minor (logowanie w aplikacji w Etapie 4 przed zmianą `.env`): PRZYJĘTE.** Zmienne Cognito w `mobile/.env` ustawiamy w Etapie 4.
- **scope/minor (`MigrateOnStartup` przy lokalnym API na Neonie): PRZYJĘTE.** `Database__MigrateOnStartup=false` lokalnie.
- **scope/minor (brak fallbacku, gdy RC=0 nie działa): PRZYJĘTE.** Fallback AWS_IAM, rozgałęziony `reopen-api.sh`, wniosek o limit jako pierwszy krok.
- **scope/minor (`aws login` za wcześnie): PRZYJĘTE.** Przeniesione do Etapu 8 (po MVP), Decyzja 11 usunięta.
- **Odrzucone w całości:** żadne. Wszystkie zgłoszenia okazały się zasadne po sprawdzeniu w repo lub dokumentacji. Kwoty $860/h i $19/mies. zostały w planie, ale oznaczone jako szacunki.