module "network" {
  VPC_CIDR         =  "10.90.0.0/16"
  DEPLOYMENT       =  var.DEPLOYMENT
  REGION_NAME      =  var.REGION_NAME
  ENV_CODE         =  var.ENV_CODE
  source           =  "../resources/network"
}
