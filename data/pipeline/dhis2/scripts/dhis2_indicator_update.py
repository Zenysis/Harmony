#!/usr/bin/env python
# Comapare the indicator groups fetched from dhis2 to the indicators we are currently using
# in our platform. This is often importand because indicators and indicator groups often get
# created, changed, or deleted over time. Sometimes this is done all at ones, but often times
# they are slowly changed.
import csv
import importlib
import json
import sys

from typing import List

from pylib.base.flags import Flags
from log import LOG

GROUP_FIELDS_TO_CHANGE = ['groupId', 'groupText']
INDICATOR_FIELDS_TO_CHANGE = ['id', 'text']


def write_json(file_name: str, changes):
    json_data = json.dumps(changes, indent=4)
    with open(file_name, 'w') as output_file:
        output_file.write(json_data)


def write_csv(file_name: str, changes, columns: List[str]):
    with open(file_name, 'w') as output_file:
        writer = csv.DictWriter(output_file, fieldnames=columns, lineterminator='\n')
        writer.writeheader()
        for change in changes:
            writer.writerow(change)


def write_csv_outputs(output_csv_pattern: str, changes):
    complete_removed, complete_added, complete_changed = [], [], []
    for change in changes:
        removed, added, changed = change.to_dict()
        complete_removed.extend(removed)
        complete_added.extend(added)
        complete_changed.extend(changed)

    write_csv(
        output_csv_pattern.replace('#', 'removed'),
        complete_removed,
        GROUP_FIELDS_TO_CHANGE + INDICATOR_FIELDS_TO_CHANGE,
    )
    write_csv(
        output_csv_pattern.replace('#', 'added'),
        complete_added,
        GROUP_FIELDS_TO_CHANGE + INDICATOR_FIELDS_TO_CHANGE,
    )
    write_csv(
        output_csv_pattern.replace('#', 'changed'),
        complete_changed,
        ['groupText', 'old', 'new'],
    )


class DatasourceChanges:
    def __init__(self, name):
        self.name = name
        self.removed = []
        self.added = []
        self.changed = []

    def to_json_output(self):
        if not self.removed and not self.added and not self.changed:
            return {}
        return {
            'name': self.name,
            'removed': self.removed,
            'added': self.added,
            'changed': self.changed,
        }

    def to_dict(self):
        removed = [{'groupText': self.name, **r} for r in self.removed]
        added = [{'groupText': self.name, **a} for a in self.added]
        changed = [{'groupText': self.name, **c} for c in self.changed]
        return removed, added, changed


def build_group_changes(name, current_data, new_data, fields, group_id):
    # Create basic information about the changes that have happened to the indicators and
    # groups, this is useful information to have so that an engineer can communicate
    # to the project team about changes they are seeing in the indicator groups.
    # At a high level we want to be able to easily tell how many groups or indicators have been
    # added, removed, or changed.
    # current_data is either the lists of groups or the indicator groups themselves that we are
    # currently using.
    # new_data is the same shape as current data but it the most recent version coming from dhis2.
    # fields is the list of fields/keys we care about changing in the two objects
    changes = DatasourceChanges(name)
    for obj_id in current_data:
        current_obj = current_data[obj_id]
        base_info = {field: current_obj[field] for field in fields}
        new_obj = new_data.get(obj_id)
        if not new_obj:
            # The object has been removed
            changes.removed.append(base_info)
            continue

        new_base_info = {field: new_obj[field] for field in fields}
        for field in fields:
            if current_obj[field] != new_obj[field]:
                # This object has been modified in fields that matter. So we are going to
                # add it this object to the list of changes. Along with a reference to what
                # it used to be before the change.
                # If multiple fields have changed, then we just need to add it once.
                changes.changed.append({'old': base_info, 'new': new_base_info})
                break

    for added_obj_id in new_data.keys() - current_data.keys():
        added_obj = new_data[added_obj_id]
        # The object has added.
        new_base_info = {field: added_obj[field] for field in fields}
        new_base_info['groupId'] = group_id
        changes.added.append(new_base_info)

    return changes


def maybe_fail_to_alert(changes, added_threshold, removed_threshold):
    # Set up thresholds of what kind of indicator group changes will alert the pipeline
    # to tell an engineer that a significant amount of changes have occurred in dhis2 and
    # these should be updated
    removed_total = sum(len(change.removed) for change in changes)
    added_total = sum(len(change.added) for change in changes)
    changed_total = sum(len(change.changed) for change in changes)
    LOG.info(
        f'There have been {removed_total} indicators removed from DHIS2 since the last indicator refresh'
    )
    LOG.info(
        f'There have been {added_total} indicators added to DHIS2 since the last indicator refresh'
    )
    LOG.info(
        f'There have been {changed_total} indicators changed in DHIS2 since the last indicator refresh'
    )
    if removed_threshold > 0:
        assert (
            removed_total < removed_threshold
        ), 'Too many dhis2 indicators have been removed'
    if added_threshold > 0:
        assert (
            added_total < added_threshold
        ), 'Too many dhis2 indicators have been added'


def misc_filter(ind, group_id='dhis2_misc'):
    if ind['groupId'] == group_id:
        return False
    return True


def write_new_csv(changes, output_file, is_fields=True, filter_fn=lambda x: True):
    columns = [
        'id',
        'name',
        'short_name',
        'description',
        'calculation',
        'calculation_property',
        'calculation_sub_property',
        'category_id',
        'pipeline_datasource_id',
        'group_id',
        'group_text',
    ]
    output = []
    for group in changes:
        group_text = group.name
        for ind in filter(filter_fn, group.added):
            id = ind['id'] if is_fields else ind['groupId']
            name = ind['text'] if is_fields else ind['groupText']
            output.append(
                {
                    'id': id,
                    'name': name,
                    'short_name': name,
                    'group_id': ind['groupId'],
                    'group_text': group_text,
                    'description': '',
                    'calculation': 'SUM',
                    'calculation_property': '',
                    'calculation_sub_property': '',
                    'category_id': '',
                    'pipeline_datasource_id': '',
                }
            )

    write_csv(output_file, output, columns=columns)


def main():
    Flags.PARSER.add_argument(
        '--output_file', type=str, required=True, help='Location of the output file'
    )
    Flags.PARSER.add_argument(
        '--output_csv_pattern',
        type=str,
        required=True,
        help='Location of the output csv file',
    )
    Flags.PARSER.add_argument(
        '--current_indicator_groups_path',
        type=str,
        required=True,
        help='Location of current indicators',
    )
    Flags.PARSER.add_argument(
        '--new_indicator_groups_path',
        type=str,
        required=True,
        help='Location of the new indicators',
    )
    Flags.PARSER.add_argument(
        '--new_fields_path',
        type=str,
        required=True,
        help='Location of the added indicators',
    )
    Flags.PARSER.add_argument(
        '--new_groups_path',
        type=str,
        required=True,
        help='Location of the added groups',
    )
    Flags.PARSER.add_argument(
        '--current_group_variable',
        type=str,
        required=False,
        default='DHIS2_GROUPS',
        help='The variable that refers to the DHIS2_GROUPS in the config file.',
    )
    Flags.PARSER.add_argument(
        '--new_group_variable',
        type=str,
        required=False,
        default='DHIS2_GROUPS',
        help='The variable that refers to the DHIS2_GROUPS in the generated pipeline temp file.',
    )
    Flags.PARSER.add_argument(
        '--added_threshold',
        type=int,
        required=False,
        default=-1,
        help='The amount of new indicators we want to allow before failing',
    )
    Flags.PARSER.add_argument(
        '--removed_threshold',
        type=int,
        required=False,
        default=-1,
        help='The amount of deleted indicators we want to allow before failing',
    )
    Flags.PARSER.add_argument(
        '--calculated',
        type=bool,
        required=False,
        default=False,
        help='The amount of deleted indicators we want to allow before failing',
    )
    Flags.InitArgs()
    indicator_key = 'indicators'
    if Flags.ARGS.calculated:
        INDICATOR_FIELDS_TO_CHANGE.append('formula')
        indicator_key = 'calculated_indicators'
    current_group_variable = Flags.ARGS.current_group_variable
    new_group_variable = Flags.ARGS.new_group_variable

    current_source_loader = importlib.machinery.SourceFileLoader(
        current_group_variable,
        Flags.ARGS.current_indicator_groups_path,
    )
    current_datasets_module = current_source_loader.load_module()
    current_indicator_groups = getattr(current_datasets_module, current_group_variable)

    new_source_loader = importlib.machinery.SourceFileLoader(
        new_group_variable,
        Flags.ARGS.new_indicator_groups_path,
    )
    new_datasets_module = new_source_loader.load_module()
    new_indicator_groups = getattr(new_datasets_module, new_group_variable)

    current_group_id_lookup = {g['groupId']: g for g in current_indicator_groups}
    new_group_id_lookup = {g['groupId']: g for g in new_indicator_groups}

    group_level_changes = build_group_changes(
        'GROUPINGS',
        current_group_id_lookup,
        new_group_id_lookup,
        GROUP_FIELDS_TO_CHANGE,
        'GROUPINGS',
    )
    changes = [group_level_changes]
    for group_id in current_group_id_lookup:
        group = current_group_id_lookup[group_id]
        new_group = new_group_id_lookup.get(group_id, {})
        current_indicator_lookup = {ind['id']: ind for ind in group[indicator_key]}
        new_indicator_lookup = {
            ind['id']: ind for ind in new_group.get(indicator_key, [])
        }

        group_indicator_changes = build_group_changes(
            group['groupText'],
            current_indicator_lookup,
            new_indicator_lookup,
            INDICATOR_FIELDS_TO_CHANGE,
            group_id,
        )
        changes.append(group_indicator_changes)

    write_json(Flags.ARGS.output_file, [change.to_json_output() for change in changes])
    write_csv_outputs(Flags.ARGS.output_csv_pattern, changes)
    maybe_fail_to_alert(
        changes, Flags.ARGS.added_threshold, Flags.ARGS.removed_threshold
    )
    write_new_csv(changes[1:], Flags.ARGS.new_fields_path, filter_fn=misc_filter)
    write_new_csv([group_level_changes], Flags.ARGS.new_groups_path, is_fields=False)


if __name__ == '__main__':
    sys.exit(main())
