module "deployment" {
    DEPLOYMENT          = "mols"
    REGION_NAME         = "eu-west-1"
    ENV_CODE            = "stag"
    OWNER               = "MoLs"
    source             =  "../env"
}
