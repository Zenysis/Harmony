import related


from flask import current_app


def get_indicator_groups(group_props=None):
    '''Retrieve all indicator groups, strip off certain properties by passing a set of
    properties you require

    Args:
        group_props: set
            A set with specific indicator group properties to return values for
            It returns entire indicator group if group_props is empty.

    Returns: list
            A list of indicator groups
    '''
    group_definitions = current_app.zen_config.indicators.GROUP_DEFINITIONS
    if not group_props:
        return group_definitions
    return list(
        map(
            lambda group: {key: group[key] for key in dict(group).keys() & group_props},
            group_definitions,
        )
    )


def get_indicator_by_id(text_id, indicator_props=None):
    '''Retrieve an indicator by id, strip off certain properties by passing a set of
     properties you require

    Args:
        indicator_props: set
            A set with specific indicator properties to return values for
            It returns entire indicator if indicator_props is empty.

    Returns: dict
                A dict of an indicator
    '''
    calculated_indicators = current_app.zen_config.calculated_indicators
    indicators = current_app.zen_config.indicators
    indicator = indicators.ID_LOOKUP.get(text_id)
    if not indicator_props:
        return indicator
    new_indicator = {key: indicator[key] for key in indicator.keys() & indicator_props}
    if 'formula' in indicator_props:
        formula = dict(calculated_indicators.CALCULATED_INDICATOR_FORMULAS).get(text_id)
        if formula:
            new_indicator['formula'] = dict(
                calculated_indicators.CALCULATED_INDICATOR_FORMULAS
            ).get(text_id)
    return new_indicator


def get_fields_metadata_mappings(as_dict=False):
    '''Get metadata of field mapped with their id

    Args:
        as_dict: boolean
            specify whether to return a list of dict of field ids
            to dict of field metadata properties instead of FieldMetadata objects

    Returns: dict
    '''
    metadata_mappings = []
    query_metadata = current_app.query_data.field_metadata
    for data in query_metadata:
        metadata_mappings.append({data.id: related.to_dict(data) if as_dict else data})
    return metadata_mappings
