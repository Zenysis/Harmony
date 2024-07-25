resource "aws_route_table" "private_route_table" {
    vpc_id = aws_vpc.base.id


    tags = {
        Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-privRTA"
        Owner                 = "${var.OWNER}"
        Environment           = "${var.ENV_CODE}"
        Deployment            = "${var.DEPLOYMENT}"
    }
}

resource "aws_route_table_association" "private_route_association" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private_route_table.id
}
