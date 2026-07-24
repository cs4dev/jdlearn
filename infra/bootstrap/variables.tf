variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "org" {
  type        = string
  description = "Short org slug used to namespace global resources (S3 bucket, IAM role names)"
  default     = "cs4dev"
}

variable "github_repo" {
  type        = string
  description = "GitHub repo in 'owner/repo' form"
  default     = "cs4dev/jdlearn"
}

variable "github_branch" {
  type        = string
  description = "Branch the deploy workflow can run from"
  default     = "main"
}
