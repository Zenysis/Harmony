resource "aws_route_table" "public_route_table" {
    vpc_id            = aws_vpc.base.id
    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = aws_internet_gateway.base.id
    }

    tags = {
        Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-pubRT"
        Owner                 = "${var.OWNER}"
        Environment           = "${var.ENV_CODE}"
    }
}

resource "aws_route_table_association" "public_route_association" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public_route_table.id
}
