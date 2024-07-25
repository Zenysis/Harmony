data "aws_vpc" "vpc" {
  tags = {
    Name = "${var.ENV_CODE}-${var.DEPLOYMENT}-vpc"
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
