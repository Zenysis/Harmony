terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket      = "mols-terraform-state"
    key         = "stag"
    region      = "eu-west-1"
  }
}

provider "aws" {
  region      = "eu-west-1"
}
