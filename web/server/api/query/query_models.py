# pylint: disable=C0103
from typing import Dict, Any
import related

from flask import current_app, request as flask_request
from flask_potion import fields
from flask_potion.routes import Route

from web.server.api.api_models import PrincipalResource
from web.server.api.query.api_models import QueryManager
from web.server.api.query.calculation_schema import CALCULATION_SCHEMA
from web.server.api.query.grouping_item_schema import GROUPING_ITEM_SCHEMA
from web.server.api.query.query_filter_schema import QUERY_FILTER_SCHEMA
from web.server.query.data_quality.data_quality_report import DataQualityReport
from web.server.query.data_quality.data_quality_table import DataQualityTable
from web.server.query.data_quality.field_reporting_stats_query import (
    FieldReportingStatsQuery,
)
from web.server.query.data_quality.reporting_completeness_line_graph import (
    ReportingCompletenessLineGraph,
)
from web.server.query.visualizations.bar_graph import BarGraphVisualization
from web.server.query.visualizations.hierarchy import HierarchyVisualization
from web.server.query.visualizations.line_graph import LineGraphVisualization
from web.server.query.visualizations.map import Map
from web.server.query.visualizations.request import QueryRequest
from web.server.query.visualizations.table import TableVisualization

FIELD_SCHEMA = fields.Object(
    properties={'id': fields.String(), 'calculation': CALCULATION_SCHEMA}
)
# def get_field_readable_name(field_id):

QUERY_REQUEST = fields.Object(
    properties={
        'fields': fields.Array(FIELD_SCHEMA),
        'filter': QUERY_FILTER_SCHEMA,
        'groups': fields.Array(GROUPING_ITEM_SCHEMA),
    }
)

OUTLIERS_VISUALIZATION_REQUEST = fields.Object(
    properties={'queryRequest': QUERY_REQUEST, 'outlierType': fields.String()}
)


class QueryResource(PrincipalResource):
    class Meta:
        # TODO(david): imporve this type
        model: Dict[Any, Any] = {}
        name = 'query'
        manager = QueryManager

    # pylint: disable=no-member
    @Route.POST('/bar_graph', schema=QUERY_REQUEST, response_schema=fields.Any())
    def bar_graph(self, raw_request):  # pylint: disable=no-self-use
        request = related.to_model(QueryRequest, raw_request)
        return BarGraphVisualization(
            request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    # pylint: disable=no-member
    @Route.POST('/line_graph', schema=QUERY_REQUEST, response_schema=fields.Any())
    def line_graph(self, raw_request):  # pylint: disable=no-self-use
        line_graph_req = related.to_model(QueryRequest, raw_request)
        return LineGraphVisualization(
            line_graph_req,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    # pylint: disable=no-member
    @Route.POST('/hierarchy', schema=QUERY_REQUEST, response_schema=fields.Any())
    def hierarchy(self, raw_request):  # pylint: disable=no-self-use
        hierarchy_req = related.to_model(QueryRequest, raw_request)
        return HierarchyVisualization(
            hierarchy_req,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    # pylint: disable=no-member
    @Route.POST('/map', schema=QUERY_REQUEST, response_schema=fields.Any())
    def map(self, raw_request):  # pylint: disable=no-self-use
        request = related.to_model(QueryRequest, raw_request)

        configuration_module = current_app.zen_config
        geo_field_ordering = configuration_module.aggregation.GEO_FIELD_ORDERING
        geo_to_lat_lng = configuration_module.aggregation.GEO_TO_LATLNG_FIELD
        nation_name = configuration_module.general.NATION_NAME
        dimension_parents = configuration_module.aggregation.DIMENSION_PARENTS

        return Map(
            request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
            dimension_parents,
            geo_to_lat_lng,
            geo_field_ordering,
            nation_name,
        ).get_response()

    # pylint: disable=no-member
    @Route.POST('/table', schema=QUERY_REQUEST, response_schema=fields.Any())
    def table(self, raw_request):  # pylint: disable=no-self-use
        request = related.to_model(QueryRequest, raw_request)
        return TableVisualization(
            request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    # NOTE(stephen, david): Right now, data quality uses the query endpoint and
    # models to run its queries and build results.
    # TODO(stephen, david): Move to a data quality specific resource when
    # customization separates it from the query tool significantly.
    # pylint: disable=no-member
    @Route.POST('/data_quality', schema=QUERY_REQUEST, response_schema=fields.Any())
    def data_quality(self, raw_request):  # pylint: disable=no-self-use
        geo_to_lat_lng = current_app.zen_config.aggregation.GEO_TO_LATLNG_FIELD
        dimension_parents = current_app.zen_config.aggregation.DIMENSION_PARENTS

        # Data quality currently only queries one field at a time.
        raw_field_to_query = raw_request['fields'][0]
        raw_request = {**raw_request, 'fields': [raw_field_to_query]}
        request = related.to_model(QueryRequest, raw_request)

        # API caller can exclude outliers by passing a flag exludeOutliers
        exclude_outliers = flask_request.args.get('excludeOutliers')

        # Data quality currently only queries one field at a time
        field_id = raw_field_to_query['id']

        # NOTE(open_source)
        data_quality_response = DataQualityReport(
            request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
            geo_to_lat_lng,
            dimension_parents,
        ).get_response(False)

        return {'dataQuality': data_quality_response[field_id]}

    # pylint: disable=no-member
    @Route.POST(
        '/data_quality_table', schema=QUERY_REQUEST, response_schema=fields.Any()
    )  # pylint: disable=no-self-use
    def data_quality_table(self, raw_request):
        data_quality_req = related.to_model(QueryRequest, raw_request)
        return DataQualityTable(
            data_quality_req,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    # pylint: disable=no-member
    @Route.POST(
        '/reporting_completeness_line_graph',
        schema=QUERY_REQUEST,
        response_schema=fields.Any(),
    )
    def reporting_completeness_line_graph(
        self, raw_request
    ):  # pylint: disable=no-self-use
        return ReportingCompletenessLineGraph(
            related.to_model(QueryRequest, raw_request),
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    # pylint: disable=no-member
    @Route.POST(
        '/analytical_insights', schema=QUERY_REQUEST, response_schema=fields.Any()
    )  # pylint: disable=no-self-use
    def analytical_insights(self, raw_request):  # pylint: disable=no-self-use
        # NOTE(open source)
        return {}

    # pylint: disable=no-member
    @Route.POST(
        '/data_quality_insights', schema=QUERY_REQUEST, response_schema=fields.Any()
    )  # pylint: disable=no-self-use
    def data_quality_insights(self, raw_request):  # pylint: disable=no-self-use
        # NOTE(open source)
        return {}

    # pylint: disable=no-member
    @Route.POST(
        '/field_reporting_stats', schema=QUERY_REQUEST, response_schema=fields.Any()
    )  # pylint: disable=no-self-use
    def field_reporting_stats(self, raw_request):  # pylint: disable=no-self-use
        return FieldReportingStatsQuery(
            related.to_model(QueryRequest, raw_request),
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()


RESOURCE_TYPES = [QueryResource]
