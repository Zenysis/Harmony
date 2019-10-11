from flask import jsonify, current_app

from web.server.routes.views.geo_time_aggregator import GeoTimeAggregator
from web.server.routes.views.health_check import HealthCheck
from web.server.util.util import timed


@timed
def aggregate():
    query_client = current_app.query_client
    geo_field_ordering = current_app.zen_config.aggregation.GEO_FIELD_ORDERING

    aggregator = GeoTimeAggregator(query_client, geo_field_ordering)
    aggregator.run()
    return jsonify(aggregator.get_response())


def health_check():
    return HealthCheck().run()
