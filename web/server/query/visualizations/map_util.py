def build_admin_boundary_restriction(query_filter, geo_field_ordering):
    '''Extract all location filters from the query filter so that the MapViz can use
    them to filter the admin boundaries when the query result is shown.

    NOTE(stephen): This is kind of a hack. It was just a somewhat cleaner way to
    implement this logic without having to introduce a bunch of new code to the
    frontend.
    '''

    # HACK(stephen): Take advantage of the knowledge that AQT cannot produce arbitrarily
    # complex filters right now. The filter can be the following forms:
    # - SelectorFilter: A user has selected only a single dimension filter AND the
    #                   dimension is the least granular geo dimension (or a non-geo
    #                   dimension).
    # - AndFilter<SelectorFilter>: A user has selected a geo dimension filter that is
    #                              not the least granular. Or they have selected
    #                              multiple top level dimension filters.
    # - OrFilter<SelectorFilter | AndFilter<SelectorFilter>>
    #   A user has selected multiple dimensions in a multiselect. They might be geo
    #   dimensions.
    # - NotFilter<SelectorFilter | AndFilter<SelectorFilter | OrFilter<either>>:
    #   A user has selected a NOT filter of any of the previous possibilities.
    # - AndFilter<NotFilter | OrFilter | AndFilter>
    #   The most complex of the above cases
    include_filters = []
    exclude_filters = []

    def parse_geo_filter(cur_filter):
        '''Build a flat mapping from { [dimension]: dimension_value }. If this filter
        is not a geo filter, return None.
        '''
        output = {}
        filter_fields = []
        if cur_filter.type == 'SELECTOR':
            filter_fields.append(cur_filter)
        elif cur_filter.type == 'AND':
            filter_fields = cur_filter.fields
        else:
            return None

        for field in filter_fields:
            if (
                field.type != 'SELECTOR'
                or field.dimension not in geo_field_ordering
                or field.dimension in output
            ):
                return None
            output[field.dimension] = field.value
        return output

    # pylint: disable=too-many-return-statements
    def recursively_find_geo_filters(cur_filter, collected_filters):
        if not cur_filter:
            return

        # Simplest case first.
        if cur_filter.type == 'SELECTOR':
            output = parse_geo_filter(cur_filter)
            if output:
                collected_filters.append(output)
            return

        # OR filter always indicates multiselect.
        if cur_filter.type == 'OR':
            for field in cur_filter.fields:
                geo_filter = parse_geo_filter(field)
                # Optimization: If any of the children cannot be converted into a geo
                # filter, then the current filter does not hold geo children at all.
                if not geo_filter:
                    return
                collected_filters.append(geo_filter)
            return

        if cur_filter.type == 'NOT':
            recursively_find_geo_filters(cur_filter.field, exclude_filters)
            return

        if cur_filter.type == 'AND':
            # First check to see if this is a geo filter.
            possible_geo_filter = parse_geo_filter(cur_filter)
            if possible_geo_filter:
                collected_filters.append(possible_geo_filter)
                return
            # If it is not a standalone geo filter, we need to recurse.
            for field in cur_filter.fields:
                recursively_find_geo_filters(field, collected_filters)
            return

    recursively_find_geo_filters(query_filter, include_filters)
    return (include_filters, exclude_filters)
