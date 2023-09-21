#!/usr/bin/env python
'''
Translates a .csv.gz file, translating indicators and dimenisons to english.
Returns an unpivoted translated file ready for the pipeline
Usage:  ./translate_csv.py --translation foreign_text:english_value ... \
                           --input <path-to-input-file> \
                           --output <path-to-output-file>
'''

import sys

import pandas as pd
from pylib.base.flags import Flags
from util.credentials.generate import ALPHANUMERIC_CHARSET
from log import LOG


def setup_flags():
    Flags.PARSER.add_argument(
        '--input',
        type=str,
        required=True,
        help='Path to input CSV. File type can be: ' 'gzip compressed (.gz)',
    )
    Flags.PARSER.add_argument(
        '--translations',
        type=str,
        nargs='*',
        required=False,
        help='List of translation keys from foreign language (exact), comma-separated',
    )
    Flags.PARSER.add_argument(
        '--output',
        type=str,
        required=True,
        help='Path to output CSV. File type can be: ' 'gzip compressed (.gz)',
    )
    Flags.InitArgs()


def parse_translations(translations_list: list) -> dict:
    translations = {}
    for translation in translations_list:
        key, value = [s.strip() for s in translation.split(':')]
        translations[key] = value
    return translations


def process_translations(input_file: str, output_file: str, translations: dict):
    dataframe: pd.DataFrame = pd.read_csv(input_file, compression='gzip')
    missing_translations = set()
    translations_found = 0
    LOG.info('Starting translating step')
    for index, row in dataframe.iterrows():
        replacement_row = {}
        for key in row.keys():
            val = row[key]
            replacement_row[key] = val
            if isinstance(val, str):
                # only check translations for strings not in alphabet since
                # string.isalnum() returns True for Amahric as well
                # raise an exception if a match is not found
                if val[0] not in ALPHANUMERIC_CHARSET:
                    translation = translations.get(val, None)
                    if not translation:
                        missing_translations.add(val)
                    else:
                        translations_found += 1
                        replacement_row[key] = translation
        dataframe.loc[index] = replacement_row

    if len(missing_translations) > 0:
        LOG.error(
            'Missing translations encountered: %s', ', '.join(missing_translations)
        )
        raise ValueError(
            f'The following translations are missing: {missing_translations}'
        )

    LOG.info('Finished translation step. Translations found: %d', translations_found)
    dataframe.to_csv(output_file, index=False, compression='gzip')


def main():
    setup_flags()
    translations = parse_translations(translations_list=Flags.ARGS.translations)
    process_translations(
        input_file=Flags.ARGS.input,
        output_file=Flags.ARGS.output,
        translations=translations,
    )


if __name__ == '__main__':
    sys.exit(main())
