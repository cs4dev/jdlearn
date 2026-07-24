output "tfstate_bucket" {
  value       = aws_s3_bucket.tfstate.bucket
  description = "Set as GitHub Variable TFSTATE_BUCKET"
}

output "deploy_role_arn" {
  value       = aws_iam_role.deploy.arn
  description = "Set as GitHub Secret AWS_DEPLOY_ROLE_ARN"
}
