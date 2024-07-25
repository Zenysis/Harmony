#!/usr/bin/env python
'''Wrapper for process_csv for self serve. Formats arguments from the source config
file to be passed to the Aggregator class.

Currently only supports pivoted input data.
'''
import os
import sys
from typing import TYPE_CHECKING, List, Tuple

import related
from pylib.base.flags import Flags

from config.datatypes import DimensionFactoryType
from data.pipeline.scripts.process_csv import Aggregator
from data.pipeline.self_serve.types import ColumnNameMapping, SourceConfigType
from log import LOG

# TODO: Upgrade the Python version on the pipeline machines to
# be 3.8 or greater.
if TYPE_CHECKING:
    from typing import TypedDict
else:
    TypedDict = dict


# NOTE: will have to reformat once unpivoted data is supported
class AggregatorArgs(TypedDict):
    datecol: str
    source: str
    output_field_prefix: str
    dimensions: List[str]
    fields: List[str]


def get_col_mapping_outputs(mappings: List[ColumnNameMapping]) -> List[str]:
    '''Gets the output (canonical) column names'''
    return [col_mapping.output_name for col_mapping in mappings]


def get_aggregator_args(config: SourceConfigType) -> AggregatorArgs:
    '''Set up the arguments for Aggregator.'''
    return {
        'datecol': config.date_column,
        'source': config.source,
        # NOTE: Since the field_ids are selected in the frontend, they already
        # contain the prefix in them. Therefore, we don't add them in here.
        'output_field_prefix': '',
        'dimensions': get_col_mapping_outputs(config.dimensions),
        'fields': get_col_mapping_outputs(config.fields),
    }


def get_col_rename_values(mappings: List[ColumnNameMapping]) -> List[Tuple[str, str]]:
    '''Gets the column rename mappings for Aggregator, formatted as (OriginalName, NewName).'''
    return [
        (mapping.input_name, mapping.output_name)
        for mapping in mappings
        if mapping.input_name != mapping.output_name
    ]


def get_rename_cols(config: SourceConfigType) -> List[Tuple[str, str]]:
    '''Gets the Aggregator column rename mappings for any of the config inputs
    that need to be mapped (currently fields and dimensions)
    '''
    return [
        *get_col_rename_values(config.fields),
        *get_col_rename_values(config.dimensions),
    ]


def process_source(
    input_dir, output_locations, output_fields, output_rows, output_non_hierarchical
):
    with open(os.path.join(input_dir, 'config.json')) as config_file:
        config = related.from_json(config_file, SourceConfigType)
        config_args = get_aggregator_args(config)

        agg = Aggregator(**config_args)
        rename_cols = get_rename_cols(config)
        # NOTE: Some input columns could have a colon, so just set the column
        # renames manually rather than using `agg.set_col_rename`.
        if rename_cols:
            for old, new in rename_cols:
                agg.col_rename[old] = new

        csv_filename = config.data_filename
        input_csv = os.path.join(input_dir, csv_filename)

        LOG.info('Starting CSV processing for %s.', config.source)
        agg.process(
            input_csv,
            output_rows,
            output_locations,
            output_fields,
            None,
            output_non_hierarchical,
        )
        agg.print_report()


def main():
    Flags.PARSER.add_argument(
        '--input_dir',
        type=str,
        required=True,
        help='Directory that contains necessary data and config files',
    )
    Flags.PARSER.add_argument(
        '--output_locations', type=str, required=True, help='Path to output locations'
    )
    Flags.PARSER.add_argument(
        '--output_fields', type=str, required=True, help='Path to output fields'
    )
    Flags.PARSER.add_argument(
        '--output_rows', type=str, required=True, help='Path to output rows json lz4'
    )
    Flags.PARSER.add_argument(
        '--output_non_hierarchical',
        type=str,
        required=bool(DimensionFactoryType.non_hierarchical_dimensions),
        help='Path to output non-hierarchical dimension values. This is only required '
        'if the deployment uses non-hierarchical dimensions.',
    )
    Flags.InitArgs()

    process_source(
        Flags.ARGS.input_dir,
        Flags.ARGS.output_locations,
        Flags.ARGS.output_fields,
        Flags.ARGS.output_rows,
        Flags.ARGS.output_non_hierarchical,
    )


if __name__ == '__main__':
    sys.exit(main())
