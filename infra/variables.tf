variable "env" {
  type    = string
  default = "prod"
}

variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "mongodb_uri" {
  type        = string
  sensitive   = true
  description = "MongoDB connection string (env: MONGO_URL). Atlas SRV (mongodb+srv://...) recommended."
}

variable "auth_secret" {
  type        = string
  sensitive   = true
  description = "Better Auth secret (env: BETTER_AUTH_SECRET), min 16 chars."
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

variable "google_client_id" {
  type        = string
  default     = ""
  description = "Google OAuth client id. Blank disables 'Continue with Google'; email/password still works."
}

variable "google_client_secret" {
  type      = string
  sensitive = true
  default   = ""
}

# Custom domain for the web app. Must be a subdomain of an existing Route53 zone.
variable "web_domain" {
  type    = string
  default = "jdlearn.cs4dev.org"
}

variable "route53_zone_name" {
  type        = string
  description = "Route53 hosted zone (no trailing dot)"
  default     = "cs4dev.org"
}
