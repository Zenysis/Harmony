from operator import attrgetter
from uuid import uuid4

import related

from models.python.dashboard.latest.model import (
    DashboardSpecification,
    DateRangeType,
    DateRangeSpecification,
    FilterDefinition,
    LayoutItem,
    QueryDefinition,
    LayoutMetadataDefinition,
    VisualizationSettings,
)
from models.python.dashboard.version import LATEST_VERSION
from web.server.util.util import SELECTIONS_DATETIME_FORMAT, convert_datetime


def _create_date_range_from_query(base_id, legacy_query_selections):
    '''Build the date range model from a legacy query selections dict'''
    start_date = legacy_query_selections['startDate']
    end_date = legacy_query_selections['endDate']

    # Convert the frontend date range type into the backend representation. If
    # the frontend does not map cleanly to the backend, fallback to CUSTOM
    # date range which will always work.
    input_date_range_type = legacy_query_selections['dateType']
    date_range_type = DateRangeType.CUSTOM
    if input_date_range_type in DateRangeType.__members__:
        date_range_type = DateRangeType[input_date_range_type]

    return DateRangeSpecification(
        id='dateRange_%s' % base_id,
        date_type=date_range_type,
        start_date=convert_datetime(start_date, SELECTIONS_DATETIME_FORMAT),
        end_date=convert_datetime(end_date, SELECTIONS_DATETIME_FORMAT),
    )


def _create_settings_model(base_id, query_result_spec):
    '''Build the VisualizationSettings model from a query result spec dict'''
    settings = related.to_model(VisualizationSettings, query_result_spec['settings'])
    settings.id = 'layout_%s_settings' % base_id
    return settings


def _create_field_filters_map(base_id, legacy_query_selections, field_options=None):
    '''Build the filters map that holds filters for all fields in a legacy
    query selections dict
    '''
    if not field_options:
        # $ConfigImportHack
        # HACK(vedant) - Because we want to completely break the dependence on the
        # configuration import hack, we need to reference values via a dynamic import
        try:
            from flask import current_app

            field_options = current_app.zen_config.ui.FIELD_OPTIONS
        except ImportError:
            # In case we are NOT running on the server
            # NOTE(vedant) - This has SEVERE performance implications and a
            # better solution is required for long term use
            from config.loader import get_configuration_module

            configuration_module = get_configuration_module()
            field_options = configuration_module.ui.FIELD_OPTIONS

    # TODO(pablo): this is not to be confused with the filters that hold
    # geo filters. This map is just holding field filters. This function
    # will likely disappear once we refactor the dashboard spec to keep
    # track of a list of fields instead of a list of field filters.
    filter_map = {}
    filter_count = 0
    for field_option in field_options:
        if field_option != 'denominator':
            for field in legacy_query_selections.get(field_option, []):
                _filter = FilterDefinition(
                    id='filter_%s_%s' % (base_id, filter_count),
                    filter_on=field_options[field_option],
                    filter_values=[field],
                )
                filter_map[_filter.id] = _filter
                filter_count += 1
    return filter_map


def _create_query_model(
    base_id,
    visualization_type,
    setting_id,
    query_result_spec,
    filters=None,
    date_range=None,
    advanced_query_selections=None,
    legacy_query_selections=None,
    is_advanced_query_item=False,
):
    '''Build the QueryDefinition model.
    NOTE(pablo): Currently we build it differently depending on whether
    we are receiving advanced query selections or legacy ones. This
    will eventually change because the advanced query information is
    generic enough to represent any query.
    '''
    query_id = 'query_%s' % base_id
    layout_id = 'layout_%s' % base_id
    front_end_selections_filter = query_result_spec['filters']
    if legacy_query_selections is not None:
        front_end_selections_filter.update(legacy_query_selections['filters'])

    query = QueryDefinition(
        id=query_id,
        layout_item_id=layout_id,
        visualization_type=visualization_type,
        is_advanced_query_item=is_advanced_query_item,
        custom_fields=query_result_spec['customFields'],
        filter_modal_selections=query_result_spec.get('modalFilters', {}),
        front_end_selections_filter=front_end_selections_filter,
        setting_id=setting_id,
    )

    if is_advanced_query_item:
        query.advanced_fields = advanced_query_selections['fields']
        query.advanced_groups = advanced_query_selections['groups']
        query.advanced_filters = advanced_query_selections['filters']
    else:
        query.date_range_id = date_range.id
        query.magic_filter_ids = [_filter.id for _filter in filters.values()]
        query.group_by = legacy_query_selections['granularity']
    return query


def _create_default_layout_item(base_id):
    '''Build a LayoutItem model which contains fields specific to a dashboard items
    position and size.
    '''
    layout_metadata = LayoutMetadataDefinition(
        upper_x=0, upper_y=0, rows=2, columns=3, is_locked=False
    )
    return LayoutItem(id='layout_%s' % base_id, layout_metadata=layout_metadata)


def _convert_advanced_query_to_dashboard(
    view_type, query_selections, query_result_spec
):
    item_id = uuid4()

    # create the all the models that make up a specification
    settings = _create_settings_model(item_id, query_result_spec)
    query = _create_query_model(
        base_id=item_id,
        visualization_type=view_type,
        setting_id=settings.id,
        query_result_spec=query_result_spec,
        is_advanced_query_item=True,
        advanced_query_selections=query_selections,
    )
    layout_item = _create_default_layout_item(base_id=item_id)

    # add all the models to the specification
    return DashboardSpecification(
        version=LATEST_VERSION,
        items={layout_item.id: layout_item},
        queries={query.id: query},
        settings={settings.id: settings},
    )


def _convert_simple_query_to_dashboard(
    view_type, legacy_query_selections, query_result_spec
):
    # TODO(moriah): make it so that you don't have to store both the
    # filterModal options selected and the filters used in the applyFilters()
    # function.
    item_id = uuid4()

    # create the all the models that make up a specification
    date_range = _create_date_range_from_query(item_id, legacy_query_selections)
    filters = _create_field_filters_map(item_id, legacy_query_selections)
    settings = _create_settings_model(item_id, query_result_spec)
    query = _create_query_model(
        base_id=item_id,
        visualization_type=view_type,
        setting_id=settings.id,
        query_result_spec=query_result_spec,
        filters=filters,
        date_range=date_range,
        legacy_query_selections=legacy_query_selections,
    )
    layout_item = _create_default_layout_item(base_id=item_id)

    # add all the models to the specification
    return DashboardSpecification(
        version=LATEST_VERSION,
        date_ranges={date_range.id: date_range},
        filters=filters,
        items={layout_item.id: layout_item},
        queries={query.id: query},
        settings={settings.id: settings},
    )


def convert_query_to_dashboard(
    view_type, query_selections, query_result_spec, is_advanced_query
):
    convert_func = None
    if is_advanced_query:
        convert_func = _convert_advanced_query_to_dashboard
    else:
        convert_func = _convert_simple_query_to_dashboard
    return convert_func(view_type, query_selections, query_result_spec)


def remove_orphans_from_dashboard(raw_specification):
    '''Removes all the orphaned date ranges, queries, filters and size objects
    from a dashboard specification. Orphaned items are items that are not
    directly consumed by a layout item on the dashboard.

    Parameters
    ----------

    raw_specification : dict
        The dashboard specification from which orphaned objects are to be removed.

    Returns
    ----------
    DashboardSpecification
        The updated specification with all orphaned items removed.
    '''
    new_specification = related.to_model(DashboardSpecification, raw_specification)
    queries = {}
    for query in new_specification.queries.values():
        if query.layout_item_id in new_specification.items:
            queries[query.id] = query

    query_values = queries.values()
    new_specification.settings = _extract_values_in_use(
        new_specification.settings, query_values, attrgetter('setting_id')
    )
    new_specification.queries = queries

    # First remove all orphaned queries before removing orphaned date ranges.
    # That way any 'newly-orphaned' filters/date ranges will also be removed.
    new_specification.date_ranges = _extract_values_in_use(
        new_specification.date_ranges, query_values, attrgetter('date_range_id')
    )

    # Filters are slightly different from the other items since the filter ID
    # is nested inside the query, and each query can reference multiple filters.
    referenced_filters = set(
        [
            filter_id
            for query in new_specification.queries.values()
            for filter_id in query.magic_filter_ids
        ]
    )
    new_specification.filters = _extract_values_in_use(
        new_specification.filters, referenced_filters, lambda x: x
    )

    return new_specification


def _extract_values_in_use(value_mapping, reference, get_id_fn):
    output = {}
    ids_in_use = [get_id_fn(val) for val in reference]
    for value_id, value in value_mapping.items():
        if value_id in ids_in_use:
            output[value_id] = value
    return output
