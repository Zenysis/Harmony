from copy import deepcopy

from pydruid.utils.aggregators import filtered as filtered_aggregator
from pydruid.utils.postaggregator import Field

from db.druid.aggregations.time_interval_aggregation import TimeIntervalAggregation
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.post_aggregation_builder import rename_post_aggregator
from db.druid.util import build_filter_from_aggregation


class ComplexCalculation(BaseCalculation):
    '''A complex calculation is an AQT specific calculation type that wraps a
    BaseCalculation and extends its capabilities for AQT.
    '''

    def __init__(
        self,
        aggregations=None,
        post_aggregations=None,
        strict_null_fields=None,
        query_filter=None,
        suffix='',
    ):
        self._suffix = suffix
        aggregations = self._create_aggregations(aggregations, query_filter)
        post_aggregations = self._create_post_aggregations(post_aggregations)
        strict_null_fields = (
            set(self.create_id(field) for field in self.strict_null_fields)
            if strict_null_fields
            else None
        )

        super(ComplexCalculation, self).__init__(
            aggregations, post_aggregations, strict_null_fields
        )

    def _create_aggregations(self, aggregations, query_filter):
        output = {}
        for agg_id, agg in aggregations.items():
            # NOTE(stephen): Need to deepcopy the aggregation since there is
            # caching of aggregations that happens that we cannot see here. To
            # be safe and prevent conflicts when pydruid builds aggregations
            # to query, we clone the aggregation fully.
            output[self.create_id(agg_id)] = self._add_filter_to_aggregation(
                deepcopy(agg), query_filter
            )
        return output

    def _create_post_aggregations(self, post_aggregations):
        # We can skip modification of the post aggregations if the IDs will not
        # change.
        # NOTE(stephen): Would it be safer to copy them still?
        if not self._suffix:
            return post_aggregations

        # Change the post aggregation IDs to include the suffix and update any
        # fields referenced by those post aggregations to include the suffix.
        output = {}
        for post_agg_id, post_agg in post_aggregations.items():
            # NOTE(stephen): Need to deepcopy the post aggregation as well since
            # we cannot be sure what references have been made to the original
            # structure and renaming occurs in-place.
            new_post_agg = deepcopy(post_agg)

            # NOTE(stephen): There is an implicit dependency here with how this
            # class attaches a suffix and how the rename_post_aggregator method
            # attaches a suffix.
            rename_post_aggregator(new_post_agg, self._suffix)
            output[self.create_id(post_agg_id)] = new_post_agg
        return output

    # Add a single filter to the provided aggregation.
    # NOTE(stephen): There may be issues with this in the future if called
    # against a cached calculation since it modifies its own aggregations.
    def _add_filter_to_aggregation(self, aggregation, query_filter):
        if not query_filter:
            return aggregation

        # Time interval aggregations are special and store an internal filter.
        if isinstance(aggregation, TimeIntervalAggregation):
            aggregation.initial_filter &= query_filter
            return aggregation

        # Construct a new filtered aggregation with our extra filter added.
        new_aggregation = aggregation

        # HACK(stephen): Copy the new query_filter each time since pydruid is a
        # garbage library. When filters are built by the `filtered_aggregator`
        # below, the *original* filter is mutated. This will cause weird errors
        # when the same filter is used across multiple filtered aggregators (
        # which is what we are doing here).
        new_filter = deepcopy(query_filter)
        current_agg_filter = build_filter_from_aggregation(aggregation)

        # This aggregation is a filtered aggregation already. Merge in its
        # filter.
        if current_agg_filter:
            new_filter &= current_agg_filter
            new_aggregation = aggregation['aggregator']
        return filtered_aggregator(filter=new_filter, agg=new_aggregation)

    def create_id(self, orig_id):
        return '%s%s' % (orig_id, self._suffix)

    @classmethod
    def create_from_calculation(
        cls, calculation, new_id=None, original_id=None, query_filter=None
    ):
        suffix = new_id
        if new_id.startswith(original_id):
            suffix = new_id.replace(original_id, '')
        if suffix and not suffix.startswith('_'):
            suffix = '_%s' % suffix

        output = cls(
            aggregations=calculation.aggregations,
            post_aggregations=calculation.post_aggregations,
            query_filter=query_filter,
            suffix=suffix,
        )

        # The ID will exist in the aggregations already if the previous
        # calculation contained only one aggregation and the suffix will convert
        # the original id into the new id exactly. The ID will exist in the post
        # aggregations only if a suffix has been applied and the value was
        # previously a post aggregation. This is because the modification of the
        # underlying aggregations / post aggregations already handled the ID
        # remap.
        if new_id not in output.aggregations and new_id not in output.post_aggregations:
            output.add_post_aggregation(new_id, Field(output.create_id(original_id)))
        return output
