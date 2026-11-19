# Which AWS account and region the aws provider talks to.

provider "aws" {
  region  = "eu-central-1"
  profile = "growit"

  # Added to every resource that supports tags, so the AWS console and the bill
  # show what belongs to GrowIt and that it is managed by Terraform.
  default_tags {
    tags = {
      Project     = "growit"
      Environment = "prod"
      ManagedBy   = "terraform"
      Stack       = "main"
    }
  }
}

# Read-only lookup of the identity behind the "growit" profile (creates nothing).
data "aws_caller_identity" "current" {}
