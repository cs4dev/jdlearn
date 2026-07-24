terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 5.70" }
    random = { source = "hashicorp/random", version = "~> 3.6" }
  }
  # Bootstrap state stays local — chicken-and-egg with the state bucket itself.
  # .gitignore covers *.tfstate*.
}

provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = "${var.org}-jdlearn"
}

resource "random_id" "suffix" {
  byte_length = 3
}

# ---------- Remote state bucket (used by infra/main.tf) ----------
resource "aws_s3_bucket" "tfstate" {
  bucket        = "${local.name_prefix}-tfstate-${random_id.suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# No DynamoDB lock table — the S3 backend uses native state locking
# (use_lockfile = true, Terraform >= 1.10) against the state bucket itself.

# ---------- GitHub OIDC ----------
# The provider is account-wide and can exist only once; it's already present in
# this account (created by an earlier bootstrap, e.g. heymax). Reference it.
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "deploy_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # Lock to repo + branch. Other branches/forks/tags can't assume this role.
      values = [
        "repo:${var.github_repo}:ref:refs/heads/${var.github_branch}",
      ]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "${local.name_prefix}-gh-deploy"
  assume_role_policy = data.aws_iam_policy_document.deploy_assume.json
}

# POC: AdministratorAccess. Tighten to least-privilege once the resource set stabilizes.
resource "aws_iam_role_policy_attachment" "deploy_admin" {
  role       = aws_iam_role.deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
