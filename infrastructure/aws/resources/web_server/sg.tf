resource "aws_security_group" "sg" {
  name        = "${var.ENV_CODE}-${var.DEPLOYMENT}-websg"
  description = "Vault Security Group"
  vpc_id      = data.aws_vpc.vpc.id

  lifecycle {
    create_before_destroy = true
  }
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-websg"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }
}

resource "aws_vpc_security_group_ingress_rule" "all_traffic_in_VPC" {
  security_group_id = aws_security_group.sg.id
  cidr_ipv4         = "10.0.0.0/8"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_egress_rule" "out" {
  security_group_id = aws_security_group.sg.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
