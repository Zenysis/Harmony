# Create mock values for the various models that power the Query Tool. For now,
# use the the ET indicator definitions as the base to make development easier.
from collections import OrderedDict, defaultdict
import datetime

from slugify import slugify
from toposort import toposort_flatten

from config.druid_base import FIELD_NAME
from data.query.models import (
    Dataset,
    Dimension,
    DimensionValue,
    Field,
    FieldMetadata,
    LinkedCategory,
)
from data.query.models.granularity import Granularity, GranularityExtraction
from data.query.models.calculation import (
    AverageCalculation,
    AverageOverTimeCalculation,
    ComplexCalculation,
    CountDistinctCalculation,
    LastValueCalculation,
    MaxCalculation,
    SumCalculation,
)
from data.query.models.query_filter import (
    AndFilter,
    FieldFilter,
    FieldInFilter,
    IntervalFilter,
    OrFilter,
    SelectorFilter,
)
from db.druid.query_client import DruidQueryClient
from db.druid.calculations.simple_calculation import (
    AverageCalculation as DruidAverageCalculation,
    AverageOverTimeBucketCalculation as DruidAverageOverTimeCalculation,
    LastValueCalculation as DruidLastValueCalculation,
)
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation


class QueryData:
    # TODO(stephen) - Add comments for all these attributes.
    def __init__(self):
        self.categories = OrderedDict()
        self.datasets = []
        self.fields = []
        self.field_metadata = []
        self.id_to_fields = {}
        self.id_to_field_metadata = {}
        self.dimensions = []
        self.dimension_values = []
        self.linked_categories = []
        self.granularities = []
        # pylint: disable=C0103
        self.calculated_fields_to_constituent_map = {}


def _convert_druid_field_filter(agg_filter):
    '''Convert a Druid filter into a QueryFilter type if possible.'''
    # NOTE(stephen): Right now only support filtered aggregators that filter
    # over the field dimension.
    if agg_filter.get('dimension') != FIELD_NAME:
        return None

    agg_filter_type = agg_filter['type']
    if agg_filter_type == 'selector':
        return FieldFilter(agg_filter['value'])
    if agg_filter_type == 'in':
        return FieldInFilter(agg_filter['values'])
    # Non-simple filter type that we cannot construct right now.
    return None


def _create_simple_calculation(raw_calculation):
    '''Convert the raw druid calculation into a simple mathematical calculation
    (like SumCalculation or MaxCalculation) if possible

    NOTE(stephen): This method has a very simplified view of what calculation
    types are eligible to be converted to a simple calculation (currently just
    SumCalculation or MaxCalculation). This will be expanded in the future.
    '''
    # If there are post aggregations, this calculation cannot be converted into
    # a sum calculation.
    if not raw_calculation or raw_calculation.post_aggregations:
        return None

    # Only one aggregation should be calculated.
    if len(raw_calculation.aggregations) != 1:
        return None

    # The single aggregation being computed must be a filtered aggregator whose
    # inner aggregator is summing.
    agg = list(raw_calculation.aggregations.values())[0]
    if not isinstance(agg, dict) or agg['type'] != 'filtered':
        return None

    aggregator_type = agg['aggregator']['type']
    if aggregator_type not in ('doubleSum', 'doubleMax'):
        return None

    # If we cannot convert the aggregation filter into a FieldFilter type then
    # we can't continue.
    calc_filter = _convert_druid_field_filter(agg['filter'])
    if not calc_filter:
        return None

    if aggregator_type == 'doubleSum':
        return SumCalculation(calc_filter)
    if aggregator_type == 'doubleMax':
        return MaxCalculation(calc_filter)
    return None


def _create_count_distinct_calculation(raw_calculation):
    '''Convert the raw druid calculation into a CountDistinctCalculation if
    possible.
    '''
    if not isinstance(raw_calculation, ThetaSketchUniqueCountCalculation):
        return None

    # There should only be one aggregation.
    if len(raw_calculation.aggregations) != 1:
        return None

    agg = list(raw_calculation.aggregations.values())[0]
    calc_filter = None
    inner_agg = agg
    if agg['type'] == 'filtered':
        # If we can't convert the agg filter then we can't create the
        # new calculation.
        calc_filter = _convert_druid_field_filter(agg['filter'])
        if not calc_filter:
            return None
        inner_agg = agg['aggregator']

    # The inner aggregation must be a theta sketch (or the outer aggregation if
    # it is not filtered).
    if inner_agg['type'] != 'thetaSketch':
        return None

    # Try to associate the dimension the theta sketch is operating over with a
    # Dimension instance we have already built. If none exists, it means we are
    # likely operating on a dimension that has not been exposed to the query
    # tool yet.
    dimension_id = inner_agg['fieldName']
    if not dimension_id:
        return None
    return CountDistinctCalculation(dimension=dimension_id, filter=calc_filter)


def build_single_calculation(ind_id, raw_calculation):
    # Some field calculations we can construct right now! SUM is simple
    # and is the dominant calculation type.
    simple_calculation = _create_simple_calculation(raw_calculation)
    if simple_calculation:
        return simple_calculation

    # Check for slightly more complicated calculation types.
    if isinstance(raw_calculation, DruidAverageCalculation):
        raw_filter = raw_calculation.aggregations[raw_calculation.sum_key]['filter']
        return AverageCalculation(filter=_convert_druid_field_filter(raw_filter))

    if isinstance(raw_calculation, DruidAverageOverTimeCalculation):
        raw_filter = raw_calculation.aggregations[raw_calculation.sum_key]['filter']
        return AverageOverTimeCalculation(
            filter=_convert_druid_field_filter(raw_filter)
        )

    if isinstance(raw_calculation, DruidLastValueCalculation):
        raw_filter = raw_calculation.aggregations[raw_calculation.key]['filter']
        return LastValueCalculation(filter=_convert_druid_field_filter(raw_filter))

    # COUNT DISTINCT can also be built.
    count_distinct_calculation = _create_count_distinct_calculation(raw_calculation)
    if count_distinct_calculation:
        return count_distinct_calculation

    # Default to a complex calculation for all calculation types that
    # cannot currently be represented.
    return ComplexCalculation(calculation_id=ind_id)


def build_calculation(ind_id, calculations_for_field):
    raw_calculation = calculations_for_field.get(ind_id)
    return build_single_calculation(ind_id, raw_calculation)


def get_category_id(category_name, prefix=''):
    '''
    Create a stable ID based on the category name and optional prefix.
    '''
    return slugify('%s %s' % (prefix, category_name))


def _get_short_name(child_name, parent_name):
    # Ensure we never process input with trailing spaces. This can mess up the
    # short name creation algorithm.
    child_name_clean = child_name.strip()
    parent_name_clean = parent_name.strip()
    if (
        child_name_clean.startswith(parent_name_clean)
        and child_name_clean != parent_name_clean
    ):
        return (child_name_clean.replace(parent_name_clean, '').strip(), True)
    return (child_name_clean, False)


def get_short_name(child, category):
    '''Produce a shortened display name for the supplied LinkedCategory.'''
    # There are cases where we want to manually shorten the name, even if
    # a given short name exists. For example, 'Number of slides or RDT positive
    # for malaria < 5 years: Males' can be shortened to '< 5 years: Males',
    # because it will exist under the parent category 'Number of slides or RDT
    # positive for malaria'. Traverse through the category's parents to
    # determine if we can shorten the name. Sometimes the parent name is
    # already shortened, so attempt to create a full version of the parent name.
    output_name = child['text']
    parent_name = ''
    cur_category = category
    while cur_category:
        parent_name = (
            '%s %s' % (cur_category.name.strip(), parent_name.strip())
        ).strip()
        (short_name, success) = _get_short_name(output_name, parent_name)
        if success:
            output_name = short_name
            break
        cur_category = cur_category.parent

    # If a given short name already exists, we want to return the shorter of
    # the two names.
    original_short_name = child.get('short_text')
    if original_short_name and len(original_short_name) < len(output_name):
        return original_short_name

    return output_name


def get_ordered_indicators(indicators):
    # Build a dependency graph showing a link from an individual indicator to
    # the composite children indicators it uses to calculate.
    dep_graph = {}
    ind_map = {}
    for indicator in indicators:
        ind_id = indicator['id']
        ind_map[ind_id] = indicator
        dep_graph[ind_id] = set(
            indicator.get('children', indicator.get('constituents', []))
        )

    # Flatten the dependencies and reverse it to produce a list ordered from
    # parent to child indicator ID.
    processing_order = toposort_flatten(dep_graph)[::-1]
    result = []
    for ind_id in processing_order:
        if ind_id in ind_map:
            result.append(ind_map[ind_id])
    return result


# For each indicator group, build the unique set of linked categories that
# are needed to represent the group's indicator hierarchy. Build a mapping from
# each indicator ID to the LinkedCategory it should be stored under.
# Return:
# (group, indicator ID to LinkedCategory map, category id to LinkedCategory map)


def build_group_data(datasource, datasource_root):
    output = []
    groups = datasource['groups']
    datasource_id = datasource_root.id if datasource_root else ''

    for group in groups:
        graph = {}
        categories = OrderedDict()
        group_id = group['groupId']
        group_datasource_id = get_category_id(group_id, datasource_id)
        group_root = LinkedCategory(
            id=group_datasource_id, name=group['groupText'], parent=datasource_root
        )

        categories[group_datasource_id] = group_root

        ordered_indicators = get_ordered_indicators(group['indicators'])
        # Only include sub areas if there is more than one. Otherwise, flatten
        # to the parent category.
        num_sub_areas = len(set(ind.get('sub_area') for ind in ordered_indicators))

        include_sub_areas = num_sub_areas > 1
        for indicator in ordered_indicators:
            # Collect all the sub categories that exist for this group and use
            # them as a parent category of indicators.
            sub_area = indicator.get('sub_area')
            sub_area_id = (
                get_category_id(sub_area, group_datasource_id)
                if sub_area and include_sub_areas
                else None
            )
            if sub_area_id and sub_area_id not in graph:
                categories[sub_area_id] = LinkedCategory(
                    id=sub_area_id, name=sub_area, parent=group_root
                )

            ind_id = indicator['id']
            children = indicator.get('children', [])
            constituents = indicator.get('constituents', [])
            # If this indicator has already been linked to a parent indicator
            # (like it is a child of a parent composite), use that parent
            # category.
            if ind_id in graph:
                parent = graph[ind_id]
            elif sub_area_id:
                # Prefer sub area parent over the group root
                parent = categories[sub_area_id]
            else:
                # Last option is to attach this indicator to the group root.
                parent = group_root

            # If this indicator has child elements, we want to add a parent
            # category for it and store all children within.
            if children and not indicator.get('disable_children_nesting'):
                indicator_text = indicator['text']
                category_id = get_category_id(indicator_text, group_datasource_id)
                category_name = get_short_name(indicator, parent)
                parent = LinkedCategory(
                    id=category_id, name=category_name, parent=parent
                )
                categories[category_id] = parent

            # Store a mapping from this indicator ID to the parent category it
            # should be contained within.
            graph[ind_id] = parent

            # Store all children within the same parent category.
            for child in [*children, *constituents]:
                graph[child] = parent

        # Store the indicator category mapping and the new categories built.
        output.append((group, graph, categories))

    return output


def build_dimensions(categories, dimension_categories):
    output_dimensions = []
    for category_name, dimensions in dimension_categories:
        category_id = 'dimension_category_%s' % slugify(category_name)
        category = LinkedCategory(id=category_id, name=category_name)
        categories[category_id] = category
        for dimension in dimensions:
            output_dimensions.append(Dimension(dimension, category=category))
            categories[dimension] = LinkedCategory(dimension, parent=category)
    return output_dimensions


def build_fields(
    datasets,
    categories,
    data_sources,
    calculations_for_field,
    dimensions,
    field_metadata,
    field_to_constituents_map,
    raw_field_query_metadata,
):
    fields = []
    raw_fields = []
    field_category_dataset_map = {}
    dimension_map = {dimension.id: dimension for dimension in dimensions}

    # Memoize the dimensions needed for a given field ID.
    raw_field_dimension_map = {}

    # Set of indicator IDs that should use the full indicator name as the short name.
    required_full_name_indicators = set()

    for datasource in data_sources:
        datasource_id = datasource['id']
        datasource_name = datasource['name']
        datasource_groups = datasource['groups']
        group_dataset = Dataset(datasource_id, datasource_name)
        datasets.append(group_dataset)

        # If more than one group exists for this dataset, store its groups under
        # a datasource root node. Otherwise, store the single group at the top
        # level.
        datasource_root = None
        if len(datasource_groups) > 1:
            datasource_root = LinkedCategory(datasource_id, name=datasource_name)
            categories[datasource_id] = datasource_root

        # Collect all the indicators so we can topologically sort them before building
        # out the full Field model.
        # NOTE(stephen): Need to collect all indicators across all groups since some
        # indicators can have children that are in different groups.
        # TODO(stephen): Does this break assumptions in the hierarchical selector?
        group_data = build_group_data(datasource, datasource_root)
        for (group, indicator_category_map, group_categories) in group_data:
            # Add in this group's categories.
            group_id = group['groupId']
            assert group_id not in categories, 'Duplicate groupid: %s' % group_id
            categories.update(group_categories)

            # HACK(stephen): Allow users of the legacy config to specify at the group
            # level whether indicators within that group should have their name
            # automatically shortened when possible.
            disable_short_name = group.get('disableShortName')

            # Collect this group's raw indicators so they can be converted into full
            # Field models.
            for indicator in group['indicators']:
                if indicator.get('hide'):
                    continue
                ind_id = indicator['id']
                raw_fields.append(indicator)
                field_category_dataset_map[ind_id] = (
                    indicator_category_map[ind_id],
                    group_dataset,
                )
                if disable_short_name:
                    required_full_name_indicators.add(ind_id)

    # Order the indicators from child -> parent so that all dependent Fields will be
    # built before they are dependend on.
    # NOTE(stephen): Reversing the ordered indicators because it comes back sorted from
    # parent to child. We want sorting from child to parent.
    fields_map = {}
    field_metadata_map = {}
    for indicator in reversed(get_ordered_indicators(raw_fields)):
        # Since the indicators are topologically sorted, we can safely access the
        # fully built child constituents.
        constituents = [
            fields_map[ind_id]
            for ind_id in indicator.get('children', indicator.get('constituents', []))
            if ind_id in fields_map
        ]
        # Build the full field based off the original indicator definition.
        ind_id = indicator['id']
        ind_text = indicator['text']
        (category, dataset) = field_category_dataset_map[ind_id]
        calculation = build_calculation(ind_id, calculations_for_field)
        metadata_dimensions = [*raw_field_dimension_map.get(ind_id, [])]

        # Add the list of dimensions that this field can use when grouping / filtering.
        if raw_field_query_metadata and not metadata_dimensions:
            metadata_dimensions_set = set()
            for constituent_id in field_to_constituents_map.get(ind_id, [ind_id]):
                if constituent_id not in raw_field_dimension_map:
                    dimension_ids = raw_field_query_metadata.get(
                        constituent_id, {}
                    ).get('dimensions', [])
                    raw_field_dimension_map[constituent_id] = [
                        dimension_map[dim_id] for dim_id in dimension_ids
                    ]
                metadata_dimensions_set.update(raw_field_dimension_map[constituent_id])
            raw_field_dimension_map[ind_id] = list(metadata_dimensions_set)

        short_name = (
            get_short_name(indicator, category)
            if ind_id not in required_full_name_indicators
            else ind_text
        )
        description = indicator.get('description', '')
        # TODO(nina, stephen): Populate dimensions argument with actual values
        metadata = FieldMetadata(
            ind_id, category, constituents, description, metadata_dimensions, dataset
        )
        fields_map[ind_id] = Field(ind_id, calculation, ind_text, short_name)
        field_metadata_map[ind_id] = metadata

    # Ensure fields are ordered based on their original definition order.
    # Our topological sort changes the order in which we process them.
    for raw_field in raw_fields:
        fields.append(fields_map[raw_field['id']])
        field_metadata.append(field_metadata_map[raw_field['id']])
    return fields


def build_dimension_values(
    dimensions, raw_dimension_values, dimension_parents, dimension_categories
):
    output = []
    # Build a mapping from dimension ID to full dimension object for convenient
    # lookups.
    dimension_map = {dimension.id: dimension for dimension in dimensions}

    # Use a serial ID number as the dimension's value ID until we can replace it
    # with an actual ID in the DB.
    count = 0

    # Build filters for each dimension level in location granularity order.
    for dim_id in dimension_map:
        # Skip nation for now.
        if dim_id == 'nation':
            continue
        if 'dates' in dimension_categories and dim_id in dimension_categories['dates']:
            end_date = datetime.datetime.now()
            start_date = end_date - datetime.timedelta(days=2 * 365)
            value_filter = IntervalFilter(start_date, end_date)
            output.append(DimensionValue(dim_id, dim_id, value_filter, dim_id))

        for dimension_data in raw_dimension_values.get(dim_id, []):
            name = dimension_data[dim_id]
            # Skip nation for now.
            if name == 'Nation':
                continue
            value_filter = SelectorFilter(dim_id, name)
            subtitle = ''
            # If this is not the first geo level, we need to AND the parent
            # values together to produce the full value filter.
            if dim_id in dimension_parents:
                filters = [value_filter]
                subtitle_pieces = []
                for parent_dim_id in dimension_parents[dim_id]:
                    # Force None to be an empty string since Dimension = '' in
                    # druid is the same as a null check.
                    dim_value = dimension_data.get(parent_dim_id) or ''
                    filters.append(SelectorFilter(parent_dim_id, dim_value))
                    # Make single zone regions a little prettier.
                    if dim_value not in subtitle_pieces and dim_value:
                        subtitle_pieces.append(dim_value)

                value_filter = AndFilter(filters)

                # HACK(stephen): Build a subtitle for the geo dimensions so that
                # it is easier to see the parent locations on the frontend UI.
                subtitle = ', '.join(subtitle_pieces)

            value_id = '%s_%s' % (dim_id, count)
            count += 1
            output.append(
                DimensionValue(value_id, dim_id, value_filter, name, subtitle=subtitle)
            )
    return output


def build_granularities(categories, calendar_settings):
    '''Build a list of possible granularities a user can query by.'''
    # HACK(stephen): Rely on the granularity ID to determine if it is a standard
    # granularity or an extraction granularity.
    date_group_category = LinkedCategory(id='date_groups', name='Date Group')
    extraction_category = LinkedCategory(id='date_extraction', name='Date Extraction')
    categories[date_group_category.id] = date_group_category
    categories[extraction_category.id] = extraction_category
    return [
        Granularity(option.id.value, option.name, date_group_category)
        if not option.id.value.endswith('_of_year')
        else GranularityExtraction(option.id.value, option.name, extraction_category)
        for option in calendar_settings.granularity_settings.values()
    ]


# pylint: disable=W0102
def get_base_constituent_fields(field_id, field_to_constituents_map, cache={}):
    '''Returns a set of raw, integrated fields from a field_id. Optionally pass
    in a cache that can be reused multiple calls of this function.
    '''
    if field_id in cache:
        return cache[field_id]

    field_ids_to_extract = field_to_constituents_map.get(field_id)
    # If no constituents, it's a base field
    if not field_ids_to_extract:
        cache[field_id] = set([field_id])
        return set([field_id])

    extracted_fields = set()
    for id_to_inspect in field_ids_to_extract:
        results = get_base_constituent_fields(
            id_to_inspect, field_to_constituents_map, cache
        )

        extracted_fields.update(results)

    cache[field_id] = extracted_fields
    return extracted_fields


def calculated_field_constituent_cache(field_list, calculated_indicator_constituents):
    field_to_constituent_cache = {}
    for field in field_list:
        get_base_constituent_fields(
            field.id, calculated_indicator_constituents, field_to_constituent_cache
        )

    return field_to_constituent_cache


def generate_query_mock_data(
    dimension_values,
    data_sources,
    dimension_parents,
    dimension_categories,
    calendar_settings,
    calculations_for_field,
    calculated_indicator_constituents,
    dimension_id_map,
    dimension_sketch_sizes,
    raw_field_query_metadata=None,
):
    query_data = QueryData()
    query_data.dimensions = build_dimensions(
        query_data.categories, dimension_categories
    )
    query_data.fields = build_fields(
        query_data.datasets,
        query_data.categories,
        data_sources,
        calculations_for_field,
        query_data.dimensions,
        query_data.field_metadata,
        calculated_indicator_constituents,
        raw_field_query_metadata or {},
    )
    query_data.id_to_fields = {f.id: f for f in query_data.fields}
    query_data.id_to_field_metadata = {f.id: f for f in query_data.field_metadata}
    query_data.dimension_values = build_dimension_values(
        query_data.dimensions, dimension_values, dimension_parents, dimension_categories
    )
    query_data.granularities = build_granularities(
        query_data.categories, calendar_settings
    )
    query_data.linked_categories = list(query_data.categories.values())
    query_data.calculated_fields_to_constituent_map = (
        calculated_field_constituent_cache(
            query_data.fields, calculated_indicator_constituents
        )
    )
    # HACK(stephen): Inject runtime information into the
    # CountDistinctCalculation to improve accuracy and performance.
    CountDistinctCalculation.inject_theta_sketch_size_hint(dimension_sketch_sizes)
    CountDistinctCalculation.inject_theta_sketch_dimension_id_map(dimension_id_map)
    return query_data
