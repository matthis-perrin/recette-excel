terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.1"
    }
  }
}

provider "aws" {
  region                   = "eu-west-3"
  shared_credentials_files = ["./.aws-credentials"]
  default_tags {
    tags = {
      Project = "recette-excel"
    }
  }
}

provider "aws" {
  alias                    = "us-east-1"
  region                   = "us-east-1"
  shared_credentials_files = ["./.aws-credentials"]
  default_tags {
    tags = {
      Project = "recette-excel"
    }
  }
}

data "aws_region" "current" {}
output "region" {
  value = data.aws_region.current.id
}

data "aws_caller_identity" "current" {}
output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

data "aws_iam_roles" "administrator_roles" {
  name_regex = "AdministratorAccess"
}

resource "aws_s3_bucket" "code" {
  bucket_prefix = "recette-excel-code-"
}

output "code_bucket" {
  value = aws_s3_bucket.code.id
}

data "aws_iam_policy_document" "cloudfront_access_to_code_policy" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.code.arn}/website/*",
    ]
    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.website.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudfront_access_to_code" {
  bucket = aws_s3_bucket.code.id
  policy = data.aws_iam_policy_document.cloudfront_access_to_code_policy.json
}
