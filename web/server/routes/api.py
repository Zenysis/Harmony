import os
import subprocess
from datetime import datetime
from io import BytesIO, StringIO
import zipfile

import requests
from flask import (
    Blueprint,
    Response,
    current_app,
    jsonify,
    make_response,
    request,
    send_file,
)
from flask_login import current_user, logout_user
from flask_jwt_extended import get_jwt_claims
from pylib.file.file_utils import FileUtils

# pylint: disable=E0611
# werkzeug does contain the secure_filename function.
from werkzeug import secure_filename
from werkzeug.exceptions import InternalServerError

import web.server.routes.views.aggregate
import web.server.routes.views.authorization
import web.server.routes.views.dimension
from log import LOG
from db.postgres.utils import make_temp_directory
from models.alchemy.query import Field
from util.connections.connection_manager import ConnectionManager
from util.file.unicode_csv import UnicodeDictWriter
from web.server.configuration.settings import (
    AUTOMATIC_SIGN_OUT_KEY,
    PUBLIC_ACCESS_KEY,
    get_configuration,
)
from web.server.data.data_access import Transaction
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import (
    authorization_required,
    is_authorized_api,
)
from web.server.routes.views.field import FieldsApi
from web.server.routes.views.validate_data_catalog import (
    update_data_catalog_import_date,
    validate_import_file,
    contains_valid_zipped_files,
    is_file_key_valid,
    DATA_CATALOG_TABLES,
)
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID
from web.server.util.data_catalog import populate_fields, zip_data_catalog_metadata
from web.server.util.util import Success, is_session_persisted, unauthorized_error

# Endpoints in this file should have minimal logic; serialization should happen elsewhere.
# TODO: move serializing to upstream files


MAX_DATA_CATALOG_UPLOAD_SIZE_BYTES = 5 * 1024**2  # disallow files larger than 5 MB


class ApiRouter:
    def __init__(
        self,
        template_renderer,
        configuration_module,
        fields_api=None,
    ):
        self.template_renderer = template_renderer
        self.configuration_module = configuration_module

        if not fields_api:
            row_count_lookup = current_app.druid_context.row_count_lookup

            fields_api = FieldsApi(row_count_lookup)

        self.fields_api = fields_api

    @authentication_required(is_api_request=True)
    def api_is_authorized(self):
        request_data = request.get_json(force=True)
        permission = request_data['permission']
        authorized = is_authorized_api(
            permission, request_data['resourceType'], request_data.get('resourceName')
        )

        result = Success() if authorized else unauthorized_error(permission)
        return jsonify(result)

    @authentication_required(is_api_request=True)
    def api_is_authorized_multi(self):
        result = []
        for auth_request in request.get_json(force=True):
            permission = auth_request['permission']
            resource_type = auth_request['resourceType']
            resource_name = auth_request.get('resourceName')
            authorized = is_authorized_api(permission, resource_type, resource_name)
            result.append(
                {
                    'authorized': authorized,
                    'permission': permission,
                    'resourceType': resource_type,
                    'resourceName': resource_name,
                }
            )
        return jsonify(result)

    def api_health_check(self):
        return web.server.routes.views.aggregate.health_check()

    @authentication_required(is_api_request=True)
    def api_dimension_info(self, dimension_name, dimension_value):
        response = current_app.druid_context.data_time_boundary.get_dimension_summary(
            dimension_name, dimension_value
        )
        if response:
            return jsonify(Success(response))
        raise InternalServerError('Dimension lookup failed.')

    @authentication_required(is_api_request=True)
    def api_field_info(self, field_ids):
        field_ids_sep = set(field_ids.split(','))
        ret = {}
        for field_id in field_ids_sep:
            summary = self.fields_api.get_field_summary(field_id)
            ret[field_id] = summary.to_json()
        return jsonify(Success(ret))

    def timeout_user_session(self):
        automatic_signout_enabled = get_configuration(AUTOMATIC_SIGN_OUT_KEY)
        is_remembered = is_session_persisted()
        if (
            current_user.is_authenticated
            and not is_remembered
            and automatic_signout_enabled
        ):
            logout_user()
            return jsonify({'data': {'timeout': True}})
        return jsonify({'data': {'timeout': False}})

    @authentication_required(is_api_request=True)
    def proxy_graphql_hasura(self):
        '''Proxy Graphql requests to Hasura running in docker'''
        if getattr(current_user, 'from_jwt', False):
            # NOTE: it's impossible for us to enforce auth scopes for hasura
            # queries, so we deny any of them if full access to account is not granted
            # by the token
            needs = get_jwt_claims().get('needs', {})
            if '*' not in needs:
                return Response(
                    'You are not authorized to access graphql endpoint', 401
                )

        # TODO: We need to forward the request to Hasura without having
        # to both parse the request AND download the full response before returning it.
        hasura_host = current_app.config.get('HASURA_HOST')
        hasura_relay_endpoint = f'{hasura_host}/v1beta1/relay'
        data = request.get_json()
        public_access_enabled = get_configuration(PUBLIC_ACCESS_KEY)

        if public_access_enabled and not current_user.is_authenticated:
            # NOTE: Mutations are not accepted for non-authenticated user when we
            # have public access enabled and also only accept patchDimensionServiceQuery
            # in query with public access enabled
            query = data.get('query').strip()
            if query.startswith('mutation'):
                return Response('You are not authorized to perform mutations', 401)

            if not query.startswith('query patchDimensionServiceQuery'):
                return Response('You are not authorized to perform this query', 401)

        resp = requests.post(hasura_relay_endpoint, json=data, timeout=120)
        return Response(resp.content, resp.status_code)

    def proxy_hasura_health(self):
        '''Proxy hasura health requests to Hasura running in docker'''
        hasura_host = current_app.config.get('HASURA_HOST')
        hasura_relay_endpoint = f'{hasura_host}/healthz'
        resp = requests.get(hasura_relay_endpoint, timeout=120)
        return Response(resp.content, resp.status_code)

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def import_self_serve(self):
        '''Import self serve setup into db tables'''
        upload = request.files['file']
        sql_connection_string = current_app.config.get('SQLALCHEMY_DATABASE_URI')
        with make_temp_directory() as temp_dir_name:
            input_file = os.path.join(temp_dir_name, secure_filename(upload.filename))
            upload.save(input_file)
            script_path = FileUtils.GetAbsPathForFile(
                'scripts/data_catalog/import_db_tables.py'
            )
            with subprocess.Popen(
                [
                    'python',
                    script_path,
                    '--sql_connection_string',
                    sql_connection_string,
                    '--input_file',
                    input_file,
                ]
            ) as proc:
                # timeout the process in 2 minutes
                (_, stderr) = proc.communicate(timeout=120)
                if proc.returncode != 0:
                    LOG.error(stderr)
                    return jsonify({'success': False})

            # if self serve import is successful, update the data catalog import date
            # to the current date for future data catalog import validations
            update_data_catalog_import_date()

            return jsonify({'success': True})

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def validate_self_serve_upload(self):
        '''Validate a self serve file before proceeding with data import'''
        upload = request.files['file']
        with make_temp_directory() as temp_dir_name:
            input_file = os.path.join(temp_dir_name, secure_filename(upload.filename))
            upload.save(input_file)
            file_size = os.stat(input_file).st_size
            if file_size > MAX_DATA_CATALOG_UPLOAD_SIZE_BYTES:
                return (
                    jsonify(
                        {
                            "msg": f"The uploaded file: {upload.filename} is too large. We support files that are 5 MB or smaller."
                        }
                    ),
                    413,
                )

            if not contains_valid_zipped_files(
                tables=DATA_CATALOG_TABLES, input_file=input_file
            ):
                return (
                    jsonify(
                        {
                            "msg": f"The uploaded file: {upload.filename} does not contain any of the expected data catalog .csv files."
                        }
                    ),
                    400,
                )

            validation_resp, status_code = validate_import_file(
                input_file=input_file, file_name=upload.filename
            )

            return jsonify(validation_resp), status_code

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def download_data_catalog_changes(self):
        changes_summary_file_key = request.args.get('changes_summary_file_key', None)
        if not changes_summary_file_key:
            return jsonify({"msg": "File key not provided"}), 400

        if not is_file_key_valid(changes_summary_file_key):
            return jsonify({"msg": "File key is invalid"}), 400

        deployment_name = self.configuration_module.general.DEPLOYMENT_NAME
        bucket_name = f"zenysis-{deployment_name.replace('_', '-')}"
        s3conn = ConnectionManager('s3')
        file_stream = BytesIO()
        s3conn.client.download_fileobj(
            bucket_name, changes_summary_file_key, file_stream
        )
        filename = changes_summary_file_key.rsplit('/', 1)[-1]
        file_stream.seek(0)
        return send_file(
            file_stream,
            as_attachment=True,
            attachment_filename=filename,
            mimetype='text/html',
        )

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def import_data_catalog_fields_csv(self):
        '''Import fields from a csv into data catalog db tables'''
        upload = request.files['file']
        with make_temp_directory() as temp_dir_name, Transaction() as transaction:
            input_file = os.path.join(temp_dir_name, secure_filename(upload.filename))
            upload.save(input_file)
            output_msg, error_msgs = populate_fields(input_file, transaction)
            return jsonify({'outputStats': output_msg, 'errorLogs': error_msgs})

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def export_self_serve(self):
        '''Export self serve'''
        with make_temp_directory() as temp_dir_name:
            str_date = datetime.now().strftime('%Y%m%d%H%M%S')
            deployment_name = current_app.zen_config.general.DEPLOYMENT_NAME
            filename = f'{deployment_name}_self_serve_{str_date}.zip'
            output_file = os.path.join(temp_dir_name, filename)

            sql_connection_string = current_app.config.get('SQLALCHEMY_DATABASE_URI')
            script_path = FileUtils.GetAbsPathForFile(
                'scripts/data_catalog/export_db_tables.py'
            )
            subprocess.call(
                [
                    'python',
                    script_path,
                    '--sql_connection_string',
                    sql_connection_string,
                    '--output_file',
                    output_file,
                ]
            )
            return send_file(
                output_file,
                as_attachment=True,
                attachment_filename=filename,
                mimetype='application/zip',
            )

    @authentication_required(is_api_request=True)
    def export_self_serve_field_names(self):
        '''Export field table from self serve'''
        with Transaction() as transaction:
            fields = transaction.find_all(Field)
            exported_fields = [
                {
                    'id': field.id,
                    'name': field.name,
                }
                for field in fields
            ]
            ret = StringIO()
            writer = UnicodeDictWriter(ret, fieldnames=['id', 'name'])
            writer.writeheader()
            writer.writerows(exported_fields)

            output = make_response(ret.getvalue())
            output.headers['Content-type'] = 'text/csv'
            return output

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def export_data_catalog_metadata(self):
        '''Export data catalog metadata'''
        with make_temp_directory() as temp_dir_name, Transaction() as transaction:
            str_date = datetime.now().strftime('%Y%m%d%H%M%S')
            filename = f'data_catalog_metadata_{str_date}.zip'
            output_file = os.path.join(temp_dir_name, filename)

            with zipfile.ZipFile(
                output_file, 'w', zipfile.ZIP_DEFLATED, compresslevel=3
            ) as zip_file:
                zip_data_catalog_metadata(transaction, temp_dir_name, zip_file)

            return send_file(
                output_file,
                as_attachment=True,
                attachment_filename=filename,
                mimetype='application/zip',
            )

    def generate_blueprint(self):
        api = Blueprint('api', __name__, template_folder='templates')

        # Miscellaneous APIs
        api.add_url_rule('/api/health', 'api_health', self.api_health_check)
        api.add_url_rule(
            '/api/authorization',
            'api_authorization',
            self.api_is_authorized,
            methods=['POST'],
        )
        api.add_url_rule(
            '/api/authorization_multi',
            'api_authorization_multi',
            self.api_is_authorized_multi,
            methods=['POST'],
        )
        api.add_url_rule(
            '/api/dimension/<dimension_name>/<dimension_value>',
            'dimension_info',
            self.api_dimension_info,
            methods=['GET'],
        )

        api.add_url_rule(
            '/api/field/<field_ids>',
            'api_field_ids',
            self.api_field_info,
            methods=['GET'],
        )

        api.add_url_rule(
            '/api/field_names',
            'export_self_serve_field_names',
            self.export_self_serve_field_names,
            methods=['GET'],
        )

        # Timeout session
        api.add_url_rule(
            '/api/timeout',
            'timeout_session',
            self.timeout_user_session,
            methods=['POST'],
        )

        # GraphQL
        api.add_url_rule(
            '/api/graphql',
            'proxy_graphql_hasura',
            self.proxy_graphql_hasura,
            methods=['POST', 'GET'],
        )

        # Hasura health
        api.add_url_rule(
            '/api/hasura/health',
            'proxy_hasura_health',
            self.proxy_hasura_health,
            methods=['POST', 'GET'],
        )

        # export self serve tables
        api.add_url_rule(
            '/api/export_self_serve',
            'export_self_serve',
            self.export_self_serve,
            methods=['GET'],
        )

        # export data-catalog metadata tables
        api.add_url_rule(
            '/api/export_data_catalog_metadata',
            'export_data_catalog_metadata',
            self.export_data_catalog_metadata,
            methods=['GET'],
        )

        # import self serve setup into tables
        api.add_url_rule(
            '/api/import_self_serve',
            'import_self_serve',
            self.import_self_serve,
            methods=['POST'],
        )
        api.add_url_rule(
            '/api/validate_self_serve_upload',
            'validate_self_serve_upload',
            self.validate_self_serve_upload,
            methods=['POST'],
        )
        api.add_url_rule(
            '/api/download_data_catalog_changes',
            'download_data_catalog_changes',
            self.download_data_catalog_changes,
            methods=['GET'],
        )

        # import data-catalog fields csv data into tables
        api.add_url_rule(
            '/api/import_data_catalog_fields_csv',
            'import_data_catalog_fields_csv',
            self.import_data_catalog_fields_csv,
            methods=['POST'],
        )

        return api
