#!/usr/bin/env python
import sys

import pandas as pd
from slugify import slugify

from pylib.base.flags import Flags


def main():
    Flags.PARSER.add_argument(
        '--input',
        type=str,
        required=True,
        help='Path to input CSV. File type can be: ' 'gzip compressed (.gz)',
    )
    Flags.PARSER.add_argument(
        '--disaggregation_columns',
        type=str,
        nargs='*',
        required=False,
        help='List of disaggregation dimensions columns, comma-separated',
    )
    Flags.PARSER.add_argument(
        '--field_columns',
        type=str,
        nargs='*',
        required=False,
        help='List of field columns to be disaggregated, comma-separated',
    )
    Flags.PARSER.add_argument(
        '--enable_field_wildcards',
        action='store_true',
        default=False,
        help='If true, unpivot all columns that begin with '
        '*field_ rather than specifying field names '
        'individually. Overrides --fields param',
    )
    Flags.PARSER.add_argument(
        '--output',
        type=str,
        required=True,
        help='Path to output CSV. File type can be: ' 'gzip compressed (.gz)',
    )
    Flags.InitArgs()

    dataframe = pd.read_csv(Flags.ARGS.input, compression='gzip')
    disaggregation_columns = Flags.ARGS.disaggregation_columns
    use_wildcard = Flags.ARGS.enable_field_wildcards
    field_columns = Flags.ARGS.field_columns
    if use_wildcard:
        field_columns = list(
            filter(lambda x: x.startswith('*field'), list(dataframe.columns))
        )
    for field in field_columns:
        for disaggregation in disaggregation_columns:
            for value in dataframe[disaggregation].unique():
                column_suffix = (
                    'none' if pd.isnull(value) else slugify(str(value), separator='_')
                )
                subset = (
                    dataframe[disaggregation].isnull()
                    if pd.isnull(value)
                    else dataframe[disaggregation] == value
                )
                new_column = '%s_%s_%s' % (field, disaggregation, column_suffix)
                dataframe[new_column] = dataframe[subset][field].reindex(
                    range(0, len(dataframe)), fill_value=''
                )

    dataframe.to_csv(Flags.ARGS.output, compression='gzip')


if __name__ == '__main__':
    sys.exit(main())
