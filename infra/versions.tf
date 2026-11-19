# Terraform itself: required versions and where the state lives.

terraform {
  required_version = ">= 1.15"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.70"
    }
  }

  # State is kept in the S3 bucket created by infra/bootstrap.
  # Backend blocks cannot use variables, hence the literal values.
  backend "s3" {
    bucket       = "growit-tfstate-d6e02fc1"
    key          = "growit/prod.tfstate"
    region       = "eu-central-1"
    profile      = "growit"
    encrypt      = true
    use_lockfile = true # writes growit/prod.tfstate.tflock during plan/apply, blocks a parallel run
  }
}
