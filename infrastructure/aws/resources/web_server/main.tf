resource "aws_instance" "base" {
  instance_type               = var.INSTANCE_TYPE
  key_name                    = ""
  ami                         = data.aws_ami.ubuntu-22-arm.id
  subnet_id                   = data.aws_subnets.public_subnets.ids[0]
  vpc_security_group_ids      = [aws_security_group.sg.id]
  iam_instance_profile        =  "${var.DEPLOYMENT}-profile"
  root_block_device {
    volume_size               = 50
    encrypted                 = true
    volume_type               = "gp3"
  }
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-web"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }

  user_data                 = data.template_file.template.rendered

  lifecycle {
    ignore_changes = [
      ami,
      tags,
    ]
  }
}
