from unittest import TestCase

from data.matching.matching_tree import FUZZY_MATCH_SCORE_NAME
from data.pipeline.datatypes.match_stats import MatchStats


class MatchStatsTestCase(TestCase):
    def setUp(self) -> None:
        self.match_stats = MatchStats([])

    def test_build_dimension_data(self):
        self.match_stats._dimensions = ['test']
        input_row = {'test': 'input'}
        output_row = {'test': 'output'}
        self.assertListEqual(
            ['input', 'output'],
            self.match_stats.build_dimension_data(input_row, output_row),
        )

    def test_get_output_rows(self):
        self.match_stats._output_row_collector = "test"
        self.assertEqual("test", self.match_stats.get_output_rows())

    def test_store_match_updates_failures_when_key_not_in_output(self):
        self.match_stats._dimensions = ['test']
        input_row = {'test': 'input'}
        output_row = {}
        metadata = {}
        failures = self.match_stats._failure
        self.match_stats.store_match(input_row, output_row, metadata)
        self.assertEqual(failures + 1, self.match_stats._failure)

    def test_store_match_updates_success_when_key_in_output(self):
        self.match_stats._dimensions = ['test']
        input_row = {'test': 'input'}
        output_row = {'test': 'output'}
        metadata = {}
        success = self.match_stats._success
        self.match_stats.store_match(input_row, output_row, metadata)
        self.assertEqual(success + 1, self.match_stats._success)

    def test_store_match_with_source_name(self):
        self.match_stats._dimensions = ['test']
        input_row = {'test': 'input'}
        output_row = {'test': 'output'}
        metadata = {FUZZY_MATCH_SCORE_NAME: 1}
        self.match_stats._source_name = 'test_source'
        self.match_stats.store_match(input_row, output_row, metadata)
        self.assertListEqual(
            [['test_source', True, True, 1, 'test', 'input', 'input', 'output']],
            self.match_stats._output_row_collector,
        )
