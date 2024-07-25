resource "random_password" "db_password" {
  length  = 40
  special = false
}

resource "aws_secretsmanager_secret" "base" {
  name                            = "${var.ENV_CODE}-${var.DEPLOYMENT}-db"
  force_overwrite_replica_secret  = "true"
  recovery_window_in_days         = 0
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-db"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }
}

resource "aws_secretsmanager_secret_version" "base" {
  secret_id                 = aws_secretsmanager_secret.base.id
  secret_string             = random_password.db_password.result
}

resource "aws_db_subnet_group" "base" {
  name                      = "${var.ENV_CODE}-${var.DEPLOYMENT}-db-subnetgroup"
  subnet_ids                = data.aws_subnets.private_subnets.ids
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-db-subnetgroup"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }
}

resource "aws_db_parameter_group" "base" {
  name                      = "${var.ENV_CODE}-${var.DEPLOYMENT}-db-parameters"
  family                    = var.DB_FAMILY
  parameter {
    name                    = "log_connections"
    value                   = "1"
  }
  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}-db-parameters"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }
}

resource "aws_db_instance" "base" {
  identifier                =   "${var.ENV_CODE}-${var.DEPLOYMENT}"
  db_name                   =   replace(var.DEPLOYMENT, "-", "_")
  instance_class            =   var.DB_SIZE
  allocated_storage         =   var.ALLOCATED_STORAGE
  max_allocated_storage     =   200
  copy_tags_to_snapshot     =   true
  deletion_protection       =   false
  engine                    =   var.ENGINE
  engine_version            =   var.ENGINE_VERSION
  username                  =   replace(var.DEPLOYMENT, "-", "_")
  password                  =   aws_secretsmanager_secret_version.base.secret_string
  vpc_security_group_ids    =   [aws_security_group.db_sg.id]
  publicly_accessible       =   var.PUBLICLY_ACCESSIBLE
  skip_final_snapshot       =   var.SKIP_FINAL_SNAPSHOT
  multi_az                  =   var.MULTI_AZ
  db_subnet_group_name      =   aws_db_subnet_group.base.name
  parameter_group_name      =   aws_db_parameter_group.base.name
  ca_cert_identifier        =   "rds-ca-rsa2048-g1"
  storage_encrypted         =   true

  tags = {
      Name                  = "${var.ENV_CODE}-${var.DEPLOYMENT}"
      Owner                 = "${var.OWNER}"
      Environment           = "${var.ENV_CODE}"
      Deployment            = "${var.DEPLOYMENT}"
  }

  lifecycle {
    ignore_changes = [
      tags,
    ]
  }

  depends_on = [aws_security_group.db_sg, aws_db_parameter_group.base, aws_secretsmanager_secret.base]
}
