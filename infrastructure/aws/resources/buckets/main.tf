resource "aws_s3_bucket" "base" {
  bucket = "${var.DEPLOYMENT}-${var.ENV_CODE}"
    tags = {
        Name                  = "${var.DEPLOYMENT}-${var.ENV_CODE}"
        Owner                 = "${var.OWNER}"
        Environment           = "${var.ENV_CODE}"
        Deployment            = "${var.DEPLOYMENT}"
    }
}
