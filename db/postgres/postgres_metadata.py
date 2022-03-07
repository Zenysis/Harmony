import csv

from collections import defaultdict

import pandas as pd

from data.pipeline.build_canonical_mapping import build_canonical_mapping
from util.file.compression.lz4 import LZ4Reader


def _get_location_id(location_info, hierarchy):
    '''Return the most granular id available.'''
    for level in hierarchy:
        location_id = location_info.get(level + 'ID', '')
        if location_id:
            return location_id
    raise ValueError('All granularities are missing an ID.')


def _build_metrics_row(row, field_id, location_id):
    return {
        'location_id': location_id,
        'field_id': field_id,
        'value': float(row.metrics[field_id]),
        'source': row.source,
        'date': row.date,
    }


def _build_properties_row(row, field, location_id, fields_df):
    group = fields_df[fields_df['id'] == field]['group_id'].unique()
    if len(group) > 1:
        print('Multiple groups found for field: %s, groups: %s' % (field, group))
    return {
        'location_id': location_id,
        'field_id': group[0],
        'value': field,
        'source': row.source,
        'date': row.date,
    }


def compute_metrics_properties(
    location_mapping_file, input_file, fields_file, meta_row, hierarchy
):
    with open(location_mapping_file, 'r') as mapping_file, LZ4Reader(
        input_file
    ) as input_file:

        fields_df = pd.read_csv(fields_file)
        mapping_reader = csv.DictReader(mapping_file)
        canonical_mapping = build_canonical_mapping(mapping_reader, meta_row)
        failed_mappings = defaultdict(int)
        input_row_count = output_row_count = 0

        metrics = []
        properties = []
        for input_row in input_file:
            input_row_count += 1
            row = meta_row.from_json(input_row)

            mapping_id = row.mapping_id

            if mapping_id not in canonical_mapping:
                failed_mappings[mapping_id] += 1
                continue
            canonical_data = canonical_mapping[mapping_id]

            location_id = _get_location_id(canonical_data, hierarchy)
            # After canonical location info and lat/lon is determined for the row
            # it is split into 3 parts, the locations, metrics and properties.
            metrics.extend(
                [_build_metrics_row(row, field, location_id) for field in row.metrics]
            )
            properties.extend(
                [
                    _build_properties_row(row, field, location_id, fields_df)
                    for field in row.properties
                ]
            )
            output_row_count += 1

        print('Finished processing')
        print('Input rows processed: %s' % input_row_count)
        print('Output rows written: %s' % output_row_count)
        if failed_mappings:
            print('Canonical mapping is missing for these rows')
            print('Row location ID\tCount')
            for key, value in list(failed_mappings.items()):
                print('%s\t%s' % (key, value))
    return metrics, properties


def write_metrics_properties(metrics_file, properties_file, metrics, properties):
    metrics_writer = csv.DictWriter(
        open(metrics_file, 'w'), fieldnames=list(metrics[0].keys())
    )
    properties_writer = csv.DictWriter(
        open(properties_file, 'w'), fieldnames=list(properties[0].keys())
    )

    metrics_writer.writeheader()
    properties_writer.writeheader()

    for row in metrics:
        metrics_writer.writerow(row)
    for row in properties:
        properties_writer.writerow(row)
