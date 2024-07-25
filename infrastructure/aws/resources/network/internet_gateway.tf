resource "aws_internet_gateway" "base" {
  vpc_id = aws_vpc.base.id
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-igw"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }
}
