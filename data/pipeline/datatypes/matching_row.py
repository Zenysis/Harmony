class MatchingRow(dict):
    MATCHING_KEY_PREFIX = 'Canonical'

    def __init__(self, original_row, matched_row):
        super(MatchingRow, self).__init__()
        self._original_row = original_row
        self._matched_row = matched_row
        self._ordered_keys = self._create_matching_row(original_row, matched_row)

    def keys(self):
        return self._ordered_keys

    def get_matched_value(self, desired_field):
        matching_field = self._get_matching_key(desired_field)
        return self.get(matching_field)

    def get_original_row(self):
        return self._original_row

    def get_matched_row(self):
        return self._matched_row

    def _create_matching_row(self, original_row, matched_row):
        ordered_keys = []
        for key in original_row.MAPPING_KEYS:
            matching_key = self._get_matching_key(key)
            self[key] = original_row.key.get(key)
            self[matching_key] = matched_row.key.get(key)
            ordered_keys.append(matching_key)
        return ordered_keys + original_row.MAPPING_KEYS

    @classmethod
    # Utility method for converting a deserialized MatchingRow
    # (which is only seen as a dict) back into the full object
    def create_from_dict(cls, matching_row_dict, row_type):
        base_row = row_type()
        matched_row = row_type()
        for key in row_type.MAPPING_KEYS:
            matching_key = cls._get_matching_key(key)
            base_row.key[key] = matching_row_dict.get(key)
            matched_row.key[key] = matching_row_dict.get(matching_key)
        return cls(base_row, matched_row)

    @classmethod
    def _get_matching_key(cls, key):
        return '%s%s' % (cls.MATCHING_KEY_PREFIX, key)
