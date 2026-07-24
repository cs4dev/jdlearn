# Remote backend — values supplied via `terraform init -backend-config=...` from
# .github/workflows/deploy.yml (or your shell). Bootstrap once via infra/bootstrap
# to provision the state bucket + GitHub OIDC role.
terraform {
  backend "s3" {}
}
