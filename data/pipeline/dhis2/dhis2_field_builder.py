#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
import json
from collections import defaultdict
from typing import Callable, Dict, List, Optional, Tuple, Union, Set

from data.pipeline.dhis2.zenysis_field_builder import (
    DHIS2FieldMetadata,
    DHIS2ZenysisFieldBuilder,
)
from data.pipeline.dhis2.util import REPORTING_METRICS
from log import LOG
from util.file.file_config import FilePattern


def write_to_file(
    file_name: str, fields: Union[dict, list], count: int, output_text: str
) -> None:
    '''Write the dictionary to the file as json.'''
    with open(file_name, 'w') as output_file:
        output_file.write(json.dumps(fields, indent=4))
    LOG.info('%s %s saved written to %s', count, output_text, file_name)


def dvs_endpoint_output_helper(
    file_name: str,
    data_element_groups: Dict[str, List[str]],
    data_sets: Dict[str, List[str]],
    description: str = '',
) -> None:
    '''Helper for the dvs endpoint that needs to output to two files.'''
    file_pattern = FilePattern(file_name)
    group_field_count = sum(len(fields) for fields in data_element_groups.values())
    data_set_field_count = sum(len(fields) for fields in data_sets.values())

    write_to_file(
        file_pattern.build('data_element_groups'),
        data_element_groups,
        len(data_element_groups),
        f'{description} data element groups ({group_field_count} fields total)',
    )
    write_to_file(
        file_pattern.build('data_sets'),
        data_sets,
        len(data_sets),
        f'{description} data sets ({data_set_field_count} fields total)',
    )


class DHIS2FieldBuilder:
    '''Build the field info to fetch data from DHIS2. Relies upon the DHIS2ZenysisFieldBuilder
    to determine which fields to fetch.'''

    def __init__(self, zenysis_field_builder: DHIS2ZenysisFieldBuilder):
        self.zenysis_field_builder = zenysis_field_builder

    def _output_dhis2_program_fields(
        self, raw_programs: List[dict], program_file_name: Optional[str] = None
    ) -> None:
        '''For program fields, output a list of field ids to be fetched from DHIS2 in
        the 05_fetch_program_data pipeline step.'''
        supported_programs: Set[str] = getattr(
            self.zenysis_field_builder.dhis2_api_module, 'SUPPORTED_PROGRAMS', set()
        )
        if (
            not self.zenysis_field_builder.include_program_fields
            or not program_file_name
        ):
            return

        raw_program_fields: dict = {
            program['id']: program['programIndicators']
            for program in raw_programs
            if not supported_programs or program['id'] in supported_programs
        }

        # For fetching program fields, only the field id is necessary
        program_fields: Dict[str, List[str]] = {}
        for program, value in raw_program_fields.items():
            program_fields[program] = []
            for field in value:
                field_id = field['id']
                if field_id in self.zenysis_field_builder.fields:
                    program_fields[program].append(field_id)

        write_to_file(
            program_file_name, program_fields, len(program_fields), 'program fields'
        )

    def _output_dhis2_reporting_fields(
        self, raw_data_sets: List[dict], reporting_file_name: Optional[str] = None
    ) -> None:
        '''For program fields, output a list of field objects to be fetched from DHIS2
        in the 05_fetch_reporting_data pipeline step.'''
        if (
            not self.zenysis_field_builder.include_reporting_fields
            or not reporting_file_name
        ):
            return

        # For fetching reporting fields, the dataset id, reporting rate, fields, and unit
        # ids are necessary
        reporting_fields = []
        for data_set in raw_data_sets:
            data_set_id = data_set['id']
            test_field_id = f'{data_set_id}.{REPORTING_METRICS[0]}'
            # If one was not added, they all wouldn't have been
            if test_field_id not in self.zenysis_field_builder.fields:
                continue
            field_ids = [f'{data_set_id}.{metric}' for metric in REPORTING_METRICS]
            reporting_fields.append(
                {
                    'id': data_set_id,
                    'fields': field_ids,
                    'reporting_rate': data_set['periodType'],
                    'unit_ids': [unit['id'] for unit in data_set['organisationUnits']],
                }
            )

        count = sum(len(data_set['fields']) for data_set in reporting_fields)
        write_to_file(
            reporting_file_name,
            reporting_fields,
            count,
            'reporting fields',
        )

    # pylint: disable=invalid-name
    def _output_dhis2_standard_and_resampled_fields(
        self,
        raw_fields: List[dict],
        standard_fields_file_name: str,
        resampled_file_name: Optional[str] = None,
    ) -> None:
        '''For fields, output a mapping from reporting rate to field ids to be fetched
        from DHIS2 in the 05_fetch_data pipeline step. If resampling is enabled, output
        the resampled fields to a separate file to be used in the 05_fetch_resample_data
        pipeline step.'''
        # For fetching standard and resampled fields, a mapping from reporting rate to
        # field ids is necessary
        standard_fields: Dict[str, List[str]] = defaultdict(list)
        resampled_fields: Dict[str, List[str]] = defaultdict(list)
        for field in raw_fields:
            field_id = field['id']
            if field_id in self.zenysis_field_builder.fields:
                resampled = self.zenysis_field_builder.fields[field_id]['resampled']
                dictionary = resampled_fields if resampled else standard_fields
                reporting_rate = self.zenysis_field_builder.reporting_rate_lookup[
                    field_id
                ]
                dictionary[reporting_rate].append(field_id)

        standard_count = sum(len(fields) for fields in standard_fields.values())
        resampled_count = sum(len(fields) for fields in resampled_fields.values())
        # If resampling is not enabled, then `resampled_fields` will be empty and
        # all fields outputted to the standard fields file
        if self.zenysis_field_builder.split_resample_fields and resampled_file_name:
            write_to_file(
                resampled_file_name,
                resampled_fields,
                resampled_count,
                'resampled fields',
            )
            write_to_file(
                standard_fields_file_name,
                standard_fields,
                standard_count,
                'non-resampled fields',
            )
        else:
            write_to_file(
                standard_fields_file_name,
                standard_fields,
                standard_count,
                'fields',
            )

    def _build_deduplicated_field_group_mapping(
        self,
        raw_groups: List[dict],
        fields_key: str,
        get_field_id: Callable[[dict], str],
    ) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
        '''Helper function to build a mapping from data element group or data set id to field ids
        for standard or resampled fields.'''
        standard_fields = {}
        resampled_fields = {}
        seen_field_ids = set()
        for group in raw_groups:
            standard_field_ids = []
            resampled_field_ids = []

            for field in group[fields_key]:
                field_id = get_field_id(field)
                if (
                    field_id in self.zenysis_field_builder.fields
                    and field_id not in seen_field_ids
                ):
                    resampled = self.zenysis_field_builder.fields[field_id]['resampled']
                    if resampled:
                        resampled_field_ids.append(field_id)
                    else:
                        standard_field_ids.append(field_id)
                    seen_field_ids.add(field_id)

            if standard_field_ids:
                standard_fields[group['id']] = standard_field_ids
            if resampled_field_ids:
                resampled_fields[group['id']] = resampled_field_ids

        return standard_fields, resampled_fields

    # pylint: disable=invalid-name
    def _output_dhis2_standard_and_resampled_fields_for_dvs_endpoint(
        self,
        raw_field_categories: List[dict],
        raw_data_sets: List[dict],
        standard_fields_file_name: str,
        resampled_file_name: Optional[str] = None,
    ) -> None:
        '''For fields, output adata element group and data set mappings for the
        05_fetch_data pipeline step. If resampling is enabled, output the resampled
        fields to a separate file to be used in the 05_fetch_resample_data pipeline
        step.'''
        # For the data value set endpoint, there needs to be two outputs: one for the
        # data element groups and one for the data sets. Both are a mapping from the
        # group or data set id to the field (data element) ids. Fields can be duplicated
        # in multiple groups or data sets, but this output only includes a field id once.
        (
            standard_data_element_groups,
            resampled_data_element_groups,
        ) = self._build_deduplicated_field_group_mapping(
            raw_field_categories, 'dataElements', lambda field: field['id']
        )
        (
            standard_data_sets,
            resampled_data_sets,
        ) = self._build_deduplicated_field_group_mapping(
            raw_data_sets, 'dataSetElements', lambda field: field['dataElement']['id']
        )

        # If resampling is not enabled, then the resampled dictionaries will be empty
        # and all fields outputted to the standard fields file
        if self.zenysis_field_builder.split_resample_fields and resampled_file_name:
            dvs_endpoint_output_helper(
                resampled_file_name,
                resampled_data_element_groups,
                resampled_data_sets,
                'resampled',
            )
            dvs_endpoint_output_helper(
                standard_fields_file_name,
                standard_data_element_groups,
                standard_data_sets,
                'non-resampled',
            )
        else:
            dvs_endpoint_output_helper(
                standard_fields_file_name,
                standard_data_element_groups,
                standard_data_sets,
            )

    def output_fields_to_fetch_from_dhis2(
        self,
        metadata: DHIS2FieldMetadata,
        use_dvs_endpoint: bool,
        standard_fields_file_name: Optional[str] = None,
        resampled_file_name: Optional[str] = None,
        program_file_name: Optional[str] = None,
        reporting_file_name: Optional[str] = None,
    ) -> None:
        '''Output all saved fields both in the Zenysis format (to field_metadata_file_name)
        and in the format necessary for them to be fetched from DHIS2 in the 05_fetch_*
        pipeline steps. Fields are restricted to those in `self.zenysis_field_builder.fields`
        since those have already been filtered to the fetchable fields.'''

        if standard_fields_file_name:
            self._output_data_elements(
                metadata,
                standard_fields_file_name,
                resampled_file_name,
                use_dvs_endpoint,
            )

        self._output_dhis2_program_fields(metadata.programs, program_file_name)
        self._output_dhis2_reporting_fields(metadata.data_sets, reporting_file_name)

    def _output_data_elements(
        self,
        metadata: DHIS2FieldMetadata,
        standard_fields_file_name: str,
        resampled_file_name: Optional[str] = None,
        use_dvs_endpoint: bool = False,
    ) -> None:
        if use_dvs_endpoint:
            self._output_dhis2_standard_and_resampled_fields_for_dvs_endpoint(
                metadata.field_categories,
                metadata.data_sets,
                standard_fields_file_name,
                resampled_file_name,
            )
        else:
            self._output_dhis2_standard_and_resampled_fields(
                metadata.fields, standard_fields_file_name, resampled_file_name
            )
