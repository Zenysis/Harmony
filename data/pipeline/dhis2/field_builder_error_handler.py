#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
from collections import defaultdict
from typing import Set

from log import LOG

# Error Types
MULTIPLE_REPORTING_RATES = (
    'Fields with multiple reporting rates (fields are still fetched according to '
    '--use_more_granular_reporting_rate)'
)
CATEGORIES_MISSING_FIELDS = 'Categories contained fields without definitions'
UNSUPPORTED_REPORTING_RATE = 'Unsupported reporting rates'
NOT_IN_REPORTING_RATES_TO_INCLUDE = (
    'Reporting rates not in --reporting_rates_to_include'
)
IN_EXCLUDE_LIST = 'Fields in exclude list'
UNSUPPORTED_VALUE_TYPE = 'Unsupported value types'
UNSUPPORTED_AGGREGATION_TYPE = 'Unsupported aggregation types'
FORMULA_FIELDS_USING_PROGRAM = (
    'Formula fields using program data and --output_dhis2_program_fetch_file was '
    'not specified'
)
FORMULA_FIELDS_USING_REPORTING = (
    'Formula fields using reporting data and --output_dhis2_reporting_fetch_file '
    'was not specified'
)
MISSING_CONSTITUENT = 'Formulas contained missing fields'
MISSING_CONSTANT = 'Formulas contained missing constants'
UNPARSEABLE_FORMULA = 'Formulas could not be parsed'
NO_ACCESS_TO_DATA_SET = 'We do not have read access to the dataset'
FIELD_NOT_IN_DATASET = 'Field did not belong to any dataset we have access for'
UNSUPPORTED_PROGRAM = 'Fields in programs that are not currently supported'


class DHIS2FieldBuilderErrorHandler:
    '''Build the field definitions for the DHIS2 instance based on the data defined
    in DHIS2.

    For logging and debugging purposes'''

    def __init__(self, fetch_only: bool) -> None:
        self.field_warnings: dict = {
            MULTIPLE_REPORTING_RATES: defaultdict(set),
            CATEGORIES_MISSING_FIELDS: defaultdict(set),
            UNSUPPORTED_REPORTING_RATE: defaultdict(set),
            NOT_IN_REPORTING_RATES_TO_INCLUDE: defaultdict(set),
            IN_EXCLUDE_LIST: set(),
            UNSUPPORTED_VALUE_TYPE: defaultdict(set),
            UNSUPPORTED_AGGREGATION_TYPE: defaultdict(set),
            FORMULA_FIELDS_USING_PROGRAM: set(),
            FORMULA_FIELDS_USING_REPORTING: set(),
            MISSING_CONSTITUENT: defaultdict(set),
            MISSING_CONSTANT: set(),
            UNPARSEABLE_FORMULA: {},
            NO_ACCESS_TO_DATA_SET: set(),
            FIELD_NOT_IN_DATASET: set(),
            UNSUPPORTED_PROGRAM: defaultdict(set),
        }
        self.removed_fields: Set[str] = set()
        self.fetch_only = fetch_only

    def multiple_reporting_rates(
        self, field_id: str, reporting_rate1: str, reporting_rate2: str
    ) -> None:
        # Omitting adding the field to `self.removed_fields` since a reporting rate
        # will be chosen and the field still fetched.
        self.field_warnings[MULTIPLE_REPORTING_RATES][field_id].add(reporting_rate1)
        self.field_warnings[MULTIPLE_REPORTING_RATES][field_id].add(reporting_rate2)

    def exclude_reporting_rate(self, field_id: str, reporting_rate: str) -> None:
        self.field_warnings[NOT_IN_REPORTING_RATES_TO_INCLUDE][reporting_rate].add(
            field_id
        )
        self.removed_fields.add(field_id)

    def unsupported_reporting_rate(self, field_id: str, reporting_rate: str) -> None:
        self.field_warnings[UNSUPPORTED_REPORTING_RATE][reporting_rate].add(field_id)
        self.removed_fields.add(field_id)

    def exclude_fetch_only(self, field_id: str) -> None:
        self.removed_fields.add(field_id)

    def unsupported_value_type(self, field_id: str, value_type: str) -> None:
        self.field_warnings[UNSUPPORTED_VALUE_TYPE][value_type].add(field_id)
        self.removed_fields.add(field_id)

    def excluded(self, field_id: str) -> None:
        self.field_warnings[IN_EXCLUDE_LIST].add(field_id)
        self.removed_fields.add(field_id)

    def unsupported_program(self, program: dict) -> None:
        for field in program['programIndicators']:
            self.field_warnings[UNSUPPORTED_PROGRAM][
                f"{program['displayName']}({program['id']})"
            ].add(field['id'])
            self.removed_fields.add(field['id'])

    def unsupported_aggregation_type(
        self, field_id: str, aggregation_type: str
    ) -> None:
        self.field_warnings[UNSUPPORTED_AGGREGATION_TYPE][aggregation_type].add(
            field_id
        )
        self.removed_fields.add(field_id)

    def missing_constituent(self, field_id: str, formula_id: str) -> None:
        self.field_warnings[MISSING_CONSTITUENT][formula_id].add(field_id)
        self.removed_fields.add(formula_id)

    def missing_constant(self, formula_id: str) -> None:
        self.field_warnings[MISSING_CONSTANT].add(formula_id)
        self.removed_fields.add(formula_id)

    def formula_using_program(self, field_id: str) -> None:
        self.field_warnings[FORMULA_FIELDS_USING_PROGRAM].add(field_id)
        self.removed_fields.add(field_id)

    def formula_using_reporting(self, field_id: str) -> None:
        self.field_warnings[FORMULA_FIELDS_USING_REPORTING].add(field_id)
        self.removed_fields.add(field_id)

    def unparseable_formula(self, field_id: str, formula: str) -> None:
        self.field_warnings[UNPARSEABLE_FORMULA][field_id] = formula
        self.removed_fields.add(field_id)

    def category_missing_fields(self, field_id: str, category_id: str) -> None:
        # If the field has already been removed, then it's not an error.
        if field_id not in self.removed_fields:
            # Omitting adding the field to `self.removed_fields` to be able to capture
            # if a field without a definition is in multiple categories.
            self.field_warnings[CATEGORIES_MISSING_FIELDS][category_id].add(field_id)

    def inaccessible_dataset(self, dataset_id: str) -> None:
        self.field_warnings[NO_ACCESS_TO_DATA_SET].add(dataset_id)

    def missing_dataset(self, field_id: str) -> None:
        self.field_warnings[FIELD_NOT_IN_DATASET].add(field_id)
        self.removed_fields.add(field_id)

    def log_warnings(self) -> None:
        # Filter multiple reporting rates to only fields that were kept
        self.field_warnings[MULTIPLE_REPORTING_RATES] = {
            key: value
            for key, value in self.field_warnings[MULTIPLE_REPORTING_RATES].items()
            if key not in self.removed_fields
        }

        if any(self.field_warnings.values()) or self.fetch_only:
            LOG.warning('Logging dropped fields and other warnings')

            if self.fetch_only:
                LOG.warning(
                    'Running in fetch only mode, logging only fields in fetch only'
                )

            for key, value in self.field_warnings.items():
                if value:
                    LOG.warning(key)
                    LOG.warning(value)
