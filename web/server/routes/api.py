from builtins import object
from datetime import datetime
from io import BytesIO
import os
import subprocess
import zipfile
import requests


from flask import (
    Blueprint,
    current_app,
    jsonify,
    request,
    make_response,
    send_file,
    Response,
)
from flask_login import current_user, logout_user

# pylint: disable=E0611
# werkzeug does contain the secure_filename function.
from werkzeug import secure_filename
from werkzeug.exceptions import InternalServerError
from pylib.file.file_utils import FileUtils
from log import LOG
from db.postgres.utils import make_temp_directory

import web.server.routes.views.aggregate
import web.server.routes.views.authorization
import web.server.routes.views.dimension
from web.server.configuration.settings import AUTOMATIC_SIGN_OUT_KEY, get_configuration
from web.server.data.data_access import Transaction
from web.server.routes.views.field import FieldsApi
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import (
    authorization_required,
    is_authorized_api,
)
from web.server.routes.views.explorer import GeoExplorerApi
from web.server.data.risk_scores import get_risk_score_metadata
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID
from web.server.util.template_renderer import Serializer
from web.server.util.util import Success, is_session_persisted, unauthorized_error
from web.server.util.data_catalog import populate_fields, zip_data_catalog_metadata
from util.connections.connection_manager import ConnectionManager

# Endpoints in this file should have minimal logic; serialization should happen elsewhere.
# TODO(toshi): move serializing to upstream files


def _split_param_str(request_object, param, delim=','):
    param_str = request_object.args.get(param)
    if not param_str:
        return []
    return param_str.split(delim)


class ApiRouter(object):
    def __init__(
        self,
        template_renderer,
        configuration_module,
        fields_api=None,
        geo_explorer_api=None,
    ):
        self.template_renderer = template_renderer
        self.configuration_module = configuration_module

        if not fields_api:
            row_count_lookup = current_app.druid_context.row_count_lookup

            fields_api = FieldsApi(row_count_lookup)

        if not geo_explorer_api:
            geo_explorer_api = GeoExplorerApi(current_app.explorer_cache, None)

        self._show_nation_in_results = (
            self.configuration_module.general.DEPLOYMENT_NAME == 'et'
        )
        self.fields_api = fields_api
        self.geo_explorer_api = geo_explorer_api

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
    def api_locations(self):
        properties = _split_param_str(request, 'properties')
        metrics = _split_param_str(request, 'metrics')
        result = self.geo_explorer_api.get_locations(properties, metrics)
        return jsonify(result)

    @authentication_required(is_api_request=True)
    def api_metric_groups(self):
        metrics = self.geo_explorer_api.metric_group_ids()
        return jsonify(metrics)

    @authentication_required(is_api_request=True)
    def api_property_groups(self):
        properties = self.geo_explorer_api.property_group_ids()
        return jsonify(properties)

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

    @authentication_required(is_api_request=True)
    def api_fields_csv(self):
        csvout = self.fields_api.get_field_to_name_csv()
        output = make_response(csvout)
        output.headers['Content-type'] = 'text/csv'
        return output

    @authentication_required(is_api_request=True)
    def api_get_anomalies(self):
        # NOTE(stephen, ellen): Deferring this import while the api is still in
        # development. When ready, need to update requirements.txt or
        # requirements-web.txt with the required dependencies (like scipy).
        # TODO(stephen): Should this API even be available to production???
        # pylint: disable=import-outside-toplevel
        from web.server.routes.views.anomaly_detection import get_anomalies

        anomalies = get_anomalies(request.get_json(force=True))
        return jsonify({'success': True, 'data': list(anomalies)})

    @authentication_required(is_api_request=True)
    def api_get_spikes(self):
        # NOTE(stephen, ellen): Deferring this import while the api is still in
        # development. When ready, need to update requirements.txt or
        # requirements-web.txt with the required dependencies (like scipy).
        # TODO(stephen): Should this API even be available to production???
        # pylint: disable=import-outside-toplevel
        from web.server.routes.views.anomaly_detection import get_spikes

        spikes = get_spikes(request.get_json(force=True))
        return jsonify({'success': True, 'data': list(spikes)})

    # This endpoint is used to extract metadata associated with a calculated
    # 'risk score', given a particular sex worker ID.
    @authentication_required(is_api_request=True)
    @authorization_required('run_query', 'site', ROOT_SITE_RESOURCE_ID)
    def api_risk_score_table(self, participant_id):
        data = get_risk_score_metadata(participant_id)
        return jsonify({'data': data})

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

    # pylint: disable=no-self-use
    @authentication_required(is_api_request=True)
    def proxy_graphql_hasura(self):
        '''Proxy Graphql requests to Hasura running in docker'''
        # TODO(solo, stephen, yitian): We need to forward the request to Hasura without having
        # to both parse the request AND download the full response before returning it.
        hasura_host = current_app.config.get('HASURA_HOST')
        hasura_relay_endpoint = '%s/v1beta1/relay' % (hasura_host)
        resp = requests.post(hasura_relay_endpoint, json=request.get_json())
        return Response(resp.content, resp.status_code)

    # pylint: disable=no-self-use
    def proxy_hasura_health(self):
        '''Proxy hasura health requests to Hasura running in docker'''
        hasura_host = current_app.config.get('HASURA_HOST')
        hasura_relay_endpoint = '%s/healthz' % (hasura_host)
        resp = requests.get(hasura_relay_endpoint)
        return Response(resp.content, resp.status_code)

    @authentication_required(force_authentication=True)
    @authorization_required('view_admin_page', 'site')
    def import_data_catalog(self):
        '''Import data catalog data into db tables'''
        upload = request.files['file']
        sql_connection_string = current_app.config.get('SQLALCHEMY_DATABASE_URI')
        with make_temp_directory() as temp_dir_name:
            input_file = os.path.join(temp_dir_name, secure_filename(upload.filename))
            upload.save(input_file)
            script_path = FileUtils.GetAbsPathForFile(
                'scripts/data_catalog/import_db_tables.py'
            )
            proc = subprocess.Popen(
                [
                    'python',
                    script_path,
                    '--sql_connection_string',
                    sql_connection_string,
                    '--input_file',
                    input_file,
                ]
            )
            # timeout the process in 2 minutes
            (_, stderr) = proc.communicate(timeout=120)
            if proc.returncode != 0:
                LOG.error(stderr)
                return jsonify({'success': False})
            return jsonify({'success': True})

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
    def export_data_catalog(self):
        '''Export data catalog'''
        with make_temp_directory() as temp_dir_name:
            str_date = datetime.now().strftime('%Y%m%d%H%M%S')
            deployment_name = current_app.zen_config.general.DEPLOYMENT_NAME
            filename = f'{deployment_name}_data_catalog_{str_date}.zip'
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

    @authentication_required(force_authentication=True)
    def download_pk_covid_linelist(self):
        '''HACK(ian): Make PK covid linelist available for download'''
        if self.configuration_module.general.DEPLOYMENT_NAME != 'pk':
            return ''
        # TODO(ian): Support non-s3 downloads
        s3conn = ConnectionManager('s3')
        file_stream = BytesIO()
        s3conn.client.download_fileobj(
            'zenysis-pk', 'downloadable_files/cm_patient_data_raw.csv', file_stream
        )
        filename = 'covid_linelist_%s.csv' % (datetime.utcnow().strftime('%Y-%m-%d'))
        file_stream.seek(0)
        return send_file(
            file_stream,
            as_attachment=True,
            attachment_filename=filename,
            mimetype='text/csv',
        )

    @authentication_required(force_authentication=True)
    def download_pk_lab(self):
        '''HACK(ian): Make PK CM API lab data available for download'''
        if self.configuration_module.general.DEPLOYMENT_NAME != 'pk':
            return ''
        # TODO(ian): Support non-s3 downloads
        s3conn = ConnectionManager('s3')
        file_stream = BytesIO()
        s3conn.client.download_fileobj(
            'zenysis-pk', 'downloadable_files/cm_lab_data.csv', file_stream
        )
        filename = 'lab_data_%s.csv' % (datetime.utcnow().strftime('%Y-%m-%d'))
        file_stream.seek(0)
        return send_file(
            file_stream,
            as_attachment=True,
            attachment_filename=filename,
            mimetype='text/csv',
        )

    @authentication_required(force_authentication=True)
    def download_pk_epi_data(self):
        '''HACK(ian): Make PK epi data available for download'''
        if self.configuration_module.general.DEPLOYMENT_NAME != 'pk':
            return ''
        # TODO(ian): Support non-s3 downloads
        s3conn = ConnectionManager('s3')
        file_stream = BytesIO()
        s3conn.client.download_fileobj(
            'zenysis-pk', 'downloadable_files/epi_data.csv', file_stream
        )
        filename = 'epi_data_%s.csv' % (datetime.utcnow().strftime('%Y-%m-%d'))
        file_stream.seek(0)
        return send_file(
            file_stream,
            as_attachment=True,
            attachment_filename=filename,
            mimetype='text/csv',
        )

    @authentication_required(force_authentication=True)
    def download_mz_who_covid_data(self):
        '''HACK(ian): Make MZ WHO covid outputs available for download'''
        if self.configuration_module.general.DEPLOYMENT_NAME != 'mz_covid':
            return ''
        s3conn = ConnectionManager('s3')
        file_stream = BytesIO()
        s3conn.client.download_fileobj(
            'zenysis-mz', 'downloadable_files/pde_who_api.json', file_stream
        )
        file_stream.seek(0)

        output = make_response(file_stream.getvalue().decode('utf-8'))
        output.headers['Content-type'] = 'application/json'
        return output

    @authentication_required(force_authentication=True)
    def download_mz_who_dhis2_data(self):
        '''HACK(moriah): Make MZ WHO covid outputs available for download for dhis2 input'''
        if self.configuration_module.general.DEPLOYMENT_NAME != 'mz_covid':
            return ''
        s3conn = ConnectionManager('s3')
        file_stream = BytesIO()
        s3conn.client.download_fileobj(
            'zenysis-mz', 'downloadable_files/survey123_dhis2.csv', file_stream
        )
        filename = 'survey123_dhis2_%s.csv' % (datetime.utcnow().strftime('%Y-%m-%d'))
        file_stream.seek(0)
        return send_file(
            file_stream,
            as_attachment=True,
            attachment_filename=filename,
            mimetype='text/csv',
        )

    @authentication_required(force_authentication=True)
    def download_mz_who_dhis2_data_ll(self):
        '''HACK(moriah): Make MZ WHO covid outputs available for download for dhis2 input'''
        if self.configuration_module.general.DEPLOYMENT_NAME != 'mz_covid':
            return ''
        s3conn = ConnectionManager('s3')
        file_stream = BytesIO()
        s3conn.client.download_fileobj(
            'zenysis-mz',
            'downloadable_files/survey123_dhis2_line_list.csv',
            file_stream,
        )
        filename = 'survey123_dhis2_line_list_%s.csv' % (
            datetime.utcnow().strftime('%Y-%m-%d')
        )
        file_stream.seek(0)
        return send_file(
            file_stream,
            as_attachment=True,
            attachment_filename=filename,
            mimetype='text/csv',
        )

    def generate_blueprint(self):
        api = Blueprint('api', __name__, template_folder='templates')

        # Geo Explorer APIs
        api.add_url_rule(
            '/api/geo-explorer/locations',
            'api_geo_explorer_locations',
            self.api_locations,
            methods=['GET'],
        )
        api.add_url_rule(
            '/api/geo-explorer/metric_groups',
            'api_geo_explorer_metrics',
            self.api_metric_groups,
            methods=['GET'],
        )
        api.add_url_rule(
            '/api/geo-explorer/property_groups',
            'api_geo_explorer_properties',
            self.api_property_groups,
            methods=['GET'],
        )

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
            '/api/fields.csv', 'api_field_csv', self.api_fields_csv, methods=['GET']
        )

        api.add_url_rule(
            '/api/risk_score_table/<participant_id>',
            'api_risk_score_table',
            self.api_risk_score_table,
            methods=['GET'],
        )

        # Data Science APIs
        api.add_url_rule(
            '/api/anomalies', 'api_anomalies', self.api_get_anomalies, methods=['POST']
        )
        api.add_url_rule(
            '/api/spikes', 'api_spikes', self.api_get_spikes, methods=['POST']
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

        # export data-catalog tables
        api.add_url_rule(
            '/api/export_data_catalog',
            'export_data_catalog',
            self.export_data_catalog,
            methods=['GET'],
        )

        # export data-catalog metadata tables
        api.add_url_rule(
            '/api/export_data_catalog/metadata',
            'export_data_catalog_metadata',
            self.export_data_catalog_metadata,
            methods=['GET'],
        )

        # import data-catalog data into tables
        api.add_url_rule(
            '/api/import_data_catalog',
            'import_data_catalog',
            self.import_data_catalog,
            methods=['POST'],
        )

        # import data-catalog fields csv data into tables
        api.add_url_rule(
            '/api/import_data_catalog_fields_csv',
            'import_data_catalog_fields_csv',
            self.import_data_catalog_fields_csv,
            methods=['POST'],
        )

        # PK COVID hacks
        api.add_url_rule(
            '/api/download_pk_covid_linelist',
            'download_pk_covid_linelist',
            self.download_pk_covid_linelist,
            methods=['GET'],
        )
        api.add_url_rule(
            '/api/download_pk_lab',
            'download_pk_lab',
            self.download_pk_lab,
            methods=['GET'],
        )
        api.add_url_rule(
            '/api/download_pk_epi_data',
            'download_pk_epi_data',
            self.download_pk_epi_data,
            methods=['GET'],
        )

        # MZ COVID hacks
        api.add_url_rule(
            '/api/mz_who_covid',
            'download_mz_who_covid_data',
            self.download_mz_who_covid_data,
            methods=['GET'],
        )

        api.add_url_rule(
            '/api/mz_who_covid_dhis2',
            'download_mz_who_dhis2_data',
            self.download_mz_who_dhis2_data,
            methods=['GET'],
        )
        api.add_url_rule(
            '/api/mz_who_covid_dhis2_line_list',
            'download_mz_who_dhis2_data_ll',
            self.download_mz_who_dhis2_data_ll,
            methods=['GET'],
        )

        return api
