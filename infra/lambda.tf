# The API itself: one Lambda function with a public HTTPS address (Function URL).
#
# Cost: $0 within the always-free tier (1M requests + 400,000 GB-s per month; at 1 GB
# that is ~111 hours of busy API per month). Function URL, IAM and the SSM Standard
# parameter cost nothing; CloudWatch Logs are free up to 5 GB ingested per month.
#
# The code package is built by scripts/deploy-api.sh BEFORE plan/apply, because
# Terraform hashes the zip to notice that the code changed.

locals {
  api_function_name = "growit-api"
  api_package       = "${path.module}/../artifacts/growit-api.zip"
  ssm_path          = "/growit/prod"
}

data "aws_region" "current" {}

# --- Logs -------------------------------------------------------------------------------

# Created by us, before the function. Otherwise Lambda creates the group itself on the
# first invocation, with retention "never expire" and outside Terraform's control.
resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${local.api_function_name}"
  retention_in_days = 14
}

# --- Identity: what the function itself is allowed to do --------------------------------

# Trust policy: only the Lambda service may "wear" this role.
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api" {
  name               = "${local.api_function_name}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

# Least privilege: write to its own log group and read its own config branch, nothing
# else. No kms:Decrypt: the AWS-managed key aws/ssm already lets any principal in the
# account decrypt through SSM. We add it only if Lambda reports AccessDenied.
data "aws_iam_policy_document" "api" {
  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*"]
  }

  statement {
    sid     = "ReadOwnConfig"
    actions = ["ssm:GetParametersByPath", "ssm:GetParameter"]
    resources = [
      # GetParametersByPath is authorized against the path itself, GetParameter against
      # each parameter under it.
      "arn:aws:ssm:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_path}",
      "arn:aws:ssm:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_path}/*",
    ]
  }
}

resource "aws_iam_role_policy" "api" {
  name   = "logs-and-config"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api.json
}

# --- The function -------------------------------------------------------------------------

resource "aws_lambda_function" "api" {
  function_name = local.api_function_name
  role          = aws_iam_role.api.arn

  runtime       = "dotnet10"
  handler       = "GrowIt.API" # executable assembly: Program.cs starts, AddAWSLambdaHosting takes over
  architectures = ["arm64"]    # Graviton: ~20% cheaper per GB-s than x86 and usually faster to start
  memory_size   = 1024         # Lambda gives CPU in proportion to memory; .NET cold start suffers below 1 GB
  timeout       = 30           # default 3 s would kill a request waiting for Neon to wake up

  filename         = local.api_package
  source_code_hash = filebase64sha256(local.api_package)

  # At most 5 copies run at once (~50 req/s for short requests). Caps the damage of a
  # request flood, and Stage 6 kill switch sets it to 0 to switch the API off.
  reserved_concurrent_executions = var.api_reserved_concurrency

  # No logging_config block = plain Text format. ASP.NET itself keeps only Warning+
  # (appsettings.Production.json), and the START/REPORT lines with Init Duration stay
  # visible. JSON format + application_log_level=WARN would hide our errors (Pitfall 16).

  # No vpc_config: inside a VPC the function would need a NAT gateway (~$35/month) to
  # reach Neon, Cognito and SSM (Pitfall 9).

  environment {
    variables = {
      ASPNETCORE_ENVIRONMENT     = "Production"
      Ssm__Path                  = local.ssm_path # Program.cs loads /growit/prod/* as configuration
      Database__MigrateOnStartup = "false"        # migrations only by hand, as the owner role (Pitfall 3)
      Cognito__Authority         = "https://${aws_cognito_user_pool.main.endpoint}"
      Cognito__ClientId          = aws_cognito_user_pool_client.mobile.id
      # Changing it forces fresh execution environments, which re-read SSM at startup.
      CONFIG_REVISION = tostring(var.config_revision)
    }
  }

  # Log group and permissions must exist before the first cold start writes a log line.
  depends_on = [aws_cloudwatch_log_group.api, aws_iam_role_policy.api]

  lifecycle {
    # The Stage 6 kill switch changes this outside Terraform; a later apply must not
    # silently switch the API back on (Pitfall 10). Reopen only with the script.
    ignore_changes = [reserved_concurrent_executions]
  }
}

# --- Public address -----------------------------------------------------------------------

# NONE = no AWS signature needed; the API checks Cognito tokens itself. No cors block:
# ASP.NET already sends CORS headers, a second set would duplicate them (Pitfall 20).
resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "NONE"

  lifecycle {
    # Recreating the URL changes its hostname, and the mobile app has it built in (Pitfall 18).
    prevent_destroy = true
  }
}

# Resource policy: since late 2025 a public Function URL needs BOTH statements. The
# console adds them automatically, the API (and so Terraform) does not; without them
# every request ends with 403 Forbidden.
resource "aws_lambda_permission" "url_public" {
  statement_id           = "FunctionURLAllowPublicAccess"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.api.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "url_invoke" {
  statement_id             = "FunctionURLAllowInvokeAction"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.api.function_name
  principal                = "*"
  invoked_via_function_url = true # only through the URL, not a direct Invoke API call
}
