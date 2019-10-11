from builtins import object
from flask import Blueprint, current_app, jsonify, request, make_response
from flask_login import current_user, logout_user
from werkzeug.exceptions import InternalServerError

import web.server.routes.views.aggregate
import web.server.routes.views.authorization
import web.server.routes.views.dimension

from web.server.routes.views.field import FieldsApi
from web.server.query.visualizations.bar_graph import BarGraph
from web.server.query.visualizations.box_plot import BoxPlot
from web.server.query.visualizations.line_graph import LineGraph
from web.server.query.visualizations.map import Map
from web.server.query.visualizations.table import Table
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import (
    authorization_required,
    is_authorized_api,
)
from web.server.routes.views.explorer import GeoExplorerApi
from web.server.security.permissions import ROOT_SITE_RESOURCE_ID
from web.server.util.template_renderer import Serializer
from web.server.util.util import is_session_persisted

from web.server.util.util import Success

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

            # pylint: disable=C0103
            calculated_indicator_formulas = (
                configuration_module.calculated_indicators.CALCULATED_INDICATOR_FORMULAS
            )
            indicator_id_lookup = configuration_module.indicators.ID_LOOKUP
            indicator_group_definitions = (
                configuration_module.indicators.GROUP_DEFINITIONS
            )

            fields_api = FieldsApi(
                calculated_indicator_formulas,
                indicator_id_lookup,
                indicator_group_definitions,
                row_count_lookup,
            )

        if not geo_explorer_api:
            geo_explorer_api = GeoExplorerApi(current_app.explorer_cache, None)

        self._show_nation_in_results = (
            self.configuration_module.general.DEPLOYMENT_NAME == 'et'
        )
        self.backend_sort_map = configuration_module.aggregation.BACKEND_SORTS
        self.fields_api = fields_api
        self.geo_explorer_api = geo_explorer_api

    @authentication_required(is_api_request=True)
    def api_is_authorized(self):
        return jsonify(is_authorized_api())

    @authentication_required(is_api_request=True)
    @authorization_required('run_query', 'site', ROOT_SITE_RESOURCE_ID)
    def api_aggregate_generic(self):
        return web.server.routes.views.aggregate.aggregate()

    def api_health_check(self):
        return web.server.routes.views.aggregate.health_check()

    @authentication_required(is_api_request=True)
    @authorization_required('run_query', 'site', ROOT_SITE_RESOURCE_ID)
    def api_aggregate_bar_graph(self):
        graph_data = BarGraph(
            request.get_json(force=True),
            current_app.query_client,
            self.backend_sort_map,
            self._show_nation_in_results,
        )
        return jsonify(Success(graph_data.get_response()))

    @authentication_required(is_api_request=True)
    @authorization_required('run_query', 'site', ROOT_SITE_RESOURCE_ID)
    def api_aggregate_box_plot(self):
        graph_data = BoxPlot(request.get_json(force=True), current_app.query_client)
        return jsonify(Success(graph_data.get_response()))

    @authentication_required(is_api_request=True)
    @authorization_required('run_query', 'site', ROOT_SITE_RESOURCE_ID)
    def api_aggregate_line_graph(self):
        line_graph_req = LineGraph(
            request.get_json(force=True), current_app.query_client
        )
        return jsonify(Success(line_graph_req.get_response()))

    @authentication_required(is_api_request=True)
    @authorization_required('run_query', 'site', ROOT_SITE_RESOURCE_ID)
    def api_map(self):
        geo_field_ordering = self.configuration_module.aggregation.GEO_FIELD_ORDERING
        geo_to_lat_lng = self.configuration_module.aggregation.GEO_TO_LATLNG_FIELD
        nation_name = self.configuration_module.general.NATION_NAME

        graph_data = Map(
            request.get_json(force=True),
            current_app.query_client,
            geo_to_lat_lng,
            geo_field_ordering,
            nation_name,
        )
        return jsonify(Success(graph_data.get_response()))

    @authentication_required(is_api_request=True)
    @authorization_required('run_query', 'site', ROOT_SITE_RESOURCE_ID)
    def api_aggregate_table(self):
        graph_data = Table(request.get_json(force=True), current_app.query_client)
        return jsonify(Success(graph_data.get_response()))

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
        from web.server.routes.views.anomaly_detection import get_anomalies

        anomalies = get_anomalies(request.get_json(force=True))
        return jsonify({'success': True, 'data': list(anomalies)})

    @authentication_required(is_api_request=True)
    def api_get_spikes(self):
        # NOTE(stephen, ellen): Deferring this import while the api is still in
        # development. When ready, need to update requirements.txt or
        # requirements-web.txt with the required dependencies (like scipy).
        # TODO(stephen): Should this API even be available to production???
        from web.server.routes.views.anomaly_detection import get_spikes

        spikes = get_spikes(request.get_json(force=True))
        return jsonify({'success': True, 'data': list(spikes)})

    @authentication_required(is_api_request=True)
    def api_get_backend_config(self):
        output = make_response(
            'Object.assign(window.__JSON_FROM_BACKEND, %s);'
            % (
                Serializer.serialize(
                    self.template_renderer.build_heavy_backend_js_config()
                )
            )
        )
        output.headers['Content-Type'] = 'application/javascript'
        return output

    def timeout_user_session(self):
        is_remembered = is_session_persisted()
        if current_user.is_authenticated and not is_remembered:
            logout_user()
            return jsonify({'data': {'timeout': True}})
        return jsonify({'data': {'timeout': False}})

    def generate_blueprint(self):
        api = Blueprint('api', __name__, template_folder='templates')

        # Query APIs
        api.add_url_rule(
            '/api/aggregate',
            'api_query_aggregate',
            self.api_aggregate_generic,
            methods=['GET', 'POST'],
        )
        api.add_url_rule(
            '/api/query/bar_graph',
            'api_query_bar_graph',
            self.api_aggregate_bar_graph,
            methods=['POST'],
        )
        api.add_url_rule(
            '/api/query/box_plot',
            'api_query_box_plot',
            self.api_aggregate_box_plot,
            methods=['POST'],
        )
        api.add_url_rule(
            '/api/query/map', 'api_query_map', self.api_map, methods=['POST']
        )
        api.add_url_rule(
            '/api/query/table',
            'api_query_table',
            self.api_aggregate_table,
            methods=['POST'],
        )
        api.add_url_rule(
            '/api/query/line_graph',
            'api_query_linegraph',
            self.api_aggregate_line_graph,
            methods=['POST'],
        )

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
            '/api/backend_config',
            'api_backend_config',
            self.api_get_backend_config,
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

        return api
