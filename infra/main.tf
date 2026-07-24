terraform {
  required_version = ">= 1.10.0" # native S3 state locking (use_lockfile)
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.70" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
}

provider "aws" {
  region = var.aws_region
}

# ACM certs used by CloudFront MUST live in us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

locals {
  name_prefix = "jdlearn-${var.env}"
  web_origin  = "https://${var.web_domain}"
  tags = {
    Project = "jdlearn"
    Env     = var.env
    Managed = "terraform"
  }

  # Env for the HTTP Lambda. Secrets live here directly (encrypted at rest via
  # Lambda's managed KMS key) — acceptable blast radius for a POC. Names match
  # packages/server/src/env.ts; anything with a sane dev default there (MONGO_DB,
  # ANTHROPIC_MODEL, ANTHROPIC_EXTRACT_MODEL) is omitted and falls back.
  lambda_env = {
    NODE_ENV           = "production"
    MONGO_URL          = var.mongodb_uri
    BETTER_AUTH_SECRET = var.auth_secret
    BETTER_AUTH_URL    = local.web_origin
    # Better Auth rejects mismatched Origin; same-origin via CloudFront means the
    # public origin is the only one that reaches the API.
    TRUSTED_ORIGINS      = local.web_origin
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    ANTHROPIC_API_KEY    = var.anthropic_api_key
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

# ---------- IAM (Lambda execution: CloudWatch logs only) ----------
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "${local.name_prefix}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ---------- HTTP Lambda + Function URL ----------
# Zip produced by `pnpm --filter @jdlearn/server build:lambda` (esbuild.mjs).
locals {
  http_zip = "${path.module}/../packages/server/dist/lambda/http.zip"
}

resource "aws_lambda_function" "http" {
  function_name    = "${local.name_prefix}-http"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "http.handler"
  runtime          = "nodejs22.x"
  filename         = local.http_zip
  source_code_hash = filebase64sha256(local.http_zip)
  timeout          = 30 # Anthropic generation (cover letter + plan) can run long.
  memory_size      = 512

  environment {
    variables = local.lambda_env
  }
  tags = local.tags
}

resource "aws_lambda_function_url" "http" {
  function_name      = aws_lambda_function.http.function_name
  authorization_type = "NONE"
  invoke_mode        = "BUFFERED"
  # Consulted only for direct hits to the Function URL — same-origin via CloudFront
  # means browsers never preflight /trpc or /api (CF domain → CF domain).
  cors {
    allow_origins     = [local.web_origin, "http://localhost:5173"]
    allow_methods     = ["*"]
    allow_headers     = ["content-type", "authorization", "cookie"]
    allow_credentials = true
    max_age           = 3600
  }
}

# ---------- Web hosting: S3 + CloudFront (same-origin proxy to the API) ----------
resource "aws_s3_bucket" "web" {
  bucket        = "${local.name_prefix}-web-${random_id.suffix.hex}"
  force_destroy = true
  tags          = local.tags
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket                  = aws_s3_bucket.web.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "${local.name_prefix}-web-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

data "aws_iam_policy_document" "web_bucket" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.web.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.web.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "web" {
  bucket = aws_s3_bucket.web.id
  policy = data.aws_iam_policy_document.web_bucket.json
}

# Lambda Function URL host (strip protocol + trailing slash) — CF origin domain.
locals {
  http_lambda_host = replace(replace(aws_lambda_function_url.http.function_url, "https://", ""), "/", "")
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

# Forwards everything except Host (the Lambda URL needs its own Host header).
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# SPA routing WITHOUT a distribution-wide custom_error_response (which would also
# rewrite the API's own 403/404 responses into index.html — breaking tRPC's JSON
# parsing with "Unexpected token '<'"). Attached to the S3 default behavior ONLY;
# /trpc/* and /api/* have their own behaviors, so their real status codes pass through.
resource "aws_cloudfront_function" "spa_router" {
  name    = "${local.name_prefix}-spa-router"
  runtime = "cloudfront-js-2.0"
  comment = "Extensionless (client-router) paths → /index.html; real static files (with an extension) hit S3 as-is."
  publish = true
  code    = <<-JS
    function handler(event) {
      var req = event.request;
      var uri = req.uri;
      var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
      if (lastSegment.indexOf('.') === -1) {
        req.uri = '/index.html';
      }
      return req;
    }
  JS
}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "${local.name_prefix} — web + same-origin api proxy"
  price_class         = "PriceClass_200" # NA + EU + SEA/JP/India edges — better TTFB for SG users.
  aliases             = [var.web_domain]

  # ---- Origin: S3 (web bundle) ----
  origin {
    origin_id                = "s3-web"
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  # ---- Origin: Lambda Function URL (api) ----
  origin {
    origin_id   = "lambda-api"
    domain_name = local.http_lambda_host
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default: serve the web bundle from S3.
  default_cache_behavior {
    target_origin_id       = "s3-web"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_router.arn
    }
  }

  # /trpc/* → Lambda. No caching (auth'd, cookie-bearing batches); forward all viewer.
  ordered_cache_behavior {
    path_pattern             = "/trpc/*"
    target_origin_id         = "lambda-api"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    compress                 = true
  }

  # /api/* → Lambda. Covers Better Auth (/api/auth/*) and /api/health.
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    target_origin_id         = "lambda-api"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
    compress                 = true
  }

  # SPA fallback is handled by aws_cloudfront_function.spa_router on the default
  # behavior (above) — NOT a distribution-wide custom_error_response, which would
  # also swallow the API's 403/404 JSON errors and hand back index.html instead.

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.web.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = local.tags
}

# ---------- Existing wildcard ACM cert (already issued, in us-east-1) ----------
data "aws_route53_zone" "main" {
  name = "${var.route53_zone_name}."
}

data "aws_acm_certificate" "web" {
  provider    = aws.us_east_1
  domain      = var.route53_zone_name
  statuses    = ["ISSUED"]
  most_recent = true
}

# ---------- Route53 alias: jdlearn.cs4dev.org → CloudFront ----------
resource "aws_route53_record" "web_alias" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.web_domain
  type    = "A"
  alias {
    name                   = aws_cloudfront_distribution.web.domain_name
    zone_id                = aws_cloudfront_distribution.web.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "web_alias_v6" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.web_domain
  type    = "AAAA"
  alias {
    name                   = aws_cloudfront_distribution.web.domain_name
    zone_id                = aws_cloudfront_distribution.web.hosted_zone_id
    evaluate_target_health = false
  }
}
