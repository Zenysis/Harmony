resource "aws_security_group" "db_sg" {
  name        = "${var.ENV_CODE}-${var.DEPLOYMENT}-dbsg"
  description = "Database Security Group"
  vpc_id      = data.aws_vpc.vpc.id

  lifecycle {
    create_before_destroy = true
  }
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-dbsg"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }
}

resource "aws_vpc_security_group_ingress_rule" "postgres" {
  security_group_id = aws_security_group.db_sg.id
  cidr_ipv4         = "10.0.0.0/8"
  from_port         = 5432
  to_port           = 5432
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "out" {
  security_group_id = aws_security_group.db_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1" # semantically equivalent to all ports
}
