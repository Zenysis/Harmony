from collections import defaultdict
from datetime import datetime

import pydruid.query
import pydruid.utils.aggregators
from pydruid.utils.dimensions import TimeFormatExtraction
from pydruid.utils.filters import Filter
from pydruid.utils.postaggregator import Postaggregator

from data.calculated_indicator.util import get_constituent_fields

DRUID_DATE_FORMAT = '%Y-%m-%d'  # TODO(stephen): Add time portion

##### Hack
# TODO(stephen): either fork pydruid master branch or submit pull request to
# project and remove this workaround from here
def _build_filter_workaround(filter_obj):
    # make a copy so we don't overwrite the original objects stored fields
    raw_filter = filter_obj.filter['filter'].copy()
    filter_type = raw_filter.get('type')

    if not filter_type:
        return None
    if filter_type in ['and', 'or']:
        raw_filter['fields'] = [
            _build_filter_workaround(f) for f in raw_filter['fields']
        ]
    elif filter_type in ['not']:
        raw_filter['field'] = Filter.build_filter(raw_filter['field'])
    return raw_filter


Filter.build_filter = _build_filter_workaround


def _build_aggregator_workaround(name, kwargs):
    # Make a copy so we don't overwrite the original object
    aggregator = kwargs.copy()
    if aggregator["type"] == "filtered":
        aggregator["aggregator"] = _build_aggregator_workaround(
            name, aggregator["aggregator"]
        )
    else:
        aggregator.update({"name": name})
    return aggregator


# pylint: disable=protected-access
pydruid.utils.aggregators._build_aggregator = _build_aggregator_workaround

# HACK(stephen): The pydruid bug from pull #74. It added validation to the
# datasource being passed in, but left out support for the 'query' datasource
# type. We are using the library properly, so just remove the checks here.
@staticmethod  # type: ignore
def _parse_datasource_workaround(datasource, _):
    return datasource


pydruid.query.QueryBuilder.parse_datasource = _parse_datasource_workaround
##### End Hack

# Empty filter object that acts like a normal druid filter for bitwise
# operations.
class EmptyFilter(Filter):
    # NOTE(stephen): Intentionally not calling the super constructor here since
    # it raises an exception for unknown filter types.
    # pylint: disable=super-init-not-called
    def __init__(self):
        self.filter = {'filter': {}}

    def __and__(self, other_filter):
        return other_filter

    def __or__(self, other_filter):
        return other_filter

    def __invert__(self):
        return self

    def __eq__(self, other_filter):
        if other_filter is None:
            return False

        if not hasattr(other_filter, 'filter'):
            return False

        return self.filter == other_filter.filter


# Add support for EmptyFilter to the pydruid Filter class
# TODO(stephen): CLEAN THIS UP. THIS FILE IS HARD TO UNDERSTAND WITH ALL THIS
# JUNK FLOATING AROUND.
_FILTER_AND = Filter.__and__
_FILTER_OR = Filter.__or__


def _filter_and_workaround(self, other_filter):
    if isinstance(other_filter, EmptyFilter):
        return self
    return _FILTER_AND(self, other_filter)


def _filter_or_workaround(self, other_filter):
    if isinstance(other_filter, EmptyFilter):
        return self
    return _FILTER_OR(self, other_filter)


Filter.__and__ = _filter_and_workaround
Filter.__or__ = _filter_or_workaround

# Add support for the undocumented Expression post aggregator.
class ExpressionPostAggregator(Postaggregator):
    def __init__(self, formula):
        # UGHHHH pydruid uses old-style classes.
        Postaggregator.__init__(self, None, None, 'expression')
        self.post_aggregator = {'type': 'expression', 'expression': formula}


# Build custom druid arbitrary granularity type for the given time intervals
def build_arbitrary_granularity(intervals):
    return {'type': 'arbitrary', 'intervals': intervals}


# Convert a druid filter that has already had the `build_filter` method called
# on it (or was constructed following the druid filter spec:
# http://druid.io/docs/latest/querying/filters.html) into a pydruid Filter
def build_filter_from_dict(built_filter):
    filter_dict = dict(built_filter)
    filter_type = filter_dict['type']

    # Pydruid for some reason does not allow you to specify a dimension
    # selector filter as the type. It is just the default. Unset the filter
    # type so that we don't get an error.
    # TODO(stephen): Fix pydruid's implementation and submit a PR
    if filter_type == 'selector':
        filter_dict.pop('type')
    # AND, OR, and NOT filters can store nested filters. Recursively process
    # the nested filters so that they are converted to Filter objects and
    # not secretly left as dicts
    elif filter_type == 'and' or filter_type == 'or':
        fields = [build_filter_from_dict(f) for f in filter_dict['fields']]
        filter_dict['fields'] = fields
    elif filter_type == 'not':
        filter_dict['field'] = build_filter_from_dict(filter_dict['field'])

    return Filter(**filter_dict)


# If an aggregation is a filtered aggregation, convert the
# built filter dict into a pydruid filter object.
# The Pydruid library stores filtered aggregations with the
# filter already built into a dict instead of storing it as the
# original filter object. This is annoying.
# TODO(stephen): Improve the pydruid library or learn to let things go
def build_filter_from_aggregation(aggregation):
    if not isinstance(aggregation, dict) or aggregation['type'] != 'filtered':
        return None
    return build_filter_from_dict(aggregation['filter'])


def get_post_aggregation_fields(post_aggregation):
    output = set()
    _recursive_get_post_aggregation_fields(post_aggregation.post_aggregator, output)
    return output


# Retrieve all the fieldNames accessed for a given post aggregation
# pylint: disable=C0103
def _recursive_get_post_aggregation_fields(post_aggregation, found_fields):
    post_agg_type = post_aggregation['type']
    if post_agg_type == 'expression':
        formula = post_aggregation['expression']
        found_fields.update(get_constituent_fields(formula))
        return

    if post_agg_type == 'javascript':
        found_fields.update(post_aggregation['fieldNames'])
        return

    fields = post_aggregation.get('fields')
    field_name = post_aggregation.get('fieldName')
    # If the current post_aggregation has a field name, add it to
    # the found_fields and stop recursing
    if field_name:
        found_fields.add(field_name)
        return

    # No fields left to search
    if not fields:
        return

    for field in fields:
        _recursive_get_post_aggregation_fields(field, found_fields)


# Pydruid does not support time interval filters as a filter type, so we have
# to hack in support here.
def build_interval_filter(intervals):
    # Create an empty filter as the base
    output = Filter(type='and', fields=[])

    # Replace the internal filter object with a time interval filter that
    # meets the druid spec
    output.filter['filter'] = {
        'type': 'interval',
        'dimension': '__time',
        'intervals': intervals,
    }
    return output


# Build ISO interval string from two python dates
def build_time_interval(start_date, end_date):
    return '%s/%s' % (
        start_date.strftime(DRUID_DATE_FORMAT),
        end_date.strftime(DRUID_DATE_FORMAT),
    )


# Convert an ISO interval string into two python dates
def unpack_time_interval(interval):
    (start, end) = interval.split('/')

    # TODO(stephen): Support datetime.datetime when needed
    return (
        datetime.strptime(start, DRUID_DATE_FORMAT).date(),
        datetime.strptime(end, DRUID_DATE_FORMAT).date(),
    )


# For a given set of filtered aggregations, build a single filter that
# covers all the cases that can be used for a query.
def build_query_filter_from_aggregations(aggregations):
    # Merge all the aggregations' filters into a single chained filter
    merged_filters = None
    for aggregation in aggregations.values():
        agg_filter = build_filter_from_aggregation(aggregation)
        if not agg_filter:
            # If one of the aggregations is not filtered, we cannot build an optimized
            # full query filter. This is because that one aggregation might require
            # access to rows that all other aggregations might filter out.
            # NOTE(stephen): This might poison the query to be significantly slower.
            return EmptyFilter()

        if not merged_filters:
            merged_filters = agg_filter
        else:
            merged_filters |= agg_filter

    if not merged_filters:
        return EmptyFilter()

    # Extract the dimensions that are referenced in filtered aggregations. If
    # the filter cannot be optimized, fallback to the fully accurate (though
    # more verbose) merged filter built above.
    (value_output, regex_output, optimizable) = get_dimension_filters(merged_filters)
    if not optimizable:
        return merged_filters

    # Construct an empty filter for convenience so that we can start building
    # on top of it
    output = Filter(type='or', fields=[])

    # Build a unified filter for the common dimensions
    for dimension, values in value_output.items():
        if len(values) == 1:
            output |= Filter(dimension=dimension, value=values.pop())
        else:
            output |= Filter(type='in', dimension=dimension, values=sorted(values))

    for dimension, patterns in regex_output.items():
        regex = '(%s)' % ')|('.join(patterns)
        output |= Filter(dimension=dimension, pattern=regex)

    # Quick check to see if we've only added a single filter. If so,
    # just return it instead of an OR (single filter)
    if len(output.filter['filter']['fields']) == 1:
        return output.filter['filter']['fields'][0]
    return output


# Retrieve a list of the dimension values and regex patterns being
# filtered on
# TODO(stephen): This code is kinda ugly
def get_dimension_filters(full_filter):
    if not full_filter:
        return ({}, {})

    value_output = defaultdict(set)
    regex_output = defaultdict(set)
    optimizable = _recursive_get_dimension_filters(
        full_filter, value_output, regex_output
    )
    return (value_output, regex_output, optimizable)


# Mapping from dimension filter types to their filter value field
_DIMENSION_VALUE_FIELD_MAP = {'in': 'values', 'regex': 'pattern', 'selector': 'value'}

# Only care about filters that either filter a dimension or could
# contain a dimension filter in its child filters.
# TODO(stephen): Javascript filter?
_ALLOWED_FILTERS = set(['and', 'or', *_DIMENSION_VALUE_FIELD_MAP.keys()])

# Traverse a nested filter tree and extract the dimension values and
# regex patterns that are being filtered on. If a filter type is found that
# cannot be flattened, return False to indicate the filter cannot be optimized.
# NOTE(stephen): This function does not properly respect AND/OR merging. It
# merges all values together as if it were OR'd.
def _recursive_get_dimension_filters(
    full_filter, found_value_filters, found_regex_filters
):
    if not full_filter:
        return False

    # If we encounter a filter type that is not in our limited set of filters,
    # we cannot optimize the initial filter to produce a flattened set of
    # dimension values to filter on.
    raw_filter = full_filter.filter['filter']
    filter_type = raw_filter['type']
    if filter_type not in _ALLOWED_FILTERS:
        return False

    # If the filter type contains a dimension value filter, add it to the
    # found filter list and stop recursing
    if filter_type in _DIMENSION_VALUE_FIELD_MAP:
        dimension = raw_filter['dimension']
        value_field = _DIMENSION_VALUE_FIELD_MAP[filter_type]
        values = raw_filter[value_field]

        # Selector and regex filters return a string value.
        if isinstance(values, str) or isinstance(values, str):
            values = [values]

        # Treat regex patterns differently
        if filter_type == 'regex':
            found_regex_filters[dimension].update(values)
        else:
            found_value_filters[dimension].update(values)
    else:
        # Handle AND and OR which contain nested filters
        for f in raw_filter['fields']:
            optimizable = _recursive_get_dimension_filters(
                f, found_value_filters, found_regex_filters
            )
            if not optimizable:
                return False
    return True


# Extract all aggregations this post aggregation is dependent on to be
# computed. This includes processing any post aggregations it relies on.
def extract_aggregations_for_post_aggregation(key, aggregations, post_aggregations):
    output = {}
    fields_accessed = get_post_aggregation_fields(post_aggregations[key])
    processed_fields = set()

    # Loop through all fields this post aggregation touches. If one of the
    # dependant fields is itself a post aggregation, then add the fields it
    # accesses to the set and process those.
    while fields_accessed:
        field = fields_accessed.pop()

        # Keep track of the fields already processed to avoid an infinite loop.
        # NOTE(stephen): Technically a post aggregation should not be allowed
        # to reference a cycle, but its safer and faster to do this anyways.
        if field in processed_fields:
            continue
        processed_fields.add(field)

        if field in post_aggregations:
            new_fields_accessed = get_post_aggregation_fields(post_aggregations[field])
            fields_accessed.update(new_fields_accessed)
        else:
            output[field] = aggregations[field]
    return output


class GranularityTimeFormatExtraction(TimeFormatExtraction):
    '''Time format extractor that allows a granularity bucketing option. This is useful
    for formatting by types not supported by just a format string. Example is Quarter.
    The granularity provided must be a Druid granularity.
    '''

    def __init__(self, time_format, granularity, locale=None, time_zone=None):
        super().__init__(time_format, locale, time_zone)
        self._granularity = granularity

    def build(self):
        output = super().build()
        output['granularity'] = self._granularity
        return output
