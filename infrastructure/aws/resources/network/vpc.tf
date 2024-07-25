resource "aws_vpc"  "base" {
    cidr_block                = var.VPC_CIDR
    enable_dns_support        = "true"
    enable_dns_hostnames      = "true"
    instance_tenancy          = "default"

    tags = {
        Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-vpc"
        Owner                 = var.OWNER
        Environment           = var.ENV_CODE
        Deployment            = var.DEPLOYMENT
    }
}
