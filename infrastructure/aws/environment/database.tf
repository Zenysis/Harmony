module "database" {
  ALLOCATED_STORAGE          =  "50"
  DB_SIZE                    =  "db.t4g.medium"
  ENGINE                     =  "postgres"
  ENGINE_VERSION             =  "15"
  MULTI_AZ                   =  "false"
  PUBLICLY_ACCESSIBLE        =  "false"
  SKIP_FINAL_SNAPSHOT        =  "true"
  DEPLOYMENT                 =  var.DEPLOYMENT
  REGION_NAME                =  var.REGION_NAME
  ENV_CODE                   =  var.ENV_CODE
  source                     =  "../resources/database"
  depends_on                 = [module.network]
}
