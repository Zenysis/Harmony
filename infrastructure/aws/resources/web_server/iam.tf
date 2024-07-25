resource "aws_iam_instance_profile" "profile" {
  name = "${var.DEPLOYMENT}-profile"
  role = aws_iam_role.vault.name
}
resource "aws_iam_role" "vault" {
  name        = "${var.DEPLOYMENT}-web-role"
  description = "The role for Web Server"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
    ]
  })
}
resource "aws_iam_role_policy" "base" {
  name = "${var.DEPLOYMENT}-${var.ENV_CODE}-vault-policy"
  role = aws_iam_role.vault.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
            "ec2:*",
            "s3:*",
            "kms:*",
            "iam:*",
            "secretsmanager:*"
        ]
        Effect   = "Allow"
        Resource = "*"
      },
    ]
  })
}
resource "aws_iam_role_policy_attachment" "policy_attachment" {
  role       = aws_iam_role.vault.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
