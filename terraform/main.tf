terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# ==========================================
# 1. DynamoDB (Almacenamiento de Pagos)
# ==========================================
resource "aws_dynamodb_table" "payment_transactions" {
  name         = "${var.project_name}-transactions-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transactionId"

  attribute {
    name = "transactionId"
    type = "S"
  }
}

# ==========================================
# 2. IAM Roles & Policies (Fine-Grained - Sin Asteriscos)
# ==========================================
resource "aws_iam_role" "lambda_exec_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "${var.project_name}-dynamodb-policy-${var.environment}"
  description = "Permite acceso especifico a la tabla de DynamoDB (Fine-Grained)"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ]
        # ARN EXACTO: Cero ClickOps, cero asteriscos en el resource de DB.
        Resource = aws_dynamodb_table.payment_transactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        # Restringido a la región y cuenta actual (Evitando el "*")
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.project_name}-service-${var.environment}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attach" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
}

# ==========================================
# 3. AWS Lambda (Backend)
# ==========================================
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/src"
  output_path = "${path.module}/../backend/lambda.zip"
}

resource "aws_lambda_function" "payment_service" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-service-${var.environment}"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.payment_transactions.name
    }
  }
}

# ==========================================
# 4. API Gateway (Anti-Inyección y CORS)
# ==========================================
resource "aws_api_gateway_rest_api" "payment_api" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "API para la Pasarela de Pagos"
}

resource "aws_api_gateway_resource" "payment_resource" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = "pay"
}

# Configuración del validador de peticiones (Anti-Inyección)
resource "aws_api_gateway_request_validator" "validator" {
  name                        = "PayloadValidator"
  rest_api_id                 = aws_api_gateway_rest_api.payment_api.id
  validate_request_body       = true
  validate_request_parameters = false
}

resource "aws_api_gateway_model" "payment_model" {
  rest_api_id  = aws_api_gateway_rest_api.payment_api.id
  name         = "PaymentPayloadModel"
  description  = "Valida el esquema del pago para bloquear inyecciones"
  content_type = "application/json"

  # Esquema JSON Schema: Bloquea campos extras e inyecciones.
  schema = jsonencode({
    "$schema"            = "http://json-schema.org/draft-04/schema#"
    title                = "PaymentPayload"
    type                 = "object"
    additionalProperties = false # Bloquea campos extras (Anti-Inyección)
    required             = ["method", "amount"]
    properties = {
      method = {
        type = "string"
        enum = ["PSE", "PayPal", "Card"]
      }
      amount = {
        type = "number"
      }
      cardDetails = {
        type                 = "object"
        additionalProperties = false
        properties = {
          number = { type = "string" }
          expiry = { type = "string" }
          cvc    = { type = "string" }
          name   = { type = "string" }
        }
      }
      bankName = { type = "string" }
    }
  })
}

resource "aws_api_gateway_method" "payment_method" {
  rest_api_id          = aws_api_gateway_rest_api.payment_api.id
  resource_id          = aws_api_gateway_resource.payment_resource.id
  http_method          = "POST"
  authorization        = "NONE"
  request_validator_id = aws_api_gateway_request_validator.validator.id
  request_models = {
    "application/json" = aws_api_gateway_model.payment_model.name
  }
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.payment_api.id
  resource_id             = aws_api_gateway_resource.payment_resource.id
  http_method             = aws_api_gateway_method.payment_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.payment_service.invoke_arn
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

# ==========================================
# 5. Despliegue y Throttling (Protección DoS)
# ==========================================
resource "aws_api_gateway_deployment" "payment_deployment" {
  depends_on = [
    aws_api_gateway_integration.lambda_integration
  ]
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
}

resource "aws_api_gateway_stage" "payment_stage" {
  deployment_id = aws_api_gateway_deployment.payment_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  stage_name    = "v1"
}

resource "aws_api_gateway_method_settings" "all_methods" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  stage_name  = aws_api_gateway_stage.payment_stage.stage_name
  method_path = "*/*"

  settings {
    # Protección DoS: Throttling a nivel de API Stage
    throttling_rate_limit  = 10 # Máximo 10 peticiones por segundo
    throttling_burst_limit = 5  # Con un burst de 5 peticiones simultáneas
  }
}

# ==========================================
# CORS Configuration
# ==========================================
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.payment_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.payment_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.payment_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.payment_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
