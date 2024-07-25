**Dashboard Schema Directory Architecture**
The current dashboard schema is stored in the `latest/` directory. This is the only dashboard schema that should ever be modified. All historical schemas are stored in the `schema_YYYYMMDD` directories and should be considered *frozen* -- they should not be modified later.

The reason we only modify the schema in `latest/` is so that we can cleanly track changes to the specification during diff reviews. This also helps us more cleanly handle conflicting dashboard schema updates. If two diffs are modifying the latest dashboard schema, we will be able to reconcile their combined changes when one lands after another.

**Upgrading a Dashboard Schema**

***Automated Process***
Run `models/python/dashboard/scripts/create_new_schema.sh`. This is a best effort script to build and update all the schema dependent files to use a new version. If it fails, or you are left in a weird state, talk to Stephen.

Note that you will likely need to customize the `_upgrade_YYYY_MM_dd_specification` and `_downgrade_YYYY_MM_dd_specification` functions in `models/python/dashboard/version.py`.

***Manual Process***
***Create the New Schema***
1. Copy the `latest/` directory into a `schema_YYYYMMDD` directory. The folder name should match the date of that schema version (this can be found in version.py::LATEST_VERSION). This preserves the previous schema version so we can use it to deserialize older schemas.

***Creating the Upgrade/Downgrade Functions***
Now we have to specify how old dashboards should upgrade to this new spec:
In `version.py`
2. Add a new import to import our newly frozen specification (`schema_YYYYMMDD`). Place this import directly before the `latest` import and follow the naming convention of earlier lines.
3. Add a `VERSION_YYYY_MM_DD` constant, and update `LATEST_VERSION` to point to it.
4. Add the new version to `DASHBOARD_SCHEMA_VERSIONS` and `NEXT_SCHEMA_VERSION_MAP`.
5. Add an `_upgrade_YYYY_MM_dd_specification` function to upgrade the previous version. The date here is the same as the `schema_YYYYMMDD` that we just created earlier.
6. Add an `_downgrade_YYYY_MM_dd_specification` function to downgrade this new version. The date here is the same as the `schema_YYYYMMDD` that we just created earlier.
7. In the `VERSION_TO_UPGRADE_FUNCTION` dict, map the previous version to this function.
8. If necessary, alter the new `test_upgrade_downgrade_YYYY_MM_dd_specification` test in `test_schema_upgrade_downgrade.py`. The date here is the same as the `schema_YYYYMMDD` that we just created earlier.

***Updating Artifacts***
- Now tell the frontend to expect the new version

7. Update the `EXPECTED_VERSION` in `web/client/models/core/Dashboard/DashboardSpecification/index.js`
