# pylint: disable=C0103
from builtins import object
from enum import Enum, unique

ID_KEY = 'id'
INDICATORS_KEY = 'indicators'
FIELD_KEY = 'field'
DIMENSION_VALUES_KEY = 'dimension_values'
REQUIRED_DIMENSIONS_KEY = 'requiredDimensions'
DISAGGREGATED_INDICATORS_KEY = 'disaggregatedIndicators'
COMPOSITE_INDICATORS_KEY = 'compositeIndicators'


@unique
class InvalidDimensionReason(Enum):
    '''
    An enumeration of possible values that represents why a dimension value for a given indicator
    is invalid.
    '''

    '''
    If the dimension is part of the `requiredDimensions` mapping in the composite indicator
    definition but is not present in the disaggregate indicator
    '''  # pylint: disable=W0105
    MISSING = 0

    '''
    If the dimension is present but the validation of the type failed (e.g. the value
    in the disaggregate indicator did not match the type specified in the composite
    indicator definition)
    '''
    TYPE_VALIDATION_FAILED = 1

    '''
    If the dimension is present but the value of the dimension could not be determined
    because the appropriate `get_dimension_value` method is undefined.
    '''
    GET_VALUE_FAILED = 2

    '''
    The Druid representation of the dimension value must be a string or a list of strings. If the
    call to the `get_dimension_value` method produces an object of any other type, it will be
    rejected for this reason.
    '''
    INVALID_DIMENSION_VALUE = 3


class MalformedIndicator(object):
    '''
    A class that represents indicator data that is associated with a composite indicator
    but has missing/malformed data that prevents it from being classified with a composite
    indicator
    '''

    # TODO It would also be nice to have some kind of fault/classification code explaining
    # why the indicator is malformed.
    def __init__(self, indicator_definition, invalid_dimensions):
        '''
        Constructor for MalformedIndicator.

        Parameters
        ----------

        indicator_definition : dict
            The indicator definition that is malformed

        invalid_dimensions : dict
            The invalid dimensions values in the indicator that resulted in the indicator being
            classified as malformed.
        '''
        self.invalid_dimensions = invalid_dimensions
        self.indicator_definition = indicator_definition

    def __repr__(self):
        return '{ indicator_id: %s, invalid_dimensions: %s }' % (
            self.invalid_dimensions,
            self.indicator_definition[ID_KEY],
        )


def enumerate_disaggregate_indicators(indicator_groups):
    '''
    Returns an enumeration of all the disaggregate indicators in a given indicator group.
    '''
    for group in indicator_groups:
        indicators_in_group = group[INDICATORS_KEY]
        for indicator in indicators_in_group:
            yield indicator


def enumerate_composite_indicators(indicator_groups):
    '''
    Returns an enumeration of all the disaggregate indicators in a given indicator group.
    '''
    for group in indicator_groups:
        indicators_in_group = group[COMPOSITE_INDICATORS_KEY]
        for indicator in indicators_in_group:
            yield indicator


def assert_preconditions(
    composite_indicator_definitions, disaggregate_indicator_definitions
):
    '''
    Verifies that all the disaggregate indicators referenced by a composite indicator actually exist
    and ensures that the dimension values defined in the disaggregate indicator definition match
    the types specified in the composite indicator definitions.

    Parameters
    ----------

    composite_indicator_definitions : list
        A list of composite indicator definitions.

    disaggregate_indicator_definitions : list
        A list of disaggregated indicator definitions.

    Raises
    ------
    ValueError:
        If disaggregate indicator definitions are missing or if the dimension values for a
        disaggregate indicator indicator are invalid.
    '''
    disaggregate_to_composite_mapping = _construct_reverse_mapping(
        composite_indicator_definitions
    )

    id_to_composite_mapping = _construct_id_to_definition_mapping(
        composite_indicator_definitions
    )

    id_to_disaggregate_mapping = _construct_id_to_definition_mapping(
        disaggregate_indicator_definitions
    )

    _assert_all_indicators_defined(id_to_composite_mapping, id_to_disaggregate_mapping)

    malformed_indicators = []

    for disaggregate_indicator in disaggregate_indicator_definitions:

        represents_composite_data = (
            disaggregate_indicator[ID_KEY] in disaggregate_to_composite_mapping
        )

        if not represents_composite_data:
            continue

        composite_indicator_id = disaggregate_to_composite_mapping[
            disaggregate_indicator[ID_KEY]
        ]
        composite_indicator = id_to_composite_mapping[composite_indicator_id]
        invalid_dimensions = {}
        if not _validate_dimensions(
            composite_indicator[REQUIRED_DIMENSIONS_KEY],
            disaggregate_indicator[DIMENSION_VALUES_KEY],
            invalid_dimensions,
        ):
            print('INDICATOR\n\n\n\n', disaggregate_indicator, '\n\n\n')
            malformed_indicators.append(
                MalformedIndicator(disaggregate_indicator, invalid_dimensions)
            )
    if len(malformed_indicators) > 0:
        raise ValueError(
            'The following indicator definitions are not valid: %s'
            % malformed_indicators
        )


def generate_composite_indicators(
    composite_indicator_definitions,
    disaggregate_indicator_definitions,
    indicator_data,
    on_indicator_generated,
):
    '''
    Given a list of disaggregate indicators, a list of composite and disaggregate definitions and
    indicator data, generates a list of composite indicators where the disaggregate data is unified
    into a single composite indicator that enables aggregation/disaggregation by filtering on the
    dimensions specified for that composite indicator.

    Examples
    ----------
    We have the following disaggregate indicators

    (Slides or RDTs that are Malaria positive for Males < 5 years)
    {... "field": "hmis_indicator_3199", "val": 21.0}

    (Slides or RDTs that are Malaria positive for Females < 5 years)
    {... "field": "hmis_indicator_3200", "val": 12.0}

    There is a composite indicator that unifies this data defined (composite_indicator_0001)
    The output of this operation will be addition of two new indicators
    {... "field": "composite_indicator_0001", "val": 21.0, "Age":["0", "43829"], "Gender":"Male"}
    {... "field": "composite_indicator_0001", "val": 12.0, "Age":["0", "43829"], "Gender":"Female"}

    This allows us to query against the composite indicator but to also optionally
    disaggregate the data by Gender/Age in the above case.

    Parameters
    ----------

    composite_indicator_definitions : list
        A list of composite indicator definitions.

    disaggregate_indicator_definitions : list
        A list of disaggregated indicator definitions.

    indicator_data : iter
        The disaggregate indicator data that composite indicators will be generated from.

    on_indicator_generated : function(dict)
        The callback to invoke when a composite indicator has been generated from the input data.

    '''

    disaggregate_to_composite_mapping = _construct_reverse_mapping(
        composite_indicator_definitions
    )

    id_to_composite_mapping = _construct_id_to_definition_mapping(
        composite_indicator_definitions
    )

    id_to_disaggregate_mapping = _construct_id_to_definition_mapping(
        disaggregate_indicator_definitions
    )

    for data_row in indicator_data:
        # Determine if the indicator that we are looking at is associated with a
        # composite indicator
        represents_composite_data = (
            data_row[FIELD_KEY] in disaggregate_to_composite_mapping
        )

        if not represents_composite_data:
            continue

        # Look up the associated composite indicator and verify that the dimensions requried by
        # the composite definition are specified in the disaggregate definition of the indicator
        composite_id = disaggregate_to_composite_mapping[data_row[FIELD_KEY]]
        composite_definition = id_to_composite_mapping[composite_id]
        disaggregate_definition = id_to_disaggregate_mapping[data_row[FIELD_KEY]]
        dimension_values = disaggregate_definition[DIMENSION_VALUES_KEY]

        on_indicator_generated(
            _generate_composite_indicator(
                data_row, composite_definition, dimension_values
            )
        )


def _construct_reverse_mapping(composite_indicator_definitions):
    '''
    Given a list of composite indicators, constructs a dictionary that maps a disaggregate
    indicator to its corresponding composite parent.

    Parameters
    ----------

    composite_indicator_definitions : list
        A list of composite indicator definitions.
    '''
    disaggregate_to_composite_mapping = {}

    for indicator_definition in composite_indicator_definitions:
        composite_indicator_id = indicator_definition[ID_KEY]
        for disaggregate_indicator in indicator_definition[
            DISAGGREGATED_INDICATORS_KEY
        ]:
            disaggregate_to_composite_mapping[
                disaggregate_indicator
            ] = composite_indicator_id

    return disaggregate_to_composite_mapping


def _construct_id_to_definition_mapping(indicator_definitions):
    '''
    Given a list of indicator definitions, constructs a dictionary that maps an
    indicator 'id' to its corresponding definition.

    Parameters
    ----------

    composite_indicator_definitions : list
        A list of indicator definitions.
    '''
    id_to_definition_mapping = {}

    for definition in indicator_definitions:
        id_to_definition_mapping[definition[ID_KEY]] = definition

    return id_to_definition_mapping


def _assert_all_indicators_defined(composite_mapping, disaggregate_mapping):
    '''
    Asserts that all disaggregate indicators that are identified as part of one or more
    composite indicators are actually defined in the mapping of disaggregate indicators.
    '''
    composite_ids = list(composite_mapping.keys())
    missing_indicators = []

    for composite_id in composite_ids:
        disaggregate_ids = composite_mapping[composite_id][DISAGGREGATED_INDICATORS_KEY]
        for disaggregate_id in disaggregate_ids:
            if disaggregate_id in disaggregate_mapping:
                continue
            missing_indicators.append(disaggregate_id)

    if len(missing_indicators) > 0:
        raise ValueError(
            'The following disaggregate indicators are part of one or more '
            'composite indicators but are undefined: %s' % missing_indicators
        )


def _validate_dimensions(
    expected_dimensions, actual_dimension_values, invalid_dimensions
):
    '''
    Verifies that the dimension fields required by the composite indicator are present in the
    disaggregated indicator and adds any missing values to the invalid_dimensions parameter.
    '''

    dimensions_are_valid = True
    dimension_keys = list(expected_dimensions.keys())

    for expected_dimension in dimension_keys:
        # TODO We should also implement some type of value validation
        # (e.g. only allow 'Male'/'Female' for the age dimension)

        # If we cannot find a required dimension, mark it as missing
        if expected_dimension not in actual_dimension_values:
            invalid_dimensions[expected_dimension] = InvalidDimensionReason.MISSING
            dimensions_are_valid = False

        # If the value of the dimension fails type validation
        if dimensions_are_valid and not isinstance(
            actual_dimension_values[expected_dimension],
            expected_dimensions[expected_dimension],
        ):
            invalid_dimensions[
                expected_dimension
            ] = InvalidDimensionReason.TYPE_VALIDATION_FAILED
            dimensions_are_valid = False

        # If we could not determine the dimension's value
        if dimensions_are_valid:
            try:
                # Ensure that the dimension value is a druid supported data type
                value = actual_dimension_values[
                    expected_dimension
                ].get_dimension_value()
                if not _is_druid_compatible_value(value):
                    invalid_dimensions[
                        expected_dimension
                    ] = InvalidDimensionReason.INVALID_DIMENSION_VALUE
                    dimensions_are_valid = False
            except AttributeError:
                invalid_dimensions[
                    expected_dimension
                ] = InvalidDimensionReason.GET_VALUE_FAILED
                dimensions_are_valid = False

    return dimensions_are_valid


def _is_druid_compatible_value(dimension_value):
    if isinstance(dimension_value, str):
        return True

    if isinstance(dimension_value, (list, tuple)):
        for element in dimension_value:
            if not isinstance(element, str):
                return False
            return True

    return False


def _generate_composite_indicator(
    disaggregate_indicator, composite_indicator_definition, actual_dimension_values
):
    '''
    Given a disaggregate indicator and the definition of a composite indicator, creates a new
    composite indicator value using the baseline disaggregate indicator values along with the
    dimension values specified in the disaggregate indicator's definition.
    '''

    composite_indicator = dict(disaggregate_indicator)
    dimensions = list(actual_dimension_values.keys())

    for dimension in dimensions:
        composite_indicator[dimension] = actual_dimension_values[
            dimension
        ].get_dimension_value()

    composite_indicator[FIELD_KEY] = composite_indicator_definition[ID_KEY]
    return composite_indicator
