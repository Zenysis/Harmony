# pylint: disable=C0103
from functools import wraps
from http.client import BAD_REQUEST, NOT_FOUND
from queue import Queue
from threading import Thread
from typing import Any, Dict, Optional

from flask import current_app, request as flask_request, Response
from flask_potion import fields
from flask_potion.routes import Route
import rapidjson
import related
from werkzeug.exceptions import abort

from data.query.models.query_selections import QuerySelectionsDefinition
from models.alchemy.user_query_session.model import UserQuerySession
from web.server.api.api_models import PrincipalResource
from web.server.api.query.api_models import QueryManager
from web.server.api.query.calculation_schema import CALCULATION_SCHEMA
from web.server.api.query.grouping_item_schema import GROUPING_ITEM_SCHEMA
from web.server.api.query.query_filter_schema import QUERY_FILTER_SCHEMA
from web.server.data.data_access import Transaction
from web.server.query.data_quality.data_quality_table import DataQualityTable
from web.server.query.data_quality.field_reporting_stats_query import (
    FieldReportingStatsQuery,
)
from web.server.query.data_quality.data_quality_report import DataQualityReport
from web.server.query.data_quality.outliers_box_plot import OutliersBoxPlot
from web.server.query.data_quality.outliers_line_graph import OutliersLineGraph
from web.server.query.data_quality.outliers_table import OutliersTable
from web.server.query.data_quality.reporting_completeness_line_graph import (
    ReportingCompletenessLineGraph,
)
from web.server.query.request import QueryRequest
from web.server.query.visualizations.bar_graph import BarGraphVisualization
from web.server.query.visualizations.hierarchy import HierarchyVisualization
from web.server.query.visualizations.line_graph import LineGraphVisualization
from web.server.query.visualizations.map import Map
from web.server.query.visualizations.table import TableVisualization

FIELD_SCHEMA = fields.Object(
    properties={'id': fields.String(), 'calculation': CALCULATION_SCHEMA}
)

QUERY_REQUEST = fields.Object(
    properties={
        'fields': fields.Array(FIELD_SCHEMA),
        'filter': QUERY_FILTER_SCHEMA,
        'groups': fields.Array(GROUPING_ITEM_SCHEMA),
        'type': fields.String(),
    }
)

OUTLIERS_VISUALIZATION_REQUEST = fields.Object(
    properties={'queryRequest': QUERY_REQUEST, 'outlierType': fields.String()}
)


def deserialize_query_request(
    joins_allowed: Optional[bool] = False, request_key: Optional[str] = None
):
    '''A decorator to convert the raw request dictionary to the request object. This
    will also ensure that only allowed request types continue and will otherwise raise
    a bad request.'''

    def convert_model_decorator(endpoint):
        @wraps(endpoint)
        def inner_convert_model(self, raw_request):
            if request_key is not None:
                request = raw_request[request_key]
            else:
                request = raw_request

            if joins_allowed:
                query_request = QueryRequest.polymorphic_to_model(request)
            elif request['type'] == 'JOIN':
                abort(BAD_REQUEST, 'Join queries at this endpoint are unsupported')
            else:
                query_request = related.to_model(QueryRequest, request)

            if request_key is not None:
                return endpoint(self, raw_request, query_request)
            return endpoint(self, query_request)

        return inner_convert_model

    return convert_model_decorator


class QueryResource(PrincipalResource):
    class Meta:
        # TODO: imporve this type
        model: Dict[Any, Any] = {}
        name = 'query'
        manager = QueryManager

    @Route.POST('/bar_graph', schema=QUERY_REQUEST, response_schema=fields.Any())
    @deserialize_query_request(joins_allowed=True)
    def bar_graph(self, query_request):
        return BarGraphVisualization(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    @Route.POST('/line_graph', schema=QUERY_REQUEST, response_schema=fields.Any())
    @deserialize_query_request(joins_allowed=True)
    def line_graph(self, query_request):
        return LineGraphVisualization(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    @Route.POST('/hierarchy', schema=QUERY_REQUEST, response_schema=fields.Any())
    @deserialize_query_request()
    def hierarchy(self, query_request):
        return HierarchyVisualization(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    @Route.POST('/map', schema=QUERY_REQUEST, response_schema=fields.Any())
    @deserialize_query_request(joins_allowed=True)
    def map(self, query_request):
        configuration_module = current_app.zen_config
        geo_field_ordering = configuration_module.aggregation.GEO_FIELD_ORDERING
        geo_to_lat_lng = configuration_module.aggregation.GEO_TO_LATLNG_FIELD
        dimension_parents = configuration_module.aggregation.DIMENSION_PARENTS

        return Map(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
            dimension_parents,
            geo_to_lat_lng,
            geo_field_ordering,
        ).get_response()

    def _table(self, request, disaggregated):
        raw_response = TableVisualization(
            request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

        if disaggregated:
            return {
                'fields': raw_response['fields'],
                'data': [
                    point
                    for point in raw_response['data']
                    if any(point[field] is not None for field in raw_response['fields'])
                ],
            }

        # We want to stream the response to put data on wire faster and also to reduce memory
        # footprint of having full serialized response in the memory. To achieve that we use
        # `rapidjson`'s ability to stream the serialized data, but it's blocking, so to resolve
        # it we run serialization in a thread and use this `Queue` to communicate between the
        # serializer thread and producer thread (which is running the generator `serialize_thread`
        queue = Queue()

        class QueuedStream:
            def __init__(self, queue):
                self.queue = queue
                self.buffer = b''

            def write(self, value):
                self.queue.put(value)

            def close(self):
                if self.buffer:
                    self.queue.put(self.buffer)
                self.queue.put(None)

        dump_stream = QueuedStream(queue)

        def serialize_thread(result, dump_stream):
            # pylint: disable=c-extension-no-member
            rapidjson.dump(result, dump_stream)
            dump_stream.close()

        Thread(target=serialize_thread, args=(raw_response, dump_stream)).run()

        def response_stream(queue):
            while chunk := queue.get():
                yield chunk

        return Response(response_stream(queue))

    @Route.POST(
        '/table',
        schema=QUERY_REQUEST,
        response_schema=fields.Any(),
        format_response=False,
    )
    @deserialize_query_request(joins_allowed=True)
    def table(self, request, **kwargs):
        return self._table(request, disaggregated=False, **kwargs)

    @Route.POST(
        '/table/disaggregated',
        schema=QUERY_REQUEST,
        response_schema=fields.Any(),
        format_response=False,
    )
    @deserialize_query_request(joins_allowed=True)
    def disaggregated_table(self, request, **kwargs):
        return self._table(request, disaggregated=True, **kwargs)

    # NOTE: when using query hash instead of supplying druid query it's enough
    # to use HTTP GET because there's no big payload to supply any more and this
    # is semantically GET
    @Route.GET('/table')
    def table_get(self, **kwargs):
        return self._table_get(False, **kwargs)

    @Route.GET('/table/disaggregated')
    def disaggregated_table_get(self, **kwargs):
        return self._table_get(True, **kwargs)

    def _table_get(self, disaggregated, **kwargs):
        query_hash = flask_request.args.get('h')
        if not query_hash:
            return "Invalid query hash", BAD_REQUEST

        with Transaction() as transaction:
            query_session = transaction.find_by_id(
                UserQuerySession, query_hash, id_column='query_uuid'
            )
            if not query_session:
                return None, NOT_FOUND

        blob = query_session.query_blob
        if blob['visualizationType'] != 'TABLE':
            return "Can only use a query that is a table!", BAD_REQUEST
        query_selections = related.to_model(
            QuerySelectionsDefinition, blob['querySelections']
        )
        return self._table(
            query_selections.serialize_for_disaggregated_query()
            if disaggregated
            else query_selections.serialize_for_query(),
            disaggregated=disaggregated,
            **kwargs,
        )

    # NOTE: Right now, data quality uses the query endpoint and
    # models to run its queries and build results.
    # TODO: Move to a data quality specific resource when
    # customization separates it from the query tool significantly.
    @Route.POST('/data_quality', schema=QUERY_REQUEST, response_schema=fields.Any())
    @deserialize_query_request()
    def data_quality(self, initial_request):
        # Data quality currently only queries one field at a time.
        raw_field_to_query = initial_request.fields[0]
        query_request = initial_request.copy(fields=[raw_field_to_query])

        geo_to_lat_lng = current_app.zen_config.aggregation.GEO_TO_LATLNG_FIELD
        dimension_parents = current_app.zen_config.aggregation.DIMENSION_PARENTS

        # API caller can exclude outliers by passing a flag exludeOutliers
        exclude_outliers = flask_request.args.get('excludeOutliers')
        include_outliers = exclude_outliers is None and not True

        # Data quality currently only queries one field at a time
        field_id = raw_field_to_query.id

        data_quality_response = DataQualityReport(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
            geo_to_lat_lng,
            dimension_parents,
        ).get_response(include_outliers)

        return {'dataQuality': data_quality_response[field_id]}

    @Route.POST(
        '/data_quality_table', schema=QUERY_REQUEST, response_schema=fields.Any()
    )
    @deserialize_query_request()
    def data_quality_table(self, query_request):
        return DataQualityTable(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    @Route.POST(
        '/reporting_completeness_line_graph',
        schema=QUERY_REQUEST,
        response_schema=fields.Any(),
    )
    @deserialize_query_request()
    def reporting_completeness_line_graph(self, query_request):
        return ReportingCompletenessLineGraph(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()

    @Route.POST(
        '/outliers_box_plot',
        schema=OUTLIERS_VISUALIZATION_REQUEST,
        response_schema=fields.Any(),
    )
    @deserialize_query_request(request_key='queryRequest')
    def outliers_box_plot(self, raw_request, query_request):
        return OutliersBoxPlot(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
            raw_request['outlierType'],
        ).get_response()

    @Route.POST(
        '/outliers_line_graph',
        schema=OUTLIERS_VISUALIZATION_REQUEST,
        response_schema=fields.Any(),
    )
    @deserialize_query_request(request_key='queryRequest')
    def outliers_line_graph(self, raw_request, query_request):
        return OutliersLineGraph(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
            raw_request['outlierType'],
        ).get_response()

    @Route.POST(
        '/outliers_table',
        schema=OUTLIERS_VISUALIZATION_REQUEST,
        response_schema=fields.Any(),
    )
    @deserialize_query_request(request_key='queryRequest')
    def outliers_table(self, raw_request, query_request):
        return OutliersTable(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
            raw_request['outlierType'],
        ).get_response()

    @Route.POST(
        '/field_reporting_stats', schema=QUERY_REQUEST, response_schema=fields.Any()
    )
    @deserialize_query_request()
    def field_reporting_stats(self, query_request):
        return FieldReportingStatsQuery(
            query_request,
            current_app.query_client,
            current_app.druid_context.current_datasource,
        ).get_response()


RESOURCE_TYPES = [QueryResource]
