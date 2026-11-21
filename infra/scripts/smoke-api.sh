#!/usr/bin/env bash
# Smoke test of the deployed API: signs in to Cognito as a real user and calls an
# endpoint that needs both a valid token and the database (Neon).
#
# Usage (in your own terminal, it asks for the password):
#   infra/scripts/smoke-api.sh <email>
#
# Neither the password nor the token is printed or passed as a command-line argument
# (visible via `ps`): they go through temp files readable only by you.
set -euo pipefail

EMAIL="${1:?usage: $0 <email>}"
export AWS_PROFILE="${AWS_PROFILE:-growit}" AWS_REGION="${AWS_REGION:-eu-central-1}"

cd "$(dirname "$0")/.."
CLIENT=$(terraform output -raw app_client_id)
URL=$(terraform output -raw api_url)

if [[ -t 0 ]]; then
  read -rsp "Password for $EMAIL (hidden): " PW; echo
else
  # No terminal (e.g. Claude Code's `!` mode): ask through a hidden macOS dialog instead.
  PW=$(osascript -e "text returned of (display dialog \"GrowIt password for $EMAIL\" default answer \"\" with hidden answer)") \
    || { echo "Cancelled." >&2; exit 1; }
fi
[[ -n "$PW" ]] || { echo "Empty password." >&2; exit 1; }
export PW CLIENT EMAIL

TMP=$(mktemp -d)
chmod 700 "$TMP"
trap 'rm -rf "$TMP"' EXIT

# Same sign-in flow the mobile app uses; only the access token is kept, in a header file.
python3 -I -c 'import json, os; e = os.environ; print(json.dumps({"AuthFlow": "USER_PASSWORD_AUTH", "ClientId": e["CLIENT"], "AuthParameters": {"USERNAME": e["EMAIL"], "PASSWORD": e["PW"]}}))' >"$TMP/req.json"
unset PW
TOKEN=$(aws cognito-idp initiate-auth --cli-input-json "file://$TMP/req.json" \
  --query AuthenticationResult.AccessToken --output text)
rm -f "$TMP/req.json"
printf 'Authorization: Bearer %s\n' "$TOKEN" >"$TMP/auth.header"
unset TOKEN
echo "Signed in."

call() {
  curl -sS -o "$TMP/body.json" -w "%{http_code} %{time_total}\n" -H "@$TMP/auth.header" "$URL$1"
}

# Twice: the first call may pay for a Lambda cold start and for waking Neon up,
# the second shows the warm path.
for attempt in first second; do
  read -r code seconds < <(call /api/training-plans)
  count=$(python3 -I -c 'import json, sys; d = json.load(open(sys.argv[1])); print(len(d) if isinstance(d, list) else "-")' "$TMP/body.json" 2>/dev/null || echo "-")
  echo "GET /api/training-plans ($attempt): HTTP $code in ${seconds}s, plans: $count"
done
