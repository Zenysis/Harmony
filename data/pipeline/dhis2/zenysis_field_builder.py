#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import csv
import json
import re
from collections import defaultdict, namedtuple
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

import related

from data.field.util import (
    build_average_calculation,
    build_average_over_time_calculation,
    build_count_calculation,
    build_formula_calculation,
    build_last_value_calculation,
    build_max_calculation,
    build_min_calculation,
    build_sum_calculation,
)
from data.pipeline.dhis2.field_builder_error_handler import (
    DHIS2FieldBuilderErrorHandler,
)
from data.pipeline.dhis2.util import (
    EXCLUDED_VALUE_TYPES,
    REPORTING_METRICS,
    REPORTING_RATE_ORDER,
    RESAMPLE_AGGREGATION_TYPES,
    SUPPORTED_REPORTING_RATES,
)
from data.pipeline.field_setup.util import (
    CATEGORY_COLUMNS,
    METADATA_COLUMNS,
    ZenCategory,
    ZenField,
)
from data.query.models.calculation import Calculation, FormulaCalculation
from data.query.models.calculation.formula_calculation import Constituent
from data.query.models.calculation.last_value_calculation import AggregationOperation
from log import LOG


DHIS2FieldMetadata = namedtuple(
    'DHIS2FieldMetadata',
    [
        'field_categories',
        'composite_fields',
        'fields',
        'data_sets',
        'programs',
        'constants',
        'formula_fields',
        'formula_categories',
    ],
)


class FieldType(Enum):
    FIELD = 'field'
    CONSTITUENT_FIELD = 'constituent_field'
    FORMULA_FIELD = 'formula_field'
    PROGRAM_FIELD = 'program_field'
    REPORTING_FIELD = 'reporting_field'


class DHIS2ZenField(ZenField):
    resampled: bool


class DHIS2ZenysisFieldBuilder:
    '''Build the Zenysis field definitions and filter which fields to include from the DHIS2
    field metadata.'''

    # TODO(abby): Refactor the dhis2 api module to move the default values there and
    # clean up the `getattr` usages. Also, should resampling, program fields, and
    # reporting fields be moved to the dhis2 api module?
    def __init__(
        self,
        metadata: DHIS2FieldMetadata,
        dhis2_api_module: Any,
        split_resample_fields: bool = False,
        include_program_fields: bool = False,
        include_reporting_fields: bool = False,
        # TODO(abby): Revisit with the new endpoint if this is still needed
        reporting_rates_to_include: Optional[Set[str]] = None,
    ):
        # For logging and debugging purposes
        fetch_only = bool(getattr(dhis2_api_module, 'FETCH_ONLY', []))
        self.error_handler = DHIS2FieldBuilderErrorHandler(fetch_only)

        # Information about which data is being fetched
        self.dhis2_api_module = dhis2_api_module
        self.split_resample_fields = split_resample_fields
        self.include_program_fields = include_program_fields
        self.include_reporting_fields = include_reporting_fields

        # Zenysis format fields
        self.data_set_fields: Set[str] = set()
        self.reporting_rate_lookup: Dict[str, str] = {}
        self.reporting_rates_to_include = reporting_rates_to_include
        self.zenysis_prefix = getattr(self.dhis2_api_module, 'SOURCE_PREFIX', None)
        self.zenysis_suffix = getattr(self.dhis2_api_module, 'FIELD_SUFFIX', None)
        self.fields: Dict[str, DHIS2ZenField] = {}
        self.category_info: Dict[str, ZenCategory] = {}

        # Build the fields
        self._build_zenysis_fields(metadata)

    def _get_zenysis_id(self, dhis2_field_id: str) -> str:
        '''Build the zenysis field id from the DHIS2 id: replace '.' with '_' and
        add a field prefix if enabled.'''
        # DHIS2 creates constituent ids like <parent id>.<child id>
        field_id = dhis2_field_id.replace('.', '_')
        # TODO: Standardize field ids and remove this
        if self.zenysis_suffix:
            field_id = f'{field_id}_{self.zenysis_suffix}'
        return f'{self.zenysis_prefix}_{field_id}' if self.zenysis_prefix else field_id

    def _should_resample_field(
        self, field_id: str, aggregation_type: Optional[str]
    ) -> bool:
        '''Whether the specific field should be resampled.'''
        return self.split_resample_fields and (
            field_id in self.dhis2_api_module.RESAMPLE_OVERRIDE
            or aggregation_type in RESAMPLE_AGGREGATION_TYPES
        )

    def _preprocess_data_sets(self, raw_data_sets: List[dict]) -> List[dict]:
        '''Filter out and log any data sets that we do not have read access for.
        Build a lookup for all fields that are a part of a data set and can be
        fetched.'''
        filtered_data_sets = []
        for data_set in raw_data_sets:
            # We are only interested in "data" access. This is only available on
            # datasets and not data element groups. If data_set["access"]["read"]
            # is false, then we also cannot fetch the data, but in that case the
            # data set would not be returned as a part of the /dataSets endpoint
            # and would not be in the raw_data_sets list.
            read_access = data_set["access"]["data"]["read"]
            if not read_access:
                self.error_handler.inaccessible_dataset(data_set['id'])
                continue

            filtered_data_sets.append(data_set)
            for data_element in data_set['dataSetElements']:
                self.data_set_fields.add(data_element['dataElement']['id'])

        return filtered_data_sets

    def _handle_duplicate_reporting_rates(
        self,
        field_id: str,
        reporting_rate: str,
        decide_between_reporting_rates: Callable[[int, int], int],
    ) -> str:
        '''If there are multiple data sets that contain a data element it is
        possible that there are conflicting reporting rates for the data
        element. If so, log it and determine which to use.'''
        old_reporting_rate = self.reporting_rate_lookup[field_id]
        if old_reporting_rate == reporting_rate:
            return reporting_rate

        self.error_handler.multiple_reporting_rates(
            field_id, reporting_rate, old_reporting_rate
        )

        # There may be unsupported reporting rates in the data sets. If so,
        # use the supported rate. If both are unsupported, use the old rate.
        if reporting_rate not in SUPPORTED_REPORTING_RATES:
            return old_reporting_rate
        if old_reporting_rate not in SUPPORTED_REPORTING_RATES:
            return reporting_rate

        # If there are multiple supported rates, use
        # decide_between_reporting_rates to pick one.
        return REPORTING_RATE_ORDER[
            decide_between_reporting_rates(
                REPORTING_RATE_ORDER.index(old_reporting_rate),
                REPORTING_RATE_ORDER.index(reporting_rate),
            )
        ]

    def _build_reporting_rate_lookup(
        self,
        raw_data_sets: List[dict],
        decide_between_reporting_rates: Callable[[int, int], int],
    ) -> None:
        '''Build a lookup from field to its reporting rate using the data set information.
        Additionally, validate the reporting rate is a supported rate and handle fields
        with multiple reporting rates.'''
        for data_set in raw_data_sets:
            reporting_rate = data_set.get('periodType')
            if not reporting_rate:
                continue

            for field in data_set['dataSetElements']:
                field_id = field['dataElement']['id']
                if field_id in self.reporting_rate_lookup:
                    field_reporting_rate = self._handle_duplicate_reporting_rates(
                        field_id, reporting_rate, decide_between_reporting_rates
                    )
                else:
                    field_reporting_rate = reporting_rate
                self.reporting_rate_lookup[field_id] = field_reporting_rate

    def _keep_field(self, field: dict, field_type: FieldType) -> bool:
        '''Determine whether the field will be kept to add to the Zenysis system and be fetched
        from DHIS2. If not, then store the reason it's not included.'''
        field_id = field['id']

        fetch_only = getattr(self.dhis2_api_module, 'FETCH_ONLY', [])
        if fetch_only and field_id not in fetch_only:
            self.error_handler.exclude_fetch_only(field_id)
            return False

        if field_type in {FieldType.FIELD, FieldType.REPORTING_FIELD}:
            allowed_reporting_rates = SUPPORTED_REPORTING_RATES - set(
                getattr(self.dhis2_api_module, 'REPORTING_RATE_EXCLUSION', [])
            )

            if field_type == FieldType.REPORTING_FIELD:
                reporting_rate = field['reporting_rate']
            else:
                if field_id not in self.data_set_fields:
                    self.error_handler.missing_dataset(field_id)
                    return False
                reporting_rate = self.reporting_rate_lookup[field_id]

            if reporting_rate not in allowed_reporting_rates:
                self.error_handler.unsupported_reporting_rate(field_id, reporting_rate)
                return False
            if (
                self.reporting_rates_to_include is not None
                and reporting_rate not in self.reporting_rates_to_include
            ):
                self.error_handler.exclude_reporting_rate(field_id, reporting_rate)
                return False

        if field_type == FieldType.FIELD:
            value_type = field['valueType']
            if value_type in EXCLUDED_VALUE_TYPES:
                self.error_handler.unsupported_value_type(field_id, value_type)
                return False

        excluded_ids = {
            *self.dhis2_api_module.EXCLUSION_LIST,
            *getattr(self.dhis2_api_module, 'MISC_TO_EXCLUDE', set()),
        }
        if field_id in excluded_ids:
            self.error_handler.excluded(field_id)
            return False

        return True

    def _build_calculation_filter(
        self, field_id: str, constituents: Optional[Set[str]] = None
    ) -> Dict[str, Union[str, List[str]]]:
        '''Build the Zenysis calculation filter from the DHIS2 constituents. Fields can have
        two types of filters: "field" and "field in". "Field" means that field id is directly
        in Druid and the "field" filter is for that specific field id. "Field in" is a
        composite type field where the field id itself is not in Druid directly, but the
        constituent ids are and the "fields" filter is for the list of constituent field ids.
        Either of these filter types can be used with any calculation type and the filter
        itself is built as a part of the calculation builder helpers.'''
        if constituents is None:
            return {'field': self._get_zenysis_id(field_id)}
        if len(constituents) == 1:
            return {'field': self._get_zenysis_id(next(iter(constituents)))}
        return {
            'fields': [
                self._get_zenysis_id(constituent) for constituent in constituents
            ]
        }

    # pylint: disable=too-many-return-statements
    def _build_calculation(
        self,
        field_id: str,
        aggregation_type: str,
        constituents: Optional[Set[str]] = None,
    ) -> Optional[Calculation]:
        '''Build the Zenysis calculation from the DHIS2 aggregation type.
        DHIS2 documentation and scroll down to "Valid aggregation types":
        https://docs.dhis2.org/en/use/user-guides/dhis-core-version-239/configuring-the-system/metadata.html#about_indicator'''
        filter_ = self._build_calculation_filter(field_id, constituents)
        resample = self._should_resample_field(field_id, aggregation_type)

        if aggregation_type in {'LAST', 'LAST_IN_PERIOD'}:
            return build_last_value_calculation(
                operation=AggregationOperation.SUM, **filter_  # type: ignore[arg-type]
            )
        if aggregation_type in {
            'LAST_AVERAGE_ORG_UNIT',
            'LAST_IN_PERIOD_AVERAGE_ORG_UNIT',
        }:
            return build_last_value_calculation(
                operation=AggregationOperation.AVERAGE, **filter_  # type: ignore[arg-type]
            )
        if aggregation_type == 'AVERAGE_SUM_ORG_UNIT':
            if not resample:
                self.error_handler.unsupported_aggregation_type(
                    field_id, 'AVERAGE_SUM_ORG_UNIT without resample'
                )
                return None
            return build_average_over_time_calculation(**filter_)  # type: ignore[arg-type]

        # Typically, resampled fields will be of aggregation type AVERAGE_SUM_ORG_UNIT,
        # but sometimes other aggregation types are resampled and those types should be
        # included in the calculation.
        if resample:
            operation_lookup = {
                'AVERAGE': AggregationOperation.AVERAGE,
                'COUNT': AggregationOperation.COUNT,
                'MAX': AggregationOperation.MAX,
                'MIN': AggregationOperation.MIN,
                'SUM': AggregationOperation.SUM,
            }
            operation = operation_lookup.get(aggregation_type, AggregationOperation.SUM)
            return build_last_value_calculation(
                operation=operation, **filter_  # type: ignore[arg-type]
            )

        if aggregation_type == 'SUM':
            return build_sum_calculation(**filter_)  # type: ignore[arg-type]
        if aggregation_type == 'AVERAGE':
            return build_average_calculation(**filter_)  # type: ignore[arg-type]
        if aggregation_type == 'COUNT':
            return build_count_calculation(**filter_)  # type: ignore[arg-type]
        if aggregation_type == 'MIN':
            return build_min_calculation(**filter_)  # type: ignore[arg-type]
        if aggregation_type == 'MAX':
            return build_max_calculation(**filter_)  # type: ignore[arg-type]

        # Known aggregation types that are unsupported:
        # - NONE, CUSTOM: not enough info to build a calculation
        # - FIRST, FIRST_AVERAGE_ORG_UNIT: we only have last value calcs
        # - STDDEV, VARIANCE: no use case yet, but should be simple to support
        self.error_handler.unsupported_aggregation_type(field_id, aggregation_type)
        return None

    def _add_field(
        self,
        field: dict,
        calculation: Calculation,
        is_constructed: bool,
    ) -> None:
        '''Build the Zenysis field from the DHIS2 definition'''
        field_id = field['id']
        resampled = self._should_resample_field(field_id, field.get('aggregationType'))

        # category_id is filled in later
        self.fields[field_id] = {  # type: ignore[typeddict-item]
            'id': self._get_zenysis_id(field_id),
            'name': field['displayName'].strip(),
            'short_name': field['displayShortName'].strip(),
            'calculation': calculation,
            # For some fields, displayDescription isn't defined
            'description': field.get('displayDescription', '').strip(),
            # TODO(abby): How to handle mz covid sis ma case where pipeline datasource
            # needs to be the category?
            'pipeline_datasource_id': self.dhis2_api_module.DATA_SOURCE,
            'constructed': is_constructed,
            'resampled': resampled,
        }

    def _get_formula_variable(
        self, formula_id: str, constituents: Dict[str, Constituent], field_id: str
    ) -> str:
        '''For a given DHIS2 field id from a formula, check if the field exists, build
        the Zenysis constituent, and return the Zenysis field id.'''
        # The process step strips out default disaggregations, so that needs to be done
        # for formula variables too.
        if field_id[12:] in self.dhis2_api_module.DEFAULT_DISAGGREGATIONS:
            field_id = field_id[:11]

        if field_id not in self.fields:
            self.error_handler.missing_constituent(field_id, formula_id)
            return field_id

        constituent = self.fields[field_id]
        processed_field_id = self._get_zenysis_id(field_id)
        # mypy-related-issue
        constituents[processed_field_id] = Constituent(  # type: ignore[call-arg]
            id=processed_field_id,
            name=constituent['name'],
            calculation=constituent['calculation'],
        )
        return processed_field_id

    def _get_constant_variable(
        self, formula_id: str, constants_lookup: Dict[str, str], constant_id: str
    ) -> str:
        '''For a given DHIS2 constant id from a formula, check if the constant exists and
        return constant value.'''
        if constant_id not in constants_lookup:
            self.error_handler.missing_constant(formula_id)
            return constant_id

        return constants_lookup[constant_id]

    def _parse_formula(
        self, constants_lookup: Dict[str, str], field_id: str, formula: str
    ) -> Optional[Tuple[str, Dict[str, Constituent]]]:
        '''
        Parse the formula and replace DHIS2 notation with the direct field ids our system uses.
        Also, gather the constituent calculations. Formulas are in the form of:
            #{data element (field)}
            C{constant}
            I{program indicator (field)}
            R{reporting metric (field)}
        DHIS2 documentation:
        https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-239/metadata.html#webapi_aggregate_indicators
        '''
        constituents: Dict[str, Constituent] = {}

        # Replace '#{data element}' with the field id and fetch the constituent
        formula = re.sub(
            r'#{(.*?)}',
            lambda x: self._get_formula_variable(field_id, constituents, x.group(1)),
            formula,
        )

        # Replace 'C{constant}' with the constant value
        formula = re.sub(
            r'C{(.*?)}',
            lambda x: self._get_constant_variable(
                field_id, constants_lookup, x.group(1)
            ),
            formula,
        )

        # Program data require special pipeline steps
        if self.include_program_fields:
            # Replace 'I{program indicator}' with the field id and fetch the constituent
            formula = re.sub(
                r'I\{(.*?)\}',
                lambda x: self._get_formula_variable(
                    field_id, constituents, x.group(1)
                ),
                formula,
            )
        elif 'I{' in formula:
            self.error_handler.formula_using_program(field_id)
            return None

        # Reporting data require special pipeline steps
        if self.include_reporting_fields:
            # Replace 'R{reporting metric}' with the field id and fetch the constituent
            formula = re.sub(
                r'R{(.*?)}',
                lambda x: self._get_formula_variable(
                    field_id, constituents, x.group(1)
                ),
                formula,
            )
        elif 'R{' in formula:
            self.error_handler.formula_using_reporting(field_id)
            return None

        return formula, constituents

    def _get_formula_calculation(
        self, constants_lookup: Dict[str, str], formula_field: dict
    ) -> Optional[FormulaCalculation]:
        '''
        Create the formula for a formula field given the DHIS2 field definition with a
        numerator and denominator. See `_parse_formula` for details on how the formula
        is parsed.
        '''
        field_id = formula_field['id']
        numerator = formula_field['numerator']
        denominator = formula_field.get('denominator')
        raw_formula = (
            (
                numerator
                if denominator is None or denominator == '1'
                else f'({numerator}) / ({denominator})'
            )
            .replace('\n', '')
            .replace('\t', '')
        )

        parse_result = self._parse_formula(constants_lookup, field_id, raw_formula)
        if parse_result is None or field_id in self.error_handler.removed_fields:
            return None

        # This function will validate the formula. There are some DHIS2 variables that we don't
        # support because there has been no need, which will give an invalid formula. If there
        # is a need for them in the future, then determine how to parse them using the above
        # DHIS2 documentation.
        calculation = build_formula_calculation(*parse_result)
        if calculation is None:
            self.error_handler.unparseable_formula(field_id, raw_formula)
            return None
        return calculation

    def _build_single_standard_field(
        self, field: dict, constituent_lookup: Dict[str, List[dict]]
    ) -> None:
        '''Process a single "standard" (data element) field for Data Catalog. That will check
        whether the field should be kept, build the calculation (if possible), and add the
        field and constituents to the list of fields to keep.'''
        field_id = field['id']
        # If the field is not being fetched, then it isn't included in the output for
        # Data Catalog
        if not self._keep_field(field, FieldType.FIELD):
            return

        constituents = constituent_lookup[field_id]
        constituent_ids = {constituent['id'] for constituent in constituents}
        # NOTE(abby): Sometimes in DHIS2, a data element can be first created without
        # operands with data under the id of the data element. Then, operands are later
        # added. In this case, the operands API will not return the data element id. In
        # order to include the original data under the data element id and match DHIS2,
        # we add the data element id to the operands list by default.
        constituent_ids.add(field_id)

        calculation = self._build_calculation(
            field_id, field['aggregationType'], constituent_ids
        )
        # If a calculation can't be built, then the field is not included in the output
        if calculation is None:
            return

        self._add_field(field, calculation, len(constituent_ids) > 1)
        # The constituents need to also be added to our system. Note this will only
        # add the constituents if their field is being fetched.
        for constituent in constituents:
            constituent_id = constituent['id']
            if constituent_id in self.fields:
                continue

            # Operands use the parent field's aggregation type
            constituent['aggregationType'] = field['aggregationType']
            calculation = self._build_calculation(
                constituent_id, constituent['aggregationType']
            )
            # Constituents should always be able to be built. Using an assert so any
            # exceptions will be caught and the code can be updated.
            assert (
                calculation is not None
            ), f'Constituent {constituent_id} calculation could not be built'
            self._add_field(constituent, calculation, False)

    def _build_standard_fields(
        self, raw_composite_fields: List[dict], raw_fields: List[dict]
    ) -> None:
        '''Builds a lookup from each field to the field(s) that make it up. Then, filters
        "standard" (data element) fields to the ones to keep and processes those into the
        Data Catalog format.'''
        constituent_lookup = defaultdict(list)
        for constituent in raw_composite_fields:
            field_id = constituent['dataElement']['id']
            constituent_lookup[field_id].append(constituent)

        for field in raw_fields:
            self._build_single_standard_field(field, constituent_lookup)

    def _build_program_fields(self, raw_programs: List[dict]) -> None:
        '''Filters program fields to the ones to keep and processes those into the Data
        Catalog format.'''
        for program in raw_programs:
            supported_programs: Set[str] = getattr(
                self.dhis2_api_module, 'SUPPORTED_PROGRAMS', set()
            )
            if supported_programs and program['id'] not in supported_programs:
                self.error_handler.unsupported_program(program)
                continue
            for field in program['programIndicators']:
                if self._keep_field(field, FieldType.PROGRAM_FIELD):
                    # Since program indicators are already calculated in DHIS2, our platform
                    # just uses a sum aggregation type. However, program indicators without
                    # an aggregation type in DHIS2 will error when fetching data, so we still
                    # need to check the aggregation type before overriding it.
                    source_aggregation_type = field.get('aggregationType', 'NONE')
                    aggregation_type = (
                        source_aggregation_type
                        if source_aggregation_type == 'NONE'
                        else 'SUM'
                    )
                    calculation = self._build_calculation(field['id'], aggregation_type)
                    if calculation is not None:
                        self._add_field(field, calculation, False)

    def _build_reporting_fields(self, raw_data_sets: List[dict]) -> None:
        '''Filters reporting fields to the ones to keep and processes those into the Data
        Catalog format'''
        for data_set in raw_data_sets:
            for metric in REPORTING_METRICS:
                field_id = f'{data_set["id"]}.{metric}'
                field = {
                    'id': field_id,
                    'displayName': f'{data_set["displayName"]} ({metric})',
                    'displayShortName': metric,
                    'reporting_rate': data_set['periodType'],
                }
                if self._keep_field(field, FieldType.REPORTING_FIELD):
                    # Reporting rates don't have calculations in DHIS2, defaulting them to sum
                    calculation = build_sum_calculation(
                        **self._build_calculation_filter(field_id)  # type: ignore[arg-type]
                    )
                    self._add_field(field, calculation, False)

    def _build_formula_fields(
        self, constants: List[dict], raw_formula_fields: List[dict]
    ) -> None:
        '''Filters formula fields to the ones to keep and processes those into the Data Catalog
        format.'''
        # Build a lookup for the constants
        constants_lookup = {
            constant['id']: str(constant['value']) for constant in constants
        }

        for field in raw_formula_fields:
            if self._keep_field(field, FieldType.FORMULA_FIELD):
                calculation = self._get_formula_calculation(constants_lookup, field)
                if calculation is not None:
                    self._add_field(field, calculation, True)

    def _build_fields(
        self,
        raw_composite_fields: List[dict],
        raw_fields: List[dict],
        raw_programs: List[dict],
        raw_data_sets: List[dict],
        constants: List[dict],
        raw_formula_fields: List[dict],
    ) -> None:
        '''Process all fields into the format that we use in Data Catalog. This code is
        built to align with Field Setup. It will also filter fields and only include
        the ones that can and should be fetched from DHIS2.'''
        self._build_standard_fields(raw_composite_fields, raw_fields)
        self._build_program_fields(raw_programs)
        if self.include_reporting_fields:
            self._build_reporting_fields(raw_data_sets)
        self._build_formula_fields(constants, raw_formula_fields)

    def _handle_constituent_category(
        self,
        field_id: str,
        parent_category_id: str,
        category_params: dict,
        category_lookup: Dict[str, str],
    ) -> bool:
        '''This function checks if the field is a composite field with constituents. If so,
        constituents won't have a category from DHIS2, so one will be created from the
        parent composite field and then used for the constituents and composite field. If not,
        the function returns False.'''
        field = self.fields[field_id]
        if (
            field['constructed']
            and field['calculation'].type != 'FORMULA'
            and field['calculation'].filter.type == 'FIELD_IN'
        ):
            category_id = category_params['get_sub_category_id'](
                parent_category_id, field_id, field['name']
            )
            category_lookup[self._get_zenysis_id(field_id)] = category_id
            self.category_info[category_id] = {
                'id': category_id,
                'name': field['name'],
                'parent_id': parent_category_id,
            }
            for constituent_id in field['calculation'].filter.field_ids:
                category_lookup[constituent_id] = category_id
            return True
        return False

    def _build_category_info(
        self,
        categories: List[dict],
        category_params: dict,
        key_name: Optional[str] = None,
        get_fields: Optional[Callable[[dict], List[str]]] = None,
        is_calculated: bool = False,
    ) -> Dict[str, str]:
        '''Builds a lookup from field id to a single category. Also, builds a lookup of
        category information. This follows a specific DHIS2 category structure:
         - root
           - parent category for whole DHIS2 integration
             - categories from DHIS2
                - (optionally) composite category containing data element and operands
        '''
        # For most field types, there's a key on the category objects that provides the
        # field category mapping. However, reporting fields are structured differently
        # so they need pass in a function to pull out the field category mapping. Therefore,
        # either a key_name or get_fields needs to be passed in. For simplicity, this uses
        # the get_fields function for everything, so it creates a function using the key name.
        assert (key_name is None) ^ (
            get_fields is None
        ), 'Must provide a key_name or get_fields function'
        if get_fields is None:

            def get_fields(category_: dict) -> List[str]:
                return [field['id'] for field in category_[key_name]]

        # Build a lookup from field id to its category. In DHIS2, fields can be a part of
        # multiple category, but we just take the first category. Also build a dictionary
        # of category information.
        category_lookup: Dict[str, str] = {}
        for category in categories:
            category_id = category_params['get_category_id'](
                category['id'], is_calculated
            )

            # Keep track of whether any fields were added to this category.
            field_added = False
            for field_id in get_fields(category):
                # Only add a field to one category
                if field_id in category_lookup:
                    continue

                # Sometimes categories can include fields that are not included
                # in the definitions fetch. Log those.
                if field_id not in self.fields:
                    self.error_handler.category_missing_fields(field_id, category['id'])
                    continue

                field_added = True
                if not self._handle_constituent_category(
                    field_id, category_id, category_params, category_lookup
                ):
                    category_lookup[self._get_zenysis_id(field_id)] = category_id

            # Only add the category if any fields were added
            if field_added:
                parent_id, _ = category_params['get_parent_category_info'](
                    is_calculated
                )
                self.category_info[category_id] = {
                    'id': category_id,
                    'name': category['displayName'].strip(),
                    'parent_id': parent_id,
                }

        return category_lookup

    def _add_category_info(
        self,
        raw_field_categories: List[dict],
        raw_formula_categories: List[dict],
        raw_programs: List[dict],
        raw_data_sets: List[dict],
    ) -> None:
        '''For each type of field, build a lookup from field to the category it's in. If the
        field does not have a category in DHIS2, then it is added to the Misc category.'''
        # NOTE(abby): Previously, the category ids were created with more complex logic.
        # Notably, the calculated folders were separated out. It's now a lot simpler, but
        # in order for new fields to correctly be added to existing categories, this
        # needs to support creating category ids with the old logic. For new integrations,
        # the more simple logic here will be used, but for existing integrations, the
        # logic in the dhis2_api.py file will be used.
        category_params = getattr(
            self.dhis2_api_module,
            'CATEGORY_INFO',
            {
                'get_parent_category_info': lambda _: (
                    self.dhis2_api_module.DATA_SOURCE,
                    self.dhis2_api_module.DATA_SOURCE,
                ),
                'misc_category_info': lambda _: (
                    f'{self.dhis2_api_module.DATA_SOURCE}_misc',
                    'Miscellaneous Indicators',
                ),
                'get_category_id': (
                    lambda raw_category_id, _: raw_category_id
                    if self.zenysis_prefix is None
                    else f'{self.zenysis_prefix}_{raw_category_id}'
                ),
                'get_sub_category_id': lambda parent_category_id, raw_category_id, _: (
                    f'{parent_category_id}_{raw_category_id}'
                ),
            },
        )

        # Add the parent categories
        (parent_id, parent_name) = category_params['get_parent_category_info'](False)
        self.category_info[parent_id] = {
            'id': parent_id,
            'name': parent_name,
            'parent_id': 'root',
        }
        calculated_parent_id, calculated_parent_name = category_params[
            'get_parent_category_info'
        ](True)
        self.category_info[calculated_parent_id] = {
            'id': calculated_parent_id,
            'name': calculated_parent_name,
            'parent_id': 'root',
        }

        # This will also handle adding categories for constituents.
        category_lookup = self._build_category_info(
            raw_field_categories, category_params, key_name='dataElements'
        )
        category_lookup.update(
            self._build_category_info(
                raw_formula_categories,
                category_params,
                key_name='indicators',
                is_calculated=True,
            )
        )
        if self.include_program_fields:
            category_lookup.update(
                self._build_category_info(
                    raw_programs, category_params, key_name='programIndicators'
                )
            )
        if self.include_reporting_fields:
            # Reporting fields will never not have a category since we construct the categories
            # from the data sets
            def get_fields(category: dict) -> List[str]:
                return [f'{category["id"]}.{metric}' for metric in REPORTING_METRICS]

            category_lookup.update(
                self._build_category_info(
                    raw_data_sets, category_params, get_fields=get_fields
                )
            )

        for unprocessed_field_id, field in self.fields.items():
            field_id = field['id']
            is_calculated = field['calculation'].type == 'FORMULA'
            category_id = category_lookup.get(field_id)

            # Create a category with any fields that are not part of a DHIS2 category.
            if category_id is None:
                (misc_category_id, misc_category_name) = category_params[
                    'misc_category_info'
                ](is_calculated)
                if misc_category_id not in self.category_info:
                    self.category_info[misc_category_id] = {
                        'id': misc_category_id,
                        'name': misc_category_name,
                        'parent_id': parent_id,
                    }
                category_id = misc_category_id

                # If the field is a composite, then it will create a sub-category within misc.
                if self._handle_constituent_category(
                    unprocessed_field_id, category_id, category_params, category_lookup
                ):
                    category_id = category_lookup[field_id]
            field['category_id'] = category_id

    def _log_raw_stats_and_warnings(
        self,
        raw_fields: List[dict],
        raw_composite_fields: List[dict],
        raw_formula_fields: List[dict],
        raw_programs: List[dict],
        raw_data_sets: List[dict],
    ) -> None:
        '''Log summary numbers about the number of field types fetched. Also,
        log any warnings or errors about fields that were not saved.'''
        fetched_field_count = len(raw_fields) + len(raw_composite_fields)
        LOG.info('%s raw fields found in DHIS2', fetched_field_count)
        if raw_formula_fields:
            LOG.info('%s raw formula fields found in DHIS2', len(raw_formula_fields))
        if self.include_program_fields:
            LOG.info(
                '%s programs and %s raw program fields found in DHIS2',
                len(raw_programs),
                sum(len(program['programIndicators']) for program in raw_programs),
            )
        if self.include_reporting_fields:
            LOG.info(
                '%s data sets (%s reporting fields) found in DHIS2',
                len(raw_data_sets),
                len(REPORTING_METRICS) * len(raw_data_sets),
            )

        self.error_handler.log_warnings()

    def _build_zenysis_fields(self, metadata: DHIS2FieldMetadata) -> None:
        # Data from the endpoints
        raw_field_categories = metadata.field_categories
        raw_composite_fields = metadata.composite_fields
        raw_fields = metadata.fields
        raw_data_sets = metadata.data_sets
        raw_programs = metadata.programs
        constants = metadata.constants
        raw_formula_fields = metadata.formula_fields
        raw_formula_categories = metadata.formula_categories

        # Reporting rate helpers
        use_more_granular_reporting_rate = getattr(
            self.dhis2_api_module, 'USE_MORE_GRANULAR_REPORTING_RATE', False
        )
        decide_between_reporting_rates = (
            max if use_more_granular_reporting_rate else min
        )
        self._build_reporting_rate_lookup(raw_data_sets, decide_between_reporting_rates)

        filtered_data_sets = self._preprocess_data_sets(raw_data_sets)

        # Build Zenysis fields
        self._build_fields(
            raw_composite_fields,
            raw_fields,
            raw_programs,
            filtered_data_sets,
            constants,
            raw_formula_fields,
        )
        self._add_category_info(
            raw_field_categories,
            raw_formula_categories,
            raw_programs,
            filtered_data_sets,
        )

        # Log stats about the raw metadata and warnings about which fields were dropped
        self._log_raw_stats_and_warnings(
            raw_fields,
            raw_composite_fields,
            raw_formula_fields,
            raw_programs,
            raw_data_sets,
        )

    def output_zenysis_fields(
        self,
        field_metadata_file_name: str,
        categories_file_name: str,
        resampled_periods_file_name: Optional[str],
    ) -> None:
        '''Output all saved fields that will be fetched from DHIS2 in the Zenysis format.'''
        with open(field_metadata_file_name, 'w') as field_metadata_file:
            writer = csv.DictWriter(
                field_metadata_file, fieldnames=METADATA_COLUMNS, extrasaction='ignore'
            )
            writer.writeheader()
            for field in self.fields.values():
                field['calculation'] = related.to_json(
                    field['calculation'], indent=None
                )
                writer.writerow(field)
        LOG.info(
            'Finished writing %s Zenysis fields to %s',
            len(self.fields),
            field_metadata_file_name,
        )

        with open(categories_file_name, 'w') as categories_file:
            writer = csv.DictWriter(categories_file, fieldnames=CATEGORY_COLUMNS)
            writer.writeheader()
            for category in self.category_info.values():
                writer.writerow(category)
        LOG.info(
            'Finished writing %s Zenysis categories to %s',
            len(self.category_info),
            categories_file_name,
        )

        if resampled_periods_file_name is not None and self.split_resample_fields:
            with open(resampled_periods_file_name, 'w') as resampled_periods_file:
                resampled_periods = {
                    field['id']: self.reporting_rate_lookup[dhis2_field_id[:11]]
                    for dhis2_field_id, field in self.fields.items()
                    if field['resampled']
                }
                json.dump(resampled_periods, resampled_periods_file, indent=4)
