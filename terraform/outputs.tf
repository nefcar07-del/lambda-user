output "api_gateway_url" {
  description = "URL base del API Gateway desplegado para conectar con el Frontend"
  value       = aws_api_gateway_stage.payment_stage.invoke_url
}

output "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB creada"
  value       = aws_dynamodb_table.payment_transactions.name
}

output "lambda_function_name" {
  description = "Nombre de la Lambda function desplegada"
  value       = aws_lambda_function.payment_service.function_name
}
