output "vpc_id" {
  value = aws_vpc.base.id
}

output "cidr_block" {
  value = aws_vpc.base.cidr_block
}
