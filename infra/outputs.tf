output "http_url" {
  value       = aws_lambda_function_url.http.function_url
  description = "Lambda Function URL (origin behind CloudFront /trpc + /api)"
}

output "web_url" {
  value       = "https://${var.web_domain}"
  description = "Public site URL (CloudFront, custom domain)"
}

output "cf_domain" {
  value       = aws_cloudfront_distribution.web.domain_name
  description = "CloudFront default domain (pre-DNS)"
}

output "web_bucket" {
  value = aws_s3_bucket.web.bucket
}

output "cf_distribution_id" {
  value = aws_cloudfront_distribution.web.id
}
