from http.client import NOT_FOUND

from flask import Blueprint, redirect, abort, current_app
from werkzeug.exceptions import Unauthorized

from web.server.errors import ItemNotFound
from web.server.routes.views.authentication import authentication_required
from web.server.routes.views.authorization import AuthorizedOperation
from web.server.routes.views.dashboard import get_dashboard


def slim_query_result_spec_in_place(query_result_spec, view_type):
    '''Replace the viz settings on the queryResultSpec with a filtered version that only
    contains the requested view type, and patch the list of viz types that are supported
    by the spec to only be the single requested type. This operation is in-place.

    NOTE(stephen): This optimization is not strictly necessary for the page to work, it
    just is nice to do.
    '''
    viz_settings = query_result_spec.get('visualizationSettings', {}).get(view_type)
    if not viz_settings:
        return

    query_result_spec['visualizationSettings'] = {view_type: viz_settings}
    query_result_spec['viewTypes'] = [view_type]


def viz_type_to_view_type(viz_type):
    '''Convert the modern visualizationType into a viewType that is stored on
    queryResultSpec.

    NOTE(stephen): This is only needed so we can optimize the queryResultSpec to be as
    light as possible coming from the dashboard. It's kind of a hack.
    '''
    viz_type_map = {
        'BAR': 'BAR_GRAPH',
        'BAR_LINE': 'BAR_GRAPH',
        'BAR_OVERLAPPING': 'BAR_GRAPH',
        'BAR_STACKED': 'BAR_GRAPH',
        'BAR_HORIZONTAL': 'BAR_GRAPH',
        'BAR_HORIZONTAL_LINE': 'BAR_GRAPH',
        'BAR_HORIZONTAL_OVERLAPPING': 'BAR_GRAPH',
        'BAR_HORIZONTAL_STACKED': 'BAR_GRAPH',
        'BOXPLOT': 'BOX_PLOT',
        'EPICURVE': 'EPICURVE',
        'HEATTILES': 'HEATTILES',
        'HIERARCHY': 'EXPANDOTREE',
        'LINE': 'TIME',
        'MAP': 'MAP',
        'MAP_ANIMATED': 'MAP',
        'MAP_HEATMAP': 'MAP',
        'MAP_HEATMAP_ANIMATED': 'MAP',
        'NUMBER_TREND': 'NUMBER_TREND',
        'NUMBER_TREND_SPARK_LINE': 'NUMBER_TREND',
        'PIE': 'PIE',
        'RANKING': 'BUMP_CHART',
        'SCATTERPLOT': 'BUBBLE_CHART',
        'SUNBURST': 'SUNBURST',
        'TABLE': 'TABLE',
        'TABLE_SCORECARD': 'TABLE',
    }
    return viz_type_map.get(viz_type, viz_type)


def find_item_holder(specification, tile_id):
    for item_holder in specification['items']:
        if item_holder['id'] == tile_id:
            return item_holder

    return None


def get_dashboard_level_query_tile_settings(settings, tile_id):
    '''Find the settings that apply to this tile that are set at the dashboard level.'''
    return settings['items'] if tile_id in settings['excludedTiles'] else []


def build_dashboard_response(specification, tile_id):
    '''Find the query tile in the raw spec and return only the information needed to
    render that tile fully on the frontend.
    '''
    item_holder = find_item_holder(specification, tile_id)

    # TODO(stephen): Handle case where ID is wrong.
    if not item_holder:
        return {}

    query_item = item_holder['item']
    slim_query_result_spec_in_place(
        query_item['queryResultSpec'],
        viz_type_to_view_type(query_item['visualizationType']),
    )

    # Include only the common filters and groupings that are applied to this tile.
    # NOTE(stephen): This will definitely break when common settings is changed (which
    # is kind of planned for Q4 2021).
    common_settings = specification['commonSettings']
    filter_items = get_dashboard_level_query_tile_settings(
        common_settings['filterSettings'], tile_id
    )
    grouping_items = get_dashboard_level_query_tile_settings(
        common_settings['groupingSettings'], tile_id
    )

    # Drop all items except for the one that is selected. Return only the information
    # needed for the query tile resolution.
    return {
        'dashboardFilterItems': filter_items,
        'dashboardGroupingItems': grouping_items,
        'item': query_item,
    }


class EmbeddedQueryPageRouter:
    def __init__(self, template_renderer, default_locale):
        self.template_renderer = template_renderer
        self.default_locale = default_locale

    @authentication_required()
    def build_dashboard_value(self, name: str, item_id: str):
        dashboard_entity = get_dashboard(name)
        if not dashboard_entity:
            # abort with not found error to render the not found page
            abort(NOT_FOUND)

        try:
            with AuthorizedOperation(
                'view_resource', 'dashboard', dashboard_entity.resource_id
            ):
                # Filter the spec down to only the pieces that are needed for the
                # item ID specified in the URL.
                raw_specification = dashboard_entity.specification
                return build_dashboard_response(raw_specification, item_id)
        except Unauthorized:
            return redirect('/unauthorized')

    @authentication_required()
    def embedded_dashboard_item(self, width, height, name, item_id, locale=None):
        '''Build a dashboard spec containing only the pieces needed for the specific
        item ID requested (like a single grid dashboard tile on the page).
        '''
        locale = locale or self.default_locale
        try:
            template_args = {
                'embedded': {
                    'dashboard': self.build_dashboard_value(name, item_id),
                    'height': height,
                    'width': width,
                }
            }
            return self.template_renderer.render_helper(
                'embedded_query.html', locale, template_args, template_args
            )
        except Unauthorized:
            return redirect('/unauthorized')

    @authentication_required()
    def build_user_query_value(self, query_uuid):
        try:
            # HACK(stephen): GIANT HACK. There is no clean way to make a call to a
            # method inside a Flask-Potion resource. Instead of exposing the method
            # inside `UserQuerySessionResource`, I have looked up the actual
            # registration that Flask-Potion has built. Calling this method is like
            # calling the resource's method via the potion API.
            data = current_app.view_functions['user_query_session_readByQueryUuid'](
                id=query_uuid
            ).json
            query_blob = data.get('queryBlob')
            if not query_blob:
                abort(NOT_FOUND)

            query_result_spec = query_blob['queryResultSpec']
            view_type = query_blob['viewType']
            slim_query_result_spec_in_place(query_result_spec, view_type)
            return {
                'queryResultSpec': query_result_spec,
                'querySelections': query_blob['querySelections'],
                'viewType': view_type,
            }
        except ItemNotFound:
            abort(NOT_FOUND)

    @authentication_required()
    def embedded_user_query(self, width, height, query_uuid, locale=None):
        '''Find the query session associated to the provided query UUID and render it
        on the page.
        '''
        locale = locale or self.default_locale
        try:
            template_args = {
                'embedded': {
                    'height': height,
                    'query': self.build_user_query_value(query_uuid),
                    'width': width,
                }
            }
            return self.template_renderer.render_helper(
                'embedded_query.html', locale, template_args, template_args
            )
        except Unauthorized:
            return redirect('/unauthorized')

    def generate_blueprint(self):
        # pylint: disable=C0103
        embedded_route = Blueprint('embed', __name__, template_folder='templates')

        size = '<int:width>x<int:height>'
        embedded_route.add_url_rule(
            f'/embed/{size}/<query_uuid>',
            'embedded_user_query',
            self.embedded_user_query,
        )
        embedded_route.add_url_rule(
            f'/<locale>/embed/{size}/<query_uuid>',
            'embedded_user_query',
            self.embedded_user_query,
        )
        embedded_route.add_url_rule(
            f'/embed/{size}/dashboard/<name>/<item_id>',
            'embedded_dashboard_query',
            self.embedded_dashboard_item,
        )
        embedded_route.add_url_rule(
            f'/<locale>/embed/{size}/dashboard/<name>/<item_id>',
            'embedded_dashboard_query',
            self.embedded_dashboard_item,
        )
        return embedded_route
