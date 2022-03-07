# This aggregation computes the exact unique count for a given dimension.
# This aggregator is DANGEROUS and should almost never be used. There are many
# choices made here around object safety and performance based on the assumption
# that this aggregation type will be used very rarely.
# Talk to @stephen if you need to use it.
from copy import deepcopy
from typing import TYPE_CHECKING

from pydruid.utils.aggregators import count, filtered as filtered_aggregator, longsum
from pydruid.utils.filters import Filter

from db.druid.aggregations.query_modifying_aggregation import QueryModifyingAggregation
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.util import EmptyFilter

if TYPE_CHECKING:
    from db.druid.query_builder import GroupByQueryBuilder

# Strip off any filters around the aggregation and return just
# the base aggregation
def extract_aggregation(aggregation):
    if aggregation['type'] == 'filtered':
        return extract_aggregation(aggregation['aggregator'])

    # If we have reached the base aggregation, return it.
    return aggregation


# The inner groupby will handle filtering and extracting the original
# aggregation into its own field. The outer groupby just needs to
# calculate off the metric created by the inner groupby.
def rewrite_aggregation(name, aggregation):
    base_aggregation = dict(extract_aggregation(aggregation))

    # The count aggregation will be taken care of by the inner groupby. To
    # calculate the correct count, we need to sum the inner counts.
    if base_aggregation['type'] == 'count':
        base_aggregation['type'] = 'longSum'

    # Since we query druid by creating filtered aggregations, the inner
    # groupby will output metrics keyed on this filtered aggregation. This
    # means the original field referenced by the aggregation won't exist in
    # the inner query, but the filtered version will. Use that name instead.
    base_aggregation['fieldName'] = name
    return base_aggregation


# Using the original aggregations requested, create a valid set of aggregations
# that will properly calculate the same value using the fields returned by the
# nested groupby.
def build_outer_aggregations(original_aggregations):
    # Build a set of aggregations that will pass the `build_aggregation`
    # pydruid step during query building.
    aggregations = {}
    for name, aggregation in original_aggregations.items():
        aggregations[name] = rewrite_aggregation(name, aggregation)

    return aggregations


class ExactUniqueCountAggregation(QueryModifyingAggregation):
    def __init__(self, dimension, name, count_filter=None, exclude_missing=True):
        self.dimension = dimension
        self.exclude_missing = exclude_missing
        self.name = name
        self.count_filter = count_filter or EmptyFilter()

        # If requested, prevent empty dimension values from being counted
        if exclude_missing:
            self.count_filter &= ~Filter(dimension=self.dimension, value='')

        self.calculation = _HelperCalculation(self.name, self.count_filter)
        super(ExactUniqueCountAggregation, self).__init__()

    # To compute exact unique count, we must convert a groupby query into a
    # nested groupby query.
    def modify_query(self, query: 'GroupByQueryBuilder'):
        # Build the inner groupby query and use it as the datasource for
        # the original query
        query.datasource = self.build_inner_groupby(query)

        # Clear the existing query filter because it will be handled by the
        # inner groupby
        query.query_filter = None

        # Grab the original aggregations and use them to set up the outer
        # query's aggregations
        query.aggregations = build_outer_aggregations(query.aggregations)

        # Copy in our outer aggregations
        query.aggregations.update(self.calculation.outer_aggregations)

    # This aggregation type supports multiple ExactUniqueCountAggregations at
    # the same time, given some conditions are met. When a second
    # ExactUniqueCountAggregation is encountered during a query, it can be
    # merged into this one to produce a new aggregation to use.
    def merge_compatible_aggregation(self, aggregation):
        assert isinstance(
            aggregation, ExactUniqueCountAggregation
        ), 'Cannot add additional modifying aggregation. Invalid type: %s' % (
            type(aggregation)
        )
        assert aggregation.dimension == self.dimension, (
            'Cannot add additional modifying aggregations. Uniqueness '
            'dimension does not match. Original %s\tNew: %s'
            % (self.dimension, aggregation.dimension)
        )

        # NOTE(stephen): Aggregations are supposed to be standalone, and the
        # original instance should be reusable. Since additional state needs to
        # be stored with this aggregation, we should return a clone when merging
        # in new aggregations.
        clone = deepcopy(self)
        clone.calculation.merge_calculation(aggregation.calculation)
        return clone

    # Create an inner groupby query that is identical to the original query
    # just with the addition of the dimension we want to count uniqueness of
    def build_inner_groupby(self, query):
        # Create a deep copy of our query. Surprisingly, this works perfectly.
        # GroupByQueryBuilder is at its heart a dictionary, and the only objects
        # it stores are Filter objects which are simple enough that they can
        # be copied
        new_query = deepcopy(query)

        # Add in the dimension we want to count
        new_query.dimensions.append(self.dimension)

        # Only include dimension filters. Field filters will be handled
        # by filtered aggregations and should be removed.
        new_query.query_filter = new_query.dimension_filter

        # Copy in our aggregations
        new_query.aggregations.update(self.calculation.aggregations)

        # Only use our post aggregations in the inner groupby. All other post
        # aggregations will be calculated like normal in the outer query.
        new_query.post_aggregations = self.calculation.post_aggregations

        # We ARE the query modifier. Clear the one that was copied over
        new_query.query_modifier = None

        # Prepare the query and capture the druid query representation
        raw_query = new_query.prepare().query_dict

        # Return a query datasource object using our prepared query
        return {'type': 'query', 'query': raw_query}


# This calculation will set up the necessary aggregations and post aggregations
# that will be used by the inner groupby to correctly calculate the different
# types of unique counts we support. This calculation also builds an
# "outer aggregation" that will be used on the outer groupby to produce the
# final unique count result.
class _HelperCalculation(BaseCalculation):
    SUFFIX = '_for_exact_unique_count'

    def __init__(self, name, count_filter=None):
        super(_HelperCalculation, self).__init__()
        self.outer_aggregations = {}
        # If the unique aggregation should count *all* of the unique values,
        # we can just use a simple "count" on the outer groupby
        if not count_filter or isinstance(count_filter, EmptyFilter):
            self.outer_aggregations[name] = count('count')
        else:
            # If the unique aggregation should only count unique values when
            # they meet a specific criteria, then we need to do more work.
            # Conceptually, to include a row if it meets a specific filter, we
            # would store a 1 for that row and sum the new column in the outer
            # groupby. Unfortunately, druid does not provide an aggregator that
            # returns a constant, so we must use a post aggregator on the inner
            # groupby to convert the value into a constant 1.

            # Choose an aggregation that is guaranteed to not be 0
            inner_agg = filtered_aggregator(filter=count_filter, agg=count('count'))
            inner_agg_key = '%s%s_agg' % (name, self.SUFFIX)
            self.add_aggregation(inner_agg_key, inner_agg)

            # Divide the value by itself during post aggregation so that the
            # inner groupby returns a 1 or 0 for this row
            const_formula = '%s / %s' % (inner_agg_key, inner_agg_key)
            post_agg_key = '%s%s_post_agg' % (name, self.SUFFIX)
            self.add_post_aggregation_from_formula(post_agg_key, const_formula)

            # Sum the constant column in the outer groupby to get the exact
            # unique count for a filtered set
            self.outer_aggregations[name] = longsum(post_agg_key)

    # Merge other calculations supplied by ExactUniqueCountAggregation
    # into this calculation.
    def merge_calculation(self, other_calculation):
        assert isinstance(other_calculation, _HelperCalculation), (
            'Cannot merge additional exact unique calculation in. '
            'Invalid type: %s' % type(other_calculation)
        )

        # Merge in the inner aggregations and post aggregations
        self.add_aggregations(other_calculation.aggregations)
        self.add_post_aggregations(other_calculation.post_aggregations)

        # Copy over the outer aggregations
        for key, value in other_calculation.outer_aggregations.items():
            if key not in self.outer_aggregations:
                self.outer_aggregations[key] = value
            else:
                assert value == self.outer_aggregations[key], (
                    'Attempting to overwrite existing outer aggregation '
                    'for key: %s' % key
                )
