from flask import request
from flask_potion import fields
from flask_potion.routes import Route
from flask_potion.schema import FieldSet

from models.alchemy.data_upload import DataUploadFileSummary
from web.server.api.api_models import PrincipalResource
from web.server.api.data_upload_api_schema import (
    FILE_SUMMARY_SCHEMA,
    DATAPREP_UPLOAD_SCHEMA,
    DATAPREP_SETUP_SCHEMA,
    SOURCE_ID_SCHEMA,
)
from web.server.routes.views.authorization import authorization_required
from web.server.routes.views.data_upload_summary import (
    clean_files_in_object_storage,
    delete_source_from_object_storage,
    download_input_file,
    get_file_preview,
    get_sources_date_ranges,
    handle_self_server_upload,
    update_all_dataprep_jobs,
    update_csv_source_remote_files,
    upload_and_start_dataprep_job,
    validate_dataprep_input,
    validate_new_dataprep_setup,
)


class DataUploadFileSummaryResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the `DataUploadFileSummary` class.'''

    class Meta:
        model = DataUploadFileSummary

    class Schema:
        sourceId = fields.String(attribute="source_id")
        columnMapping = fields.Any(attribute="column_mapping")
        filePath = fields.String(attribute="file_path")
        lastModified = fields.DateTime(attribute="last_modified")

    @Route.POST(
        '/upload_file/<source_id>',
        title='Upload Self Serve File',
        description='Upload Self Serve File',
        response_schema=FILE_SUMMARY_SCHEMA,
    )
    @authorization_required('can_upload_data', 'site')
    def upload_file(self, source_id: str):
        return handle_self_server_upload(source_id, request)

    @Route.POST(
        '/validate_dataprep_input/<source_id>',
        title='Validate Dataprep File',
        response_schema=DATAPREP_UPLOAD_SCHEMA,
    )
    @authorization_required('can_upload_data', 'site')
    def validate_dataprep_input(self, source_id: str):
        return validate_dataprep_input(source_id, request)

    @Route.POST(
        '/upload_and_start_dataprep_job',
        title='Upload file(s) to GCS and start Dataprep job',
        description='Ensures the GCS state of files has been updated and kicks off a dataprep job',
        schema=fields.Object(
            {
                'sourceId': SOURCE_ID_SCHEMA,
                'filesToUpload': fields.Array(
                    fields.Object(
                        {'filePath': fields.String(), 'userFileName': fields.String()}
                    )
                ),
                'filesToDelete': fields.Array(
                    fields.Object(
                        {'filePath': fields.String(), 'userFileName': fields.String()}
                    )
                ),
            }
        ),
    )
    @authorization_required('can_upload_data', 'site')
    def upload_and_start_dataprep_job(self, source):
        upload_and_start_dataprep_job(
            source['sourceId'], source['filesToUpload'], source['filesToDelete']
        )

    @Route.POST(
        '/update_all_dataprep_jobs',
        title='Update incomplete dataprep jobs',
        description='Fetch info from dataprep and update all dataprep jobs records',
    )
    @authorization_required('can_upload_data', 'site')
    def update_all_dataprep_jobs(self):
        return update_all_dataprep_jobs()

    @Route.POST(
        '/update_csv_source',
        title='Update the source in object storage',
        schema=fields.Object({'sourceId': SOURCE_ID_SCHEMA}),
    )
    @authorization_required('can_upload_data', 'site')
    def update_csv_source(self, source):
        source_id = source['sourceId']
        update_csv_source_remote_files(source_id)

    @Route.POST(
        '/delete_source',
        title='Delete the source from active sources and object storage',
        schema=fields.Object({'sourceId': SOURCE_ID_SCHEMA}),
    )
    @authorization_required('selfserve_source_admin', 'site')
    def delete_source(self, source):
        source_id = source['sourceId']
        delete_source_from_object_storage(source_id)

    @Route.GET(
        '/get_preview',
        title='Get a preview of the current CSV file for the source',
        schema=FieldSet({'source_id': SOURCE_ID_SCHEMA}),
        response_schema=fields.Array(fields.Any()),
    )
    @authorization_required('can_upload_data', 'site')
    def get_preview(self, source_id):
        return get_file_preview(source_id)

    @Route.GET(
        '/get_sources_date_ranges',
        title='Get the druid date ranges for all self serve sources',
        response_schema=fields.Any(),
    )
    @authorization_required('can_upload_data', 'site')
    def get_date_ranges(self):
        # returns a Dict of {source_id: {'startDate': start_date, 'endDate': end_date}}
        return get_sources_date_ranges()

    @Route.POST(
        '/setup_new_dataprep',
        title='Set up new Dataprep',
        description='Set up new Dataprep',
        schema=fields.Object(
            {
                'recipeId': fields.Number(),
                'sourceId': SOURCE_ID_SCHEMA,
            }
        ),
        response_schema=DATAPREP_SETUP_SCHEMA,
    )
    @authorization_required('selfserve_source_admin', 'site')
    def setup_new_dataprep(self, config):
        return validate_new_dataprep_setup(config['recipeId'], config['sourceId'])

    @Route.POST(
        '/clean_files',
        title='Clean up files stored in cloud storage',
        schema=fields.Object(
            {
                'sourceId': SOURCE_ID_SCHEMA,
                'isDataprep': fields.Boolean(),
                'filesToCleanUp': fields.Array(fields.String()),
            }
        ),
    )
    @authorization_required('can_upload_data', 'site')
    def clean_files(self, source):
        clean_files_in_object_storage(
            source['sourceId'], source['isDataprep'], source['filesToCleanUp']
        )

    @Route.GET(
        '/download/<string:key>',
        title='Download the input files from cloud storage',
        schema=FieldSet(
            {'source_id': SOURCE_ID_SCHEMA, 'is_dataprep': fields.Boolean()}
        ),
        format_response=False,
    )
    @authorization_required('can_upload_data', 'site')
    def download(self, key, source_id, is_dataprep):
        return download_input_file(key, source_id, is_dataprep)


RESOURCE_TYPES = [DataUploadFileSummaryResource]
