#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
'''A script to combine the field metadata and do some final processing.

NOTE: This script currently expects field metadata to be fully populated and have
all attributes and a category. One day, if that is not the case, then this code
should be updated to handle that.
'''
import argparse
import csv
import sys
from os import listdir
from os.path import isfile, join
from typing import Dict, List, Set

from data.pipeline.field_setup.util import (
    CATEGORY_COLUMNS,
    METADATA_COLUMNS,
    ZenCategory,
    ZenField,
    shorten_field_name,
)
from log import LOG


def recursively_add_categories(
    category_id: str,
    categories: Dict[str, ZenCategory],
    db_category_ids: Set[str],
    new_category_ids: List[str],
) -> None:
    '''Recursively add categories to the set of new category ids until the parent id is in
    the set of db category ids. Add the parents first so the list will be topologically
    sorted.'''
    assert category_id in categories, f'Unknown category id: {category_id}'
    category = categories[category_id]
    if category['parent_id'] not in db_category_ids:
        recursively_add_categories(
            category['parent_id'],
            categories,
            db_category_ids,
            new_category_ids,
        )

    if category_id not in new_category_ids:
        new_category_ids.append(category_id)


def process_and_output_fields_and_categories(
    fields: List[ZenField],
    db_category_ids: Set[str],
    categories: Dict[str, ZenCategory],
    output_field_file_name: str,
    output_category_file_name: str,
) -> None:
    '''Do some additional processing on the fields: shortening the field name, etc.
    and output the fields to a file.'''
    # Using a list here to preserve insertion order
    new_category_ids: List[str] = []
    with open(output_field_file_name, 'w') as output_fields_file:
        writer = csv.DictWriter(output_fields_file, fieldnames=METADATA_COLUMNS)
        writer.writeheader()
        for field in fields:
            # Try to shorten the field name using the category name
            new_short_field_name = shorten_field_name(
                field['name'], categories[field['category_id']]['name']
            )
            if new_short_field_name is not None:
                field['short_name'] = new_short_field_name

            category_id = field['category_id']
            if category_id not in db_category_ids:
                recursively_add_categories(
                    category_id, categories, db_category_ids, new_category_ids
                )

            writer.writerow(field)

    with open(output_category_file_name, 'w') as output_categories_file:
        writer = csv.DictWriter(output_categories_file, fieldnames=CATEGORY_COLUMNS)
        writer.writeheader()
        for category_id in new_category_ids:
            writer.writerow(categories[category_id])
        LOG.info('Found %d new categories', len(new_category_ids))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input_metadata_dir',
        type=str,
        required=True,
        help='The input file for the directory with the field and category metadata files',
    )
    parser.add_argument(
        '--input_db_categories_file',
        type=str,
        required=True,
        help='The input file for category ids from the database',
    )
    parser.add_argument(
        '--output_field_file',
        type=str,
        required=True,
        help='The output file for field metadata',
    )
    parser.add_argument(
        '--output_category_file',
        type=str,
        required=True,
        help='The output file for category metadata',
    )
    args = parser.parse_args()

    # We are going to be fetching files from probably multiple datasources, we can merge
    # all of the files together for processing here.
    input_file_dir = args.input_metadata_dir
    input_field_files = [
        join(input_file_dir, f)
        for f in listdir(input_file_dir)
        if isfile(join(input_file_dir, f)) and f.endswith('field_metadata.csv')
    ]
    input_category_files = [
        join(input_file_dir, f)
        for f in listdir(input_file_dir)
        if isfile(join(input_file_dir, f)) and f.endswith('category_metadata.csv')
    ]
    fields: List[ZenField] = []
    for input_file_path in input_field_files:
        with open(input_file_path, 'r') as input_file:
            LOG.info('Loading file: %s', input_file_path)
            reader = csv.DictReader(input_file)
            assert (
                reader.fieldnames == METADATA_COLUMNS
            ), f'Incorrectly formatted field file: {input_file_path}'
            fields.extend(reader)  # type: ignore[arg-type]
    categories: Dict[str, ZenCategory] = {}
    for input_file_path in input_category_files:
        with open(input_file_path, 'r') as input_file:
            LOG.info('Loading file: %s', input_file_path)
            reader = csv.DictReader(input_file)
            assert (
                reader.fieldnames == CATEGORY_COLUMNS
            ), f'Incorrectly formatted category file: {input_file_path}'
            for row in reader:
                categories[row['id']] = row  # type: ignore[assignment]

    # Process and output fields and categories
    db_category_ids = set()
    with open(args.input_db_categories_file, 'r') as input_db_categories_file:
        category_reader = csv.reader(input_db_categories_file)
        # Skip the header
        next(category_reader)
        for line in category_reader:
            db_category_ids.add(line[0])

    process_and_output_fields_and_categories(
        fields,
        db_category_ids,
        categories,
        args.output_field_file,
        args.output_category_file,
    )
    return 0


if __name__ == '__main__':
    sys.exit(main())
