resource "aws_subnet" "private" {
  count             =   2
  vpc_id            = aws_vpc.base.id
  cidr_block        = cidrsubnet("${var.VPC_CIDR}", 4, count.index + 2)
  availability_zone = "${var.REGION_NAME}${["a", "b"][count.index]}"
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-priv${["A", "B"][count.index]}"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }
}
