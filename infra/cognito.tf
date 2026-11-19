# Cognito: the user accounts (user pool) and the door the mobile app signs in through (app client).
# The mobile app talks to Cognito directly (mobile/src/auth/cognito.ts); the API only validates
# access tokens issued for the app client below (src/GrowIt.API/Program.cs).

resource "aws_cognito_user_pool" "main" {
  name = "growit-prod"

  # Lite tier: 10,000 monthly active users free; no paid add-ons (advanced security, etc.).
  user_pool_tier = "LITE"

  # Users sign in with their e-mail address; "Jan@x.pl" and "jan@x.pl" are the same account.
  username_attributes = ["email"]
  username_configuration {
    case_sensitive = false
  }

  # After sign-up Cognito e-mails a code; entering it marks the e-mail as verified.
  auto_verified_attributes = ["email"]

  # No `schema` block: email and name are standard attributes. A schema block without
  # string_attribute_constraints shows "forces replacement" on every plan, which together
  # with prevent_destroy below would block every apply.

  password_policy {
    minimum_length                   = 6
    require_lowercase                = false
    require_uppercase                = false
    require_numbers                  = false
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # No MFA and no SMS: SMS costs money and needs an extra IAM role.
  mfa_configuration = "OFF"

  # E-mails are sent by Cognito itself: free, but limited to 50 per day per account.
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # "Forgot password" sends a code to the verified e-mail.
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Used for the sign-up code and the password-reset code. {####} is replaced by the code.
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "GrowIt: Twój kod"
    email_message        = "Cześć! Twój kod do GrowIt to: {####}. Jeśli to nie Ty, zignoruj tę wiadomość."
  }

  # Self sign-up is CLOSED at the start: only an admin (us, via CLI) can create accounts.
  # It is opened by a script at the end of Stage 6, once the sign-up circuit breaker exists,
  # and the breaker may close it again. Terraform must not undo that, hence ignore_changes.
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  # Two independent safety catches against losing every account:
  # AWS refuses to delete the pool, and Terraform refuses to even plan its deletion.
  deletion_protection = "ACTIVE"

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [admin_create_user_config]
  }
}

resource "aws_cognito_user_pool_client" "mobile" {
  name         = "growit-mobile"
  user_pool_id = aws_cognito_user_pool.main.id

  # A mobile app cannot keep a secret (anyone can unpack the app), so the client has none.
  generate_secret = false

  # Exactly the two flows the app uses: e-mail + password sign-in, and refreshing tokens.
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  # Sign-out (RevokeToken) really kills the refresh token instead of just forgetting it locally.
  enable_token_revocation = true

  # "Wrong password" and "no such account" look the same, so nobody can probe which e-mails have accounts.
  prevent_user_existence_errors = "ENABLED"

  # Access/ID tokens live 1 hour (the app refreshes them silently);
  # the refresh token decides how long the user stays signed in.
  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = var.refresh_token_validity_days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # The app reads the name for the greeting and may set e-mail and name at sign-up.
  read_attributes  = ["email", "email_verified", "name"]
  write_attributes = ["email", "name"]
}
