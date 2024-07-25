variable "DEPLOYMENT"                  {                         }
variable "DB_SIZE"                     {                         }
variable "ENGINE"                      {                         }
variable "ENGINE_VERSION"              {                         }
variable "DB_FAMILY"                   { default = "postgres15"  }
variable "ALLOCATED_STORAGE"           { default = 50            }
variable "PUBLICLY_ACCESSIBLE"         { default = "false"       }
variable "SKIP_FINAL_SNAPSHOT"         { default = "true"        }
variable "MULTI_AZ"                    { default = "false"       }
variable "REGION_NAME"                 { default = "us-east-1"   }
variable "ENV_CODE"                    { default = "dev"         }
variable "OWNER"                       { default = "Engineering" }
