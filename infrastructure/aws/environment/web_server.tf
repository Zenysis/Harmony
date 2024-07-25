module "web" {
  INSTANCE_TYPE      =  "t4g.medium"
  DEPLOYMENT         =  var.DEPLOYMENT
  REGION_NAME        =  var.REGION_NAME
  ENV_CODE           =  var.ENV_CODE
  source             =  "../resources/web_server"
  depends_on         = [module.network]
}
