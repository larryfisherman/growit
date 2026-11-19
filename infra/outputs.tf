# Values printed after apply and readable with `terraform output <name>`.
# Cognito ids (for appsettings.json and mobile/.env) are added together with cognito.tf.

output "aws_account_id" {
  description = "Account the growit profile points at; check it before the first apply."
  value       = data.aws_caller_identity.current.account_id
}
