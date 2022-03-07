from builtins import object
from data.pipeline.datatypes.base_row import BaseRow


class RowMerger(object):
    def __init__(self, base_row, value_merge_fn):
        assert isinstance(
            base_row, BaseRow
        ), 'RowMerger must be called with rows that inherit from BaseRow'
        self._merged_row = base_row
        self._value_merge_fn = value_merge_fn

    def add_row(self, new_row):
        for key, new_value in new_row.data.items():
            # For existing keys, aggregate the data
            if key in self._merged_row.data:
                self._merged_row.data[key] = self._value_merge_fn(
                    key, self._merged_row.data[key], new_value
                )
            else:
                # For new keys, simply store
                self._merged_row.data[key] = new_value

    def get_merged_row(self):
        return self._merged_row
