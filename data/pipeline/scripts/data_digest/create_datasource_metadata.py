#!/usr/bin/env python

import csv
import sys
from log import LOG

from pylib.base.flags import Flags


from util.file.file_config import FilePattern


SOURCE_NAME = 'source'
FIELD_NAMES = ['indicator_id', 'count', 'start_date', 'end_date']


def write_source_metadata(output_file: str, input_file: str, source: str):
    with open(output_file, 'w') as out_file, open(input_file, 'r') as in_file:
        writer = csv.DictWriter(
            out_file,
            fieldnames=FIELD_NAMES,
            extrasaction='ignore',
        )
        writer.writeheader()
        reader = csv.DictReader(in_file)
        for row in reader:
            if row['source'] == source:
                writer.writerow(
                    {
                        'indicator_id': row['indicator_id'],
                        'count': row['count'],
                        'start_date': row['start_date'],
                        'end_date': row['end_date'],
                    }
                )


def main():
    '''From a general metadata file, create a metadata file with all

    To run:
        ./scripts/data_digest/create_datasource_metadata --input_file=metadata_digest_file.csv \
         --output_file=source_metadata_digest.csv --sources=self_serve
    '''
    Flags.PARSER.add_argument(
        '--output_file_pattern', type=str, required=True, help='Pattern of output files'
    )

    Flags.PARSER.add_argument(
        '--input_file', type=str, required=False, help='Input CSV file to parse'
    )

    Flags.PARSER.add_argument(
        '--sources',
        nargs='+',
        type=str,
        required=True,
        help='List of sources to process',
    )
    Flags.InitArgs()
    output_pattern = FilePattern(Flags.ARGS.output_file_pattern)
    for source in Flags.ARGS.sources:
        LOG.info('Processing Metadata for %s', source)
        write_source_metadata(
            output_pattern.build(source), Flags.ARGS.input_file, source
        )


if __name__ == '__main__':
    sys.exit(main())
