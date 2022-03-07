from unittest import TestCase
from unittest.mock import MagicMock

from data.pipeline.datatypes.matching_row import MatchingRow


class MatchingRowTestCase(TestCase):
    def test_create_from_dict(self):
        row_type = MagicMock()
        row_type.return_value.key = {}
        matching_row_dict = {"CanonicalTest": "value"}
        row_type.MAPPING_KEYS = ["Test"]
        result = MatchingRow.create_from_dict(matching_row_dict, row_type)
        self.assertEqual(
            result, MatchingRow(row_type.return_value, row_type.return_value)
        )

    def test_get_matching_key(self):
        self.assertEqual("CanonicalTest", MatchingRow._get_matching_key("Test"))
