# Bootstrap: creates ONLY the S3 bucket that stores the main stack's Terraform state.
#
# Chicken-and-egg: the main stack (infra/) keeps its state in this bucket, so the
# bucket cannot be created by the main stack itself. This tiny stack keeps its own
# state locally (infra/bootstrap/terraform.tfstate, git-ignored). Losing that local
# file is harmless: it only describes this one bucket, which can be re-imported.
#
# Run once:  cd infra/bootstrap && terraform init && terraform apply

terraform {
  required_version = ">= 1.15"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.70"
    }
  }
}

provider "aws" {
  region  = "eu-central-1"
  profile = "growit"

  default_tags {
    tags = {
      Project   = "growit"
      ManagedBy = "terraform"
      Stack     = "bootstrap"
    }
  }
}

locals {
  # S3 bucket names are global across all AWS accounts, hence the random suffix.
  # It is NOT a secret: the bucket is private, knowing its name grants nothing.
  state_bucket_name = "growit-tfstate-d6e02fc1"
}

resource "aws_s3_bucket" "state" {
  bucket = local.state_bucket_name

  # Deleting this bucket would make Terraform forget the whole infrastructure.
  lifecycle {
    prevent_destroy = true
  }
}

# Every write of the state creates a new version, so a bad apply can be rolled back.
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption at rest with S3-managed keys (free, unlike a customer KMS key).
resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# No public access, ever, even if someone later adds a careless policy or ACL.
resource "aws_s3_bucket_public_access_block" "state" {
  bucket = aws_s3_bucket.state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ACLs off: access is controlled by IAM only.
resource "aws_s3_bucket_ownership_controls" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Old state versions are kept 90 days, then deleted, so the bucket does not grow forever.
resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket = aws_s3_bucket.state.id

  rule {
    id     = "expire-old-state-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  depends_on = [aws_s3_bucket_versioning.state]
}

# Refuse any request that is not over HTTPS.
resource "aws_s3_bucket_policy" "state" {
  bucket = aws_s3_bucket.state.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "DenyInsecureTransport"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.state.arn, "${aws_s3_bucket.state.arn}/*"]
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.state]
}

output "state_bucket_name" {
  value = aws_s3_bucket.state.bucket
}
