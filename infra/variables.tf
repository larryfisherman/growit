# Settings that can change without touching the resource code.
# NO secrets here: variable values end up in the Terraform state.
# More variables (alert e-mail, alarm thresholds) arrive with Stage 6 guardrails.

variable "refresh_token_validity_days" {
  description = "How long the mobile app stays signed in. Counted from sign-in (no rotation), so even an active user signs in again after this many days."
  type        = number
  default     = 90

  validation {
    condition     = var.refresh_token_validity_days >= 1 && var.refresh_token_validity_days <= 3650
    error_message = "Cognito accepts 1 to 3650 days."
  }
}
