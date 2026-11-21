# Values printed after apply and readable with `terraform output <name>`.

output "aws_account_id" {
  description = "Account the growit profile points at; check it before the first apply."
  value       = data.aws_caller_identity.current.account_id
}

output "user_pool_id" {
  description = "Goes to mobile/.env as EXPO_PUBLIC_COGNITO_USER_POOL_ID."
  value       = aws_cognito_user_pool.main.id
}

output "app_client_id" {
  description = "Goes to mobile/.env as EXPO_PUBLIC_COGNITO_CLIENT_ID and to appsettings.json as Cognito:ClientId."
  value       = aws_cognito_user_pool_client.mobile.id
}

output "cognito_authority" {
  description = "Goes to appsettings.json as Cognito:Authority (token issuer the API trusts)."
  value       = "https://${aws_cognito_user_pool.main.endpoint}"
}

output "api_url" {
  description = "Public API address, without the trailing slash (Pitfall 19). Goes to mobile/.env.production in Stage 7."
  value       = trimsuffix(aws_lambda_function_url.api.function_url, "/")
}

output "api_function_name" {
  description = "For aws lambda / aws logs commands."
  value       = aws_lambda_function.api.function_name
}
