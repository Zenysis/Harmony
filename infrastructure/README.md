## Harmony Infrastructure Set Up

### Overview

The Harmony Project uses terraform to create infrastructure on which it runs. Currently we only support AWS set up.

### Prerequisite

You would need the following to set up the infrastructure:
1. An AWS Account
2. Terraform Installed on your laptop/computer
3. Create an S3 Bucket to store the Terraform state

### Configuration

We have a template folder which you need to copy into an an environment folder. For example if you would like to create a staging environment, do the following:
```
cp -r infrastructure/aws/template  infrastructure/aws/staging
```

Let's assume that you are a Ministry of Health in a country called Zamunda.
We will use the following naming(can be adjusuted to suit your preference):

- YOUR_SHORT_CODE: zd (Let's say that's an iso code for country Zamunda)
- AWS_REGION_OF_YOUR_CHOICE: eu-west-1 (Let's say that's the AWS region close to you)
- ENVIRONMENT_CODE: staging (Or you could use stag)
- YOUR_NAME_OR_DEPT: ZamundaMinistryOfHelth (or ZMoH)


Then edit the following:
1. infrastructure/aws/staging/main.tf
```
module "deployment" {
    DEPLOYMENT          = "__YOUR_SHORT_CODE__"
    REGION_NAME         = "__AWS_REGION_OF_YOUR_CHOICE__"
    ENV_CODE            = "__ENVIRONMENT_CODE__"
    OWNER               = "__YOUR_NAME_OR_DEPT__"
    source             =  "../env"
}
```
becomes:
```
module "deployment" {
    DEPLOYMENT          = "zd"
    REGION_NAME         = "eu-west-1"
    ENV_CODE            = "staging"
    OWNER               = "ZamundaMinistryOfHelth"
    source             =  "../env"
}
```
2. infrastructure/aws/staging/provider.tf
