from builtins import object

from data.matching.matching_tree import FUZZY_MATCH_SCORE_NAME


class MatchStats(object):
    def __init__(self, dimensions: list, source_name=''):
        '''
        Args:
            dimensions: list of dimension names in order of increasing
                granularity
        '''
        self._dimensions = dimensions
        self._failure = 0
        self._success = 0
        self._total = 0

        # NOTE(toshi): MatchStats is being used to store this data because
        # the way in which dimension collectors are set makes it difficult to
        # pass in data such as source when looping through multiple sources
        # Optional data used to output matching info to a file
        self._source_name = source_name
        self._output_row_collector = []

    def build_dimension_data(self, input_row: dict, output_row: dict):
        '''Builds dimension data in descending order from input and output rows.
        '''
        input_dimension_names = [
            input_row.get(dimension, '') for dimension in self._dimensions
        ]
        output_dimension_names = [
            output_row.get(dimension, '') for dimension in self._dimensions
        ]
        return input_dimension_names + output_dimension_names

    def store_match(self, input_row: dict, output_row: dict, metadata: dict):
        self._total += 1
        is_match_success = False
        match_level = ''
        # Traverse row from most granular to least granular. Find the most
        # granular non empty value in the original row. If a match is missing
        # at this level, consider the matched row to be a failure
        for key in reversed(self._dimensions):
            original_value = input_row.get(key)
            match_level = key
            if original_value:
                if not output_row.get(key):
                    self._failure += 1
                else:
                    self._success += 1
                    is_match_success = True
                break

        if self._source_name:
            fuzzy_match_score = metadata[FUZZY_MATCH_SCORE_NAME]
            self._output_row_collector.append(
                [
                    self._source_name,
                    is_match_success,
                    fuzzy_match_score != 0,
                    fuzzy_match_score,
                    match_level,
                    input_row[match_level],
                ]
                + self.build_dimension_data(input_row, output_row)
            )

    def get_output_rows(self):
        return self._output_row_collector

    def print_stats(self):
        print('** Total rows:\t%s' % self._total)
        print('** Fully Successful:\t%s' % self._success)
        print('** Partial Failure:\t%s' % self._failure)
