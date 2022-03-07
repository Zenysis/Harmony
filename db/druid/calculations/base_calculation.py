from collections import OrderedDict

from pydruid.utils.aggregators import filtered as filtered_aggregator, longsum
from toposort import toposort_flatten

from db.druid.post_aggregation_builder import build_expression_post_aggregator
from db.druid.util import (
    EmptyFilter,
    build_filter_from_aggregation,
    build_query_filter_from_aggregations,
    extract_aggregations_for_post_aggregation,
    get_post_aggregation_fields,
)


class BaseCalculation:
    COUNT_SUFFIX = '__count'

    def __init__(
        self, aggregations=None, post_aggregations=None, strict_null_fields=None
    ):
        self._aggregations = {}
        # NOTE: We are using an OrderedDict here as a workaround for an
        # annoying ordering requirement of druid for post aggregations that
        # reference other post aggregations.
        # TODO(stephen): Occasionally check and see if druid has added
        # post aggregation dependency resolution. Or add it yourself.
        self._post_aggregations = OrderedDict()

        # These fields should be considered "null" if the corresponding count
        # is zero.
        self._strict_null_fields = set()

        self.add_aggregations(aggregations)
        self.add_post_aggregations(post_aggregations)
        self.set_strict_null_fields(strict_null_fields)

    @property
    def aggregations(self):
        return self._aggregations

    @property
    def post_aggregations(self):
        return self._post_aggregations

    @property
    def strict_null_fields(self):
        return self._strict_null_fields

    def add_aggregation(self, key, aggregation):
        if key in self._aggregations:
            assert aggregation == self._aggregations[key], (
                'Attempting to overwrite existing aggregation for key: %s' % key
            )
            return
        self._aggregations[key] = aggregation

    def add_aggregations(self, aggregations):
        if not aggregations:
            return

        for key, aggregation in aggregations.items():
            self.add_aggregation(key, aggregation)

    # Since post aggregations can reference other post aggregations (unlike
    # normal aggregations) validation needs to happen when multiple
    # post aggregations are passed in
    def add_post_aggregation(self, key, post_aggregation):
        self.add_post_aggregations({key: post_aggregation})

    def add_post_aggregations(self, post_aggregations):
        if not post_aggregations:
            return

        dep_graph = {}
        for key, post_aggregation in post_aggregations.items():
            if key in self._post_aggregations:
                assert post_aggregation == self._post_aggregations[key], (
                    'Attempting to overwrite existing post aggregation '
                    'for key: %s' % key
                )
                return

            # Check if this post aggregation is computable. Check if the
            # fields it needs are already covered in an aggregation or if they
            # are computed via a post aggregation (either existing or new).
            # If the any fields are computed by a different new post
            # aggregation, make sure those are added to the post agregation
            # ordered dict first
            try:
                fields_accessed = get_post_aggregation_fields(post_aggregation)
            except:
                print(key, post_aggregation)
                raise

            dependencies = set()
            for field in fields_accessed:
                # Check if calculation for required field has already been made
                if field in self.aggregations or field in self.post_aggregations:
                    continue

                # If the field has not yet been calculated and is not slated
                # to be calculated with the new post aggregations passed in,
                # throw an error
                assert field in post_aggregations, (
                    'Post aggregation references field that has not been'
                    'computed. Field: %s\tPost Aggregation: %s' % (field, key)
                )
                dependencies.add(field)

            # If there are no dependencies on new post aggregations,
            # we can safely add it.
            if not dependencies:
                self._post_aggregations[key] = post_aggregation
            else:
                dep_graph[key] = dependencies

        if not dep_graph:
            return

        # Topologically sort the new post aggregations so that we add
        # in the correct order for evaluation
        post_agg_order = toposort_flatten(dep_graph)
        for key in post_agg_order:
            self._post_aggregations[key] = post_aggregations[key]

    # pylint: disable=C0103
    def add_post_aggregation_from_formula(self, key, formula):
        post_aggregation = build_expression_post_aggregator(formula)
        self.add_post_aggregation(key, post_aggregation)

    # Add a count aggregator to determine how many rows were needed to compute
    # the value for the supplied field. Works for both aggregations and post
    # aggregations.
    # TODO(stephen): How do query dependent aggregations work here?
    def add_count_for_field(self, field):
        assert field in self.aggregations or field in self.post_aggregations, (
            'Cannot add count for field that does not exist: %s' % field
        )

        agg_filter = None
        if field in self.aggregations:
            agg_filter = build_filter_from_aggregation(self.aggregations[field])
        else:
            # Collect the aggregations that produce the post-aggregations value.
            aggregations = extract_aggregations_for_post_aggregation(
                field, self.aggregations, self.post_aggregations
            )
            agg_filter = build_query_filter_from_aggregations(aggregations)

        # Count the number of rows that stream through the aggregations computed
        # for this field.
        count_agg = longsum('count')

        # If an aggregation filter exists, use it to limit the count.
        if agg_filter is not None and not isinstance(agg_filter, EmptyFilter):
            count_agg = filtered_aggregator(filter=agg_filter, agg=count_agg)

        key = self.count_field_name(field)
        self.add_aggregation(key, count_agg)

    def add_count_for_fields(self, fields):
        for field in fields:
            self.add_count_for_field(field)

    # Mark the specified fields as "strict" so that they will receive a true
    # null value if their count is zero instead of a default of 0.
    def set_strict_null_fields(self, fields):
        if not fields:
            self._strict_null_fields = set()
            return

        missing_fields = set()
        for field in fields:
            if field not in self.aggregations and field not in self.post_aggregations:
                missing_fields.add(field)
            else:
                self._strict_null_fields.add(field)

        assert not missing_fields, (
            'Cannot apply strict null treatment to fields not being '
            'calculated. Invalid fields: %s' % missing_fields
        )

    @classmethod
    def count_field_name(cls, field):
        return '%s%s' % (field, cls.COUNT_SUFFIX)
