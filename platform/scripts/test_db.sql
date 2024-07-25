CREATE USER "power_user" WITH
  LOGIN
  SUPERUSER
  CONNECTION LIMIT -1
  PASSWORD 'zenpass';
COMMIT;

CREATE USER "test_admin" WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  INHERIT
  NOREPLICATION
  CONNECTION LIMIT -1
  PASSWORD 'zenpass';

CREATE USER "druid_user" WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  INHERIT
  NOREPLICATION
  CONNECTION LIMIT -1
  PASSWORD 'druidzenpass';

-- We also want the `power_user` user to have access to whatever permissions that
-- `et-staging-admin` will possess.
GRANT "test_admin" TO "power_user" WITH ADMIN OPTION;
COMMIT;

CREATE DATABASE "zenysis"
    WITH
    OWNER = "test_admin"
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;
COMMIT;

CREATE DATABASE "druid"
    WITH
    OWNER = "druid_user"
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;
COMMIT;
