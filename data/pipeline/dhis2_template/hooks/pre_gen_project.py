import sys

from termcolor import colored


def enforce_required_vars() -> int:
    required_vars = (
        ("{{cookiecutter.deployment}}", "Deployment is required"),
        ("{{cookiecutter.integration_name}}", "Integration name is required"),
        ("{{cookiecutter.passphrase_id}}", "Passphrase ID is required"),
        ("{{cookiecutter.minio_path}}", "Minio or S3 path is required"),
        ("{{cookiecutter.dhis2_domain}}", "DHIS2 domain name is required"),
        ("{{cookiecutter.nation}}", "Nation ID is required"),
    )
    errors = False
    for var, error in required_vars:
        if not var:
            print(colored(error, "red"))
            errors = True
    if errors:
        raise ValueError("Missing required variables")
    return 0


if __name__ == '__main__':
    sys.exit(enforce_required_vars())
