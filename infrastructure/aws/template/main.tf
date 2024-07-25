module "deployment" {
    DEPLOYMENT          = "__YOUR_SHORT_CODE__"
    REGION_NAME         = "__AWS_REGION_OF_YOUR_CHOICE__"
    ENV_CODE            = "__ENVIRONMENT_CODE__"
    OWNER               = "__YOUR_NAME_OR_DEPT__"
    source             =  "../env"
}
