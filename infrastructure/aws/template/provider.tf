terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket      = "mols-terraform-state"
    key         = "__ENVIRONMENT_CODE__"
    region      = "__AWS_REGION_OF_YOUR_CHOICE__"
  }
}

provider "aws" {
  region      = "__AWS_REGION_OF_YOUR_CHOICE__"
}
