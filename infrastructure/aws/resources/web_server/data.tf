data "aws_vpc" "vpc" {
  tags = {
    Name = "${var.ENV_CODE}-${var.DEPLOYMENT}-vpc"
  }
}
data "aws_subnets" "public_subnets" {
  filter {
    name   = "tag:Name"
    values = [
                "${var.ENV_CODE}-${var.DEPLOYMENT}-pubA",
                "${var.ENV_CODE}-${var.DEPLOYMENT}-pubB"
    ]
  }
}


data "aws_subnets" "private_subnets" {
  filter {
    name   = "tag:Name"
    values = [
                "${var.ENV_CODE}-${var.DEPLOYMENT}-privA",
                "${var.ENV_CODE}-${var.DEPLOYMENT}-privB"
    ]
  }
}

data "aws_ami" "ubuntu22" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "template_file" "template" {
  template    = file("${path.module}/template.tpl")
  vars        = {
      SERVER_NAME               = "${var.DEPLOYMENT}-web.${var.ENV_CODE}.${var.BASE_DOMAIN}"
      VAULT_HOST                = "${var.DEPLOYMENT}-vault.${var.ENV_CODE}.${var.BASE_DOMAIN}"
      DB_HOST                   = "${var.DEPLOYMENT}-db.${var.ENV_CODE}.${var.BASE_DOMAIN}"
      DEPLOYMENT                = var.DEPLOYMENT
      REGION_NAME               = var.REGION_NAME
      ENV_CODE                  = var.ENV_CODE
  }
}


data "aws_ami" "ubuntu-22-amd" {
    most_recent = true
    filter {
        name   = "name"
        values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
    }
    filter {
        name = "virtualization-type"
        values = ["hvm"]
    }
    owners = ["099720109477"]
}


data "aws_ami" "ubuntu-22-arm" {
    most_recent = true
    filter {
        name   = "name"
        values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-arm64-server-*"]
    }
    filter {
        name = "virtualization-type"
        values = ["hvm"]
    }
    owners = ["099720109477"]
}

data "aws_ami" "ubuntu-24-arm" {
    most_recent = true
    filter {
        name   = "name"
        values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*"]
    }
    filter {
        name = "virtualization-type"
        values = ["hvm"]
    }
    owners = ["099720109477"]
}
