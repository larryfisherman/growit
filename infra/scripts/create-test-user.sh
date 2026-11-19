#!/usr/bin/env bash
# Creates an account in the Terraform-managed Cognito pool (sign-up is closed, so only an
# admin can do it), sets its password and checks that signing in works.
# Re-running it for an existing account only sets a new password.
#
# Usage (in your own terminal, it asks for the password):
#   infra/scripts/create-test-user.sh <email> [name]      name defaults to "Testowy"
#
# The password is typed hidden and passed to the aws CLI in a private temp JSON file, never
# as a command-line argument (those are visible to other processes via `ps`).
set -euo pipefail

EMAIL="${1:?usage: $0 <email> [name]}"
NAME="${2:-Testowy}"
export AWS_PROFILE="${AWS_PROFILE:-growit}" AWS_REGION="${AWS_REGION:-eu-central-1}"

cd "$(dirname "$0")/.."
POOL=$(terraform output -raw user_pool_id)
CLIENT=$(terraform output -raw app_client_id)

if aws cognito-idp admin-get-user --user-pool-id "$POOL" --username "$EMAIL" >/dev/null 2>&1; then
  echo "Account $EMAIL already exists, only the password will be set."
else
  # SUPPRESS: no invitation e-mail; email_verified=true: no confirmation code needed.
  aws cognito-idp admin-create-user --user-pool-id "$POOL" --username "$EMAIL" \
    --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true Name=name,Value="$NAME" \
    --message-action SUPPRESS >/dev/null
  echo "Created account $EMAIL ($NAME)."
fi

read -rsp "Password (min. 6 characters, hidden): " PW; echo
read -rsp "Repeat password: " PW2; echo
[[ "$PW" == "$PW2" ]] || { echo "Passwords differ." >&2; exit 1; }
unset PW2
export PW POOL CLIENT EMAIL

# The aws CLI cannot read --cli-input-json from a pipe, so the JSON goes through a temp file
# readable only by you, deleted right after use (and on any error, via trap).
REQ=$(mktemp)
chmod 600 "$REQ"
trap 'rm -f "$REQ"' EXIT
json() { python3 -I -c "import json, os; e = os.environ; print(json.dumps($1))" >"$REQ"; }

# Permanent password: the account goes straight to CONFIRMED, no "change password" step.
json '{"UserPoolId": e["POOL"], "Username": e["EMAIL"], "Password": e["PW"], "Permanent": True}'
aws cognito-idp admin-set-user-password --cli-input-json "file://$REQ"
echo "Password set."

# Same sign-in flow the mobile app uses.
json '{"AuthFlow": "USER_PASSWORD_AUTH", "ClientId": e["CLIENT"], "AuthParameters": {"USERNAME": e["EMAIL"], "PASSWORD": e["PW"]}}'
aws cognito-idp initiate-auth --cli-input-json "file://$REQ" --query AuthenticationResult.TokenType --output text >/dev/null
rm -f "$REQ"
unset PW
echo "Sign-in works: Cognito issued tokens for $EMAIL."
