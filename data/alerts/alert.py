'''Entry point for business logic dealing with alerts.
'''
from datetime import datetime, timedelta
from typing import Dict, List, NamedTuple, Optional

from pydruid.utils.aggregators import filtered as filtered_aggregator, longmax
from pydruid.utils.filters import Filter

from config.aggregation_rules import get_granularity_for_interval
from config.datatypes import DIMENSION_PARENTS, HIERARCHICAL_DIMENSIONS
from config.filters import AUTHORIZABLE_DIMENSIONS
from data.query.models import Field
from data.query.models.query_filter import (
    AndFilter,
    OrFilter,
    NotFilter,
    QueryFilter,
    SelectorFilter,
)
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.metadata import DruidMetadata
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.util import (
    build_query_filter_from_aggregations,
    build_time_interval,
    DRUID_DATE_FORMAT,
)
from web.python_client.alerts_service.model import (
    AlertDefinition,
    AlertNotification,
    RefObject,
    ThresholdCheck,
    ComparativeCheck,
)

NUM_DAYS_OF_BACK_CHECK = 1


# For an alert definition, the min_date is the latest time all fields have data. The max_date is
# the latest time at least one field has data. Note: min_date and max_date could be equal. Both
# are necessary to determine the time interval to query druid for a given alert granularity.
class AlertLatestDate(NamedTuple):
    max_date: datetime
    min_date: datetime


# TODO(abby): Figure out how to not need to duplicate this from the frontend.
def build_druid_filters(filters: List[QueryFilter]) -> Optional[QueryFilter]:
    '''Combines a list of filters into a single filter. Right now, this logic needs to be kept
    in sync with the front end (`buildQueryFilter` from the `QuerySelections` model). The
    filter will AND together all of the filter items.
    '''
    if not filters:
        return None
    if len(filters) == 1:
        return filters[0].to_druid()
    return AndFilter(fields=filters).to_druid()


# TODO(abby): Figure out how to not need to duplicate this from the frontend.
def get_dimension_value_filters(alert_def: AlertDefinition) -> List[QueryFilter]:
    '''Converts the DimensionValueFilterItems into a list of QueryFilter. Right now, this logic
    needs to be kept in sync with the front end (`getFullyBuiltFilter` from the
    `DimensionValueFilterItem` frontend model). The filter will OR together the dimension values
    as SelectorFilters.
    '''
    druid_filters = []
    dimension_name = alert_def.dimension_name
    dimension_name_filtered = dimension_name is None
    for filter_item in alert_def.filters:
        # Build the filter from a single DimensionValueFilterItem
        if len(filter_item.dimension_values) == 1:
            built_filter = filter_item.dimension_values[0].filter
        else:
            filter_list = [
                dimension_value.filter
                for dimension_value in filter_item.dimension_values
            ]
            built_filter = OrFilter(fields=filter_list)

        # Invert, if applicable, and add to list of filters
        if filter_item.invert:
            druid_filters.append(NotFilter(field=built_filter))
        else:
            druid_filters.append(built_filter)

        dimension_name_filtered = (
            dimension_name_filtered or filter_item.dimension == dimension_name
        )

    # If there is a dimension name and there are no filters on that same dimension,
    # add one to ensure alerts aren't triggered for empty dimension values.
    if not dimension_name_filtered:
        druid_filters.append(
            NotFilter(SelectorFilter(dimension=dimension_name, value=''))
        )

    return druid_filters


def build_query_from_alert_def(
    alert_def: AlertDefinition,
    datasource_name,
    latest_date: AlertLatestDate,
    dimensions_to_pull,
) -> GroupByQueryBuilder:
    '''Builds query from supplied alert information. Adds filter to check
    for empty dimension data.
    '''
    calculations = [field.calculation.to_druid(field.id) for field in alert_def.fields]
    dimension_filter = build_druid_filters(get_dimension_value_filters(alert_def))
    interval_string = get_interval_bounds(latest_date, alert_def.time_granularity)

    return GroupByQueryBuilder(
        datasource=datasource_name,
        granularity=alert_def.time_granularity,
        grouping_fields=dimensions_to_pull,
        dimension_filter=dimension_filter,
        intervals=[interval_string],
        calculation=CalculationMerger(calculations),
        optimize=True,
    )


def get_day_interval_bounds(latest_date: AlertLatestDate) -> str:
    '''Daily logic is to use the latest date all fields have data (min).'''
    date = latest_date.min_date
    day_after = date + timedelta(days=1)

    # NOTE(toshi): Currently implemented so that we only search the day of
    return build_time_interval(date, day_after)


def get_week_interval_bounds(latest_date: AlertLatestDate) -> str:
    '''Weekly logic is set to Monday - Sunday. Lower bound will be the prior Monday.
    If the min and max dates are in the same week, the max date will the upper bound.
    Otherwise, the end of the week will be the upper bound.
    '''
    min_date = latest_date.min_date
    max_date = latest_date.max_date
    days_since_monday = min_date.weekday()
    start_date = min_date - timedelta(days=days_since_monday)

    # NOTE(toshi): The end time boundaries is exclusive.
    if start_date == max_date - timedelta(days=max_date.weekday()):
        end_date = max_date + timedelta(days=1)
    else:
        end_date = start_date + timedelta(days=7)

    return build_time_interval(start_date, end_date)


def get_month_interval_bounds(latest_date: AlertLatestDate) -> str:
    '''Month bucket logic is to set the lower bound as the beginning of the month of
    the min date. If the min and max dates are in the same month, the max date will
    the upper bound. Otherwise, the end of the month will be the upper bound.
    '''
    min_date = latest_date.min_date
    max_date = latest_date.max_date

    start_date = min_date.replace(day=1)
    # NOTE(toshi): The end time boundaries is exclusive.
    if min_date.month == max_date.month:
        end_date = max_date + timedelta(days=1)
    else:
        # NOTE(abby): Timedelta can't do months, so do this manually
        end_date = (
            start_date.replace(month=start_date.month + 1)
            if start_date.month != 12
            else start_date.replace(year=start_date.year + 1, month=1)
        )

    # See if the deployment requires a non-standard arbitrary granularity.
    granularity = get_granularity_for_interval('month', start_date, end_date)
    if isinstance(granularity, dict) and granularity['type'] == 'arbitrary':
        return granularity['intervals'][-1]

    return build_time_interval(start_date, end_date)


def get_interval_bounds(latest_date: AlertLatestDate, time_granularity) -> str:
    '''Given a list of dates for the most recent data entry, return bounds as a
    string for the supplied time granularity.
    NOTE(toshi): Druid intervals are inclusive, exclusive, so end time needs to
    account for that.
    '''
    # TODO(toshi): Implement other granularities

    get_time_bound_map = {
        'month': get_month_interval_bounds,
        'week': get_week_interval_bounds,
        'day': get_day_interval_bounds,
    }

    if time_granularity not in get_time_bound_map:
        assert False, 'Time granularity: %s is not supported' % time_granularity
    return get_time_bound_map[time_granularity](latest_date)


def run_checks(
    alert_definition: AlertDefinition, query_results, query, dimensions_to_pull
) -> List[AlertNotification]:
    '''Looks through all values in `query_results` and evaluates the check. The checks types are
    defined in `web/python_client/alert_service/model.py`. All values in `query_results` will be
    looked at and alerted on (no short-circuiting will take place).

    Parameters
    ----------
        alert_definition: AlertDefinition
            The `AlertDefinition` model that data in `query_results` should be evaluated against

        query_results: iter
            The from the query that is to be evaluated against `alert_def`

        query
            The druid query that was used to produce `query_results`

        dimensions_to_pull
            List of relevant dimensions that we should store into an AlertNotification

    Returns
    ----------
    iter
        An iteration of `AlertNotification` models for any values in the
        Druid Database that need to be alerted on.
    '''
    # TODO(toshi): Possibly see if we can implement filtering using
    #   http://druid.io/docs/latest/querying/filters.html
    notifications = []
    current_time_string = datetime.now().strftime(DRUID_DATE_FORMAT)
    for query_result in query_results:
        query_data = query_result['event']
        fields = alert_definition.fields
        left_value = query_data[fields[0].id]
        right_value = query_data[fields[1].id] if len(fields) > 1 else None
        check_type_map = {
            ThresholdCheck.TYPE: [left_value],
            ComparativeCheck.TYPE: [left_value, right_value],
        }

        # For a dimension value, one of the two fields could have data. Therefore,
        # druid would return a row, but we don't want to evaluate the alert if there
        # isn't complete data.
        if left_value is None or (right_value is None and len(fields) > 1):
            continue

        for check in alert_definition.checks:
            if check.evaluate(*check_type_map[check.type]):
                # Change this out
                alert_def_ref = RefObject(ref=alert_definition.uri)
                dimension_info = {
                    dimension_name: {
                        'dimension_name': dimension_name,
                        'dimension_val': query_data.get(dimension_name) or '',
                    }
                    for dimension_name in dimensions_to_pull
                }
                notifications.append(
                    AlertNotification(
                        alert_definition=alert_def_ref,
                        dimension_info=dimension_info,
                        generation_date=current_time_string,
                        reported_val=str(left_value),
                        compared_val=None if right_value is None else str(right_value),
                        query_interval=query['intervals'][0],
                    )
                )

    return notifications


def get_relevant_dimensions(alert_def: AlertDefinition):
    '''Returns a list of dimensions that need to be pulled from Druid and
    incorporated into an AlertNotification for downstream security checks. If
    the dimension in the alert_def is hierarchical, we add the hierarchical
    dimensions from AUTHORIZABLE_DIMENSIONS if they exist, but only if the
    filter dimension is greater than or equal to the alert definition dimension.

    NOTE: This is currently designed for a single hierarchical dimension in
    AUTHORIZABLE_DIMENSIONS.
    '''
    hierarchical_filter_dimensions = [
        dimension_id
        for dimension_id in AUTHORIZABLE_DIMENSIONS
        if dimension_id in HIERARCHICAL_DIMENSIONS
    ]
    alert_dimension = alert_def.dimension_name
    return [
        dimension_id
        for dimension_id in hierarchical_filter_dimensions
        if dimension_id in DIMENSION_PARENTS.get(alert_dimension, [])
    ] + [alert_dimension]


def check_single_alert(
    alert_def: AlertDefinition,
    datasource_name,
    latest_date: AlertLatestDate,
    query_client,
) -> List[AlertNotification]:
    '''Check alerts for a single time period.'''
    dimensions_to_pull = get_relevant_dimensions(alert_def)
    query = build_query_from_alert_def(
        alert_def, datasource_name, latest_date, dimensions_to_pull
    )

    query_result = query_client.run_query(query).result

    if not query_result:
        return []

    return run_checks(alert_def, query_result, query, dimensions_to_pull)


def check_if_alert_triggered(
    alert_def: AlertDefinition,
    datasource_name,
    latest_date: AlertLatestDate,
    query_client,
) -> List[AlertNotification]:
    '''Check if alert should be triggered. Additionally if alert time
    granularity is for a day, we also check some number of days before, to
    account for backfill.
    '''
    # If the time granularity is day, we now check NUM_DAYS_OF_BACK_CHECK days
    # earlier as well so we have to send that number of requests
    if alert_def.time_granularity == 'day':
        notification_list = []
        for day_delta in range(NUM_DAYS_OF_BACK_CHECK + 1):
            shifted_latest_date = AlertLatestDate(
                min_date=latest_date.min_date - timedelta(days=day_delta),
                max_date=latest_date.max_date - timedelta(days=day_delta),
            )
            notification_list.extend(
                check_single_alert(
                    alert_def, datasource_name, shifted_latest_date, query_client
                )
            )
        return notification_list

    return check_single_alert(alert_def, datasource_name, latest_date, query_client)


# Build the aggregation level filters including alert level filters and calculation level filters.
# Include alert level filters here to be able to issue a single query for the time bounds on all
# alerts.
def _get_filters(field: Field, alert_def: AlertDefinition) -> Filter:
    # Start with the calculation level filter
    # NOTE(abby): If indicator level filters are enabled for alerts, revisit this as
    # `build_query_filter_from_aggregations` may not work in that case.
    field_filter = build_query_filter_from_aggregations(
        field.calculation.to_druid(field.id).aggregations
    )
    for query_filter in get_dimension_value_filters(alert_def):
        field_filter &= query_filter.to_druid()
    return field_filter


def _get_unique_field_id(field: Field, alert_def: AlertDefinition) -> str:
    return f'{field.id}_{alert_def.uri}'


# TODO(abby): Pull out the last date calculation and move it to a util method
def create_last_date_calculations(alert_def: AlertDefinition) -> BaseCalculation:
    '''Get a list of calculations to get the latest time there was data for each field of an
    alert definition. For formula calculations, the max time across all consitutents is taken.
    '''
    calculation = BaseCalculation()
    for field in alert_def.fields:
        aggregation = filtered_aggregator(
            filter=_get_filters(field, alert_def), agg=longmax('__time')
        )
        calculation.add_aggregation(_get_unique_field_id(field, alert_def), aggregation)

    calculation.set_strict_null_fields(calculation.aggregations.keys())
    return calculation


def get_latest_data_dates_for_alert_defs(
    datasource_name, alert_defs: List[AlertDefinition], query_client
) -> Dict[str, Optional[AlertLatestDate]]:
    '''Builds dict from alert definition uri to the min and max last date of
    data (as a datetime) amongst the alert definition's fields. This function
    gets the time boundary for the whole datasource to use as an absolute
    reference point to perform subsequent queries. This fetches the min and max
    datetime as the granularity levels aggregate them differently.

    If any field doesn't have data, the alert definition is mapped to None.
    '''
    (min_date, max_date) = DruidMetadata.get_datasource_timeboundary(datasource_name)
    interval_string = build_time_interval(min_date, max_date)

    calculation = CalculationMerger(
        [create_last_date_calculations(alert_def) for alert_def in alert_defs]
    )
    query = GroupByQueryBuilder(
        datasource=datasource_name,
        granularity='all',
        grouping_fields=[],
        dimension_filter=None,
        intervals=[interval_string],
        calculation=calculation,
    )

    query_results = query_client.run_query(query).result
    query_result_dict = {}
    for alert_def in alert_defs:
        last_dates = [
            query_results[0]['event'][_get_unique_field_id(field, alert_def)]
            for field in alert_def.fields
        ]
        if any(last_date is None for last_date in last_dates):
            query_result_dict[alert_def.uri] = None
        else:
            # Divide by 1000.0 because druid values are in milliseconds
            min_date = datetime.utcfromtimestamp(min(last_dates) / 1000.0).date()
            max_date = datetime.utcfromtimestamp(max(last_dates) / 1000.0).date()

            query_result_dict[alert_def.uri] = AlertLatestDate(
                min_date=min_date, max_date=max_date
            )

    return query_result_dict
