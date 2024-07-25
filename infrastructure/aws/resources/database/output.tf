output "SECRET_STRING" {
  value = aws_secretsmanager_secret_version.base.secret_string
  sensitive = true
}
