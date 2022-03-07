from builtins import object
from collections import defaultdict
from enum import Enum

from data.pipeline.datatypes.matching_row import MatchingRow
from data.pipeline.row_merger import RowMerger

# pylint: disable=W0613
def _simple_add(key, stored_value, new_value):
    return stored_value + new_value


# pylint: disable=R0903
class Strategy(Enum):
    JOIN_ID = 1
    MAPPING_ID = 2


class SourceMerger(object):
    def __init__(self, row_class, value_merge_fn=_simple_add):
        self._row_class = row_class
        self._value_merge_fn = value_merge_fn
        self._detect_overlapping_fields = True
        self._output = {}
        self._output_data_fields = set()
        self._failed_mappings = defaultdict(int)
        self._stored_rows = defaultdict(set)

    def process_source(
        self,
        source,
        source_rows,
        source_data_fields,
        mapping_rows,
        merge_strategy=Strategy.JOIN_ID,
    ):
        print('################ %s START ################' % source)

        # Process the matched location data
        canonical_mapping = self._build_canonical_mapping(mapping_rows)

        if self._detect_overlapping_fields:
            # Ensure that this new source will not overwrite values from
            # a previously processed source
            overlapping_fields = self._output_data_fields & source_data_fields
            assert len(overlapping_fields) == 0, (
                'Current source has conflicting fields that will overwrite '
                'data from previously processed source! '
                'Current source: %s\tHeaders: %s' % (source, overlapping_fields)
            )
        self._output_data_fields |= source_data_fields

        for row in source_rows:
            base_row = self._row_class.from_dict(row)
            mapping_id = base_row.mapping_id

            if mapping_id not in canonical_mapping:
                self._failed_mappings[mapping_id] += 1
                continue

            # Copy in canonical mapping for this row, preserving the date
            base_row.key = canonical_mapping[mapping_id].key
            if merge_strategy is Strategy.JOIN_ID:
                self._merge_in_row_on_join_id(base_row)
            elif merge_strategy is Strategy.MAPPING_ID:
                self._merge_in_row_on_mapping_id(base_row)
            else:
                assert False, (
                    'Invalid merge strategy chosen! ' 'Strategy: %s' % merge_strategy
                )

        print('################ %s END ################' % source)

    def prevent_overlapping_fields(self):
        self._detect_overlapping_fields = True

    def allow_overlapping_fields(self):
        self._detect_overlapping_fields = False

    def get_data_fields(self):
        return sorted(list(self._output_data_fields))

    def rows(self):
        return list(self._output.values())

    def print_failures(self):
        if self._failed_mappings:
            print('Canonical mapping is missing for these rows')
            print('Row location ID\tCount')
            for key, value in self._failed_mappings.items():
                print('%s\t%s' % (key, value))

    def _merge_in_row_on_join_id(self, row_to_merge):
        row_id = row_to_merge.row_id
        if row_id not in self._output:
            self._output[row_id] = RowMerger(row_to_merge, self._value_merge_fn)
            # Store a set of join_ids for a given mapping_id for convenience
            # when merging in rows just using mapping_id
            self._stored_rows[row_to_merge.mapping_id].add(row_id)
        else:
            self._output[row_id].add_row(row_to_merge)

    def _merge_in_row_on_mapping_id(self, row_to_merge):
        mapping_id = row_to_merge.mapping_id

        if mapping_id not in self._stored_rows:
            print(
                'Cannot merge in row on mapping id alone. '
                'Mapping ID is missing: %s' % mapping_id
            )
            return
        for join_id in self._stored_rows[mapping_id]:
            self._output[join_id].add_row(row_to_merge)

    def _build_canonical_mapping(self, mapping_rows):
        canonical_mapping = {}
        for row in mapping_rows:
            mapping_row = MatchingRow.create_from_dict(row, self._row_class)
            mapping_id = mapping_row.get_original_row().mapping_id
            canonical_mapping[mapping_id] = mapping_row.get_matched_row()

        return canonical_mapping
