#!/usr/bin/env python

# mypy: disallow_untyped_defs=True
import argparse
import csv
import subprocess
import sys
from typing import List, Dict

from config.zm.aggregation import GEO_FIELD_ORDERING
from log import LOG


def get_missing_levels(
    geo_field_ordering: List[str], fieldnames: List[str], level_to_unify: str
) -> List[str]:
    """Get missing levels from fieldnames.

    Args:
        geo_field_ordering (list): List of geo fields from least specific to most specific.
        fieldnames (list): List of fieldnames.
        level_to_unify (str): Level to unify.

    Returns:
        list: List of missing levels.
    """
    missing_levels = []
    level_to_unify_index = geo_field_ordering.index(level_to_unify)
    for index, geo_field in enumerate(geo_field_ordering):
        if geo_field not in fieldnames and index < level_to_unify_index:
            missing_levels.append(geo_field)
    return missing_levels


def rename_old_path(old_path: str, new_path: str) -> None:
    """Rename old path to new path.

    Args:
        old_path (str): Old path.
        new_path (str): New path.
    """
    LOG.info("Renaming %s to %s", old_path, new_path)
    subprocess.check_output(f"mv {old_path} {new_path}", shell=True)


def get_level_map(
    mapping_file_path: str, level_to_unify: str, missing_levels: List[str]
) -> Dict[str, Dict[str, str]]:
    """We create a dict where each location to unify is a key and any of the matching values for the
    location. This will allow us to lookup quickly.

    Args:
        mapping_file_path (str): Path to mapping file.
        level_to_unify (str): Level to unify.
        missing_levels (list): List of missing levels.

    Returns:
        dict: Level map.
    """
    level_map = {}
    with open(mapping_file_path) as mapping_file:
        mapping_csv = csv.DictReader(mapping_file)
        keys = [level_to_unify] + [
            field for field in mapping_csv.fieldnames if field.startswith("match_")
        ]
        for row in mapping_csv:
            missing_levels_dict = {level: row.get(level) for level in missing_levels}
            for key in keys:
                level_map[row[key]] = missing_levels_dict
    return level_map


def unify_hierarchy(
    mapping_file_path: str,
    input_file_path: str,
    output_file_path: str,
    level_to_unify: str,
) -> None:
    """Unify location hierarchy according to mapping file.

    Args:
        mapping_file_path (str): Path to mapping file.
        input_file_path (str): Path to input file.
        output_file_path (str): Path to output file.
        level_to_unify (str): Level to unify.
    """
    LOG.info("Unifying location hierarchy for %s", level_to_unify)
    with open(input_file_path) as input_file, open(
        output_file_path, "w"
    ) as output_file:
        input_csv = csv.DictReader(input_file)

        missing_levels = get_missing_levels(
            GEO_FIELD_ORDERING, list(input_csv.fieldnames), level_to_unify
        )
        if not missing_levels:
            LOG.info("No missing levels found")
            rename_old_path(input_file_path, output_file_path)
            return
        LOG.info("Missing levels: %s", missing_levels)
        fieldnames = list(input_csv.fieldnames)
        level_to_unify_index = fieldnames.index(level_to_unify)
        fieldnames = (
            fieldnames[:level_to_unify_index]
            + missing_levels
            + fieldnames[level_to_unify_index:]
        )
        output_csv = csv.DictWriter(output_file, fieldnames=fieldnames)
        output_csv.writeheader()

        level_map = get_level_map(mapping_file_path, level_to_unify, missing_levels)
        for row in input_csv:
            row.update(level_map.get(row[level_to_unify], {}))
            row['level'] = int(row['level']) + len(missing_levels)
            output_csv.writerow(row)
    LOG.info("Unifying location hierarchy for %s complete", level_to_unify)


def main() -> int:
    args_parser = argparse.ArgumentParser()
    args_parser.add_argument("--mapping_file_path", type=str, required=True)
    args_parser.add_argument("--input_file_path", type=str, required=True)
    args_parser.add_argument("--output_file_path", type=str, required=True)
    args_parser.add_argument("--level_to_unify", type=str, required=True)
    args = args_parser.parse_args()

    unify_hierarchy(
        args.mapping_file_path,
        args.input_file_path,
        args.output_file_path,
        args.level_to_unify,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
