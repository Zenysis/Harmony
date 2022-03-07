from builtins import str
from builtins import object
from operator import itemgetter
import numpy as np
import pandas as pd

from data.query.models.query_filter import AndFilter, IntervalFilter, OrFilter
from db.druid.util import build_time_interval


def join_str_columns(df, columns, sep=', '):
    '''Return a Series with the specified columns joined by the separator.'''
    if len(columns) == 1:
        return df[columns[0]].fillna('null')

    # NOTE(stephen): The na_rep value of an empty string might produce a weird
    # result with multiple `sep` in a row. This could look weird on the
    # frontend.
    return df[columns[0]].str.cat(df[columns[1:]], sep=sep, na_rep='null')


def build_key_column(
    orig_df, column_name, grouping_dimensions, label_dimensions=None, sep=', '
):
    '''Create a unique column that is unique for the queried set of dimensions.

    If label dimensions are specified, try to build the unique key using just
    those dimensions. For rows where the label dimensions result in duplicates,
    include all grouping dimensions in the key name to ensure the uniqueness.'''

    # Sort the dataframe so that keyws are set deterministically.  Otherwise
    # you're going to run into CRAZY bugs where sequential calls to
    # build_key_column construct keys inconsistently, and the frontend will
    # break because the response references keys that don't exist in other
    # parts of the response.
    # TODO(ian): Remove this once it becomes impossible to set incomplete label
    # dimensions (ie, once everything is on AQT)
    df = orig_df.sort_values(by=grouping_dimensions)

    # Get the unique dimension columns grouped by in the query.
    # NOTE(stephen): Dropping duplicates since the query might have had a
    # granularity different than "all".
    label_df = df[grouping_dimensions].drop_duplicates()

    # If no label dimensions are specified, use the grouping dimensions.
    label_dimensions = label_dimensions or grouping_dimensions
    label_df[column_name] = join_str_columns(df, label_dimensions, sep)

    # Find instances where the key is not unique. Includes all occurrences of the
    # duplicate key, including the first instance.
    duplicate_labels_df = label_df[label_df[column_name].duplicated(keep=False)]

    if not duplicate_labels_df.empty:
        # For the non-unique labels, attach additional grouped dimensions to
        # make the key unique. The template is:
        # label_dim_1, label_dim_2, ... (group_dim_1, group_dim_2, ...)
        extra_columns = [d for d in grouping_dimensions if d not in label_dimensions]
        label_df.loc[duplicate_labels_df.index, column_name] = (
            duplicate_labels_df['key']
            + ' ('
            + join_str_columns(duplicate_labels_df, extra_columns, sep)
            + ')'
        )

    # Use the grouping dimensions as the index so that the key column can be
    # easily joined to the result dataframe.
    label_df.set_index(grouping_dimensions, inplace=True)
    return label_df


# HACK(stephen): This is a really dirty workaround for NaN, Infinity,
# -Infinity. Since Flask's jsonify passes those values as valid JSON, we must
# remove them before serialization. Right now, there is no central way to do
# this at the flask level, so we are doing it here. This is really dirty because
# it converts the column from a float to an object.
def clean_df_for_json_export(df):
    if df is not None and not df.empty:
        # Convert inf/-inf into NaN since we want to cast all of those values to None.
        df = df.replace((np.inf, -np.inf), np.nan)

        # Find the all NaN values in the dataframe.
        non_null_mask = pd.notnull(df)

        # Find which columns have NaN values.
        # First build a mapping from column name to True/False where True indicates that
        # the column has NaN values.
        column_has_nan_mapping = ~(non_null_mask.all())

        # Next, build a list of columns that have NaN values (technically it is a pandas
        # Index, but it doesn't really matter).
        columns_with_nan = column_has_nan_mapping[column_has_nan_mapping].index

        # If no columns have NaN values, we can return.
        if columns_with_nan.empty:
            return df

        # To fully replace NaN values with None in the dataframe, we must first convert
        # the columns from a numeric type to `object`. If we don't convert the columns,
        # then pandas will cast None to NaN if we try to assign it.
        dtype_map = {column: 'object' for column in columns_with_nan}

        # Finally, remap the column types and then replace all NaN values with None.
        return df.astype(dtype_map, copy=False).where(non_null_mask, None)
    return df


def collapse_intervals(intervals):
    '''Collapse all overlapping intervals in the provided intervals list into
    a minimal set of intervals.
    '''
    if len(intervals) <= 1:
        return intervals

    output = []
    sorted_intervals = sorted(intervals, key=itemgetter(0, 1))
    cur_interval = sorted_intervals[0]
    for interval in sorted_intervals:
        (cur_start, cur_end) = cur_interval
        (next_start, next_end) = interval
        # If the next interval overlaps with the current interval, extend
        # the current interval to include the next interval.
        if next_start >= cur_start and next_start <= cur_end:
            cur_interval = (cur_start, max(cur_end, next_end))
        else:
            output.append(cur_interval)
            cur_interval = interval

    # Ensure the last interval is written.
    output.append(cur_interval)
    return output


def find_interval_intersection(lhs, rhs):
    '''Find the overlapping intervals between the two provided interval lists.'''
    if not lhs or not rhs:
        return []

    sorted_lhs = sorted(lhs, key=itemgetter(0, 1))
    sorted_rhs = sorted(rhs, key=itemgetter(0, 1))
    intervals = []
    for interval_lhs in sorted_lhs:
        for interval_rhs in sorted_rhs:
            (lhs_start, lhs_end) = interval_lhs
            (rhs_start, rhs_end) = interval_rhs
            # If the lhs interval is strictly less than the rhs, then we can
            # break out and move on to the next lhs interval.
            if lhs_end < rhs_start:
                break

            # If the rhs interval is strictly less than the lhs, then we should
            # continue until we reach an interval that overlaps with the current
            # lhs interval.
            if rhs_end < lhs_start:
                continue

            intersection = (max(lhs_start, rhs_start), min(lhs_end, rhs_end))
            assert intersection[0] < intersection[1], 'Huh: %s' % str(intersection)
            intervals.append(intersection)
    return collapse_intervals(intervals)


class FilterTree(object):
    '''The FilterTree is used for parsing an AQT query filter to produce the
    date intervals needed for a query.
    '''

    def __init__(self, query_filter):
        self.affects_all_leaves = False
        self.intervals = []
        self.all_time = False

        if isinstance(query_filter, IntervalFilter):
            self.affects_all_leaves = True
            self.intervals = [(query_filter.start, query_filter.end)]
        elif isinstance(query_filter, (AndFilter, OrFilter)):
            self.affects_all_leaves = isinstance(query_filter, AndFilter)
            cls = type(self)

            is_first = True
            for field in query_filter.fields:
                child = cls(field)

                # If this is the first child to process, merge it into this node
                # as the starting intervals.
                if is_first:
                    self.merge(child)
                    is_first = False
                    continue

                if self.affects_all_leaves:
                    self.intersect(child)
                else:
                    self.merge(child)
                    # Shortcut. If the child node represents "all time"
                    # intervals and this node ORs children together, then the
                    # result is all time intervals can be supported on this node
                    # as well and we can return.
                    if self.all_time:
                        return
        else:
            self.all_time = True

    def intersect(self, other):
        # If the other filter represents "all time", then we should just keep our
        # intervals.
        if other.all_time:
            return

        # If we support "all time", then we should take the other node's
        # intervals. This node will no longer represent "all time" intervals and
        # will just represent the other node's intervals.
        if self.all_time:
            self.all_time = False
            self.intervals = other.intervals
            return

        # Otherwise, find the intersection between the other filter's intervals
        # and our own.
        self.intervals = find_interval_intersection(self.intervals, other.intervals)

    def merge(self, other):
        # If either node supports "all time" intervals, this means our node
        # will support it as well after merging.
        if other.all_time or self.all_time:
            self.all_time = True
            self.intervals = []
            return

        # Otherwise, merge the intervals between the two nodes.
        self.intervals = collapse_intervals(self.intervals + other.intervals)

    def _get_tree_intervals(self):
        if not self.intervals:
            assert self.affects_all_leaves, 'Impossible!'
            return []

        return collapse_intervals(self.intervals)

    def to_druid_intervals(self):
        if self.all_time:
            return []

        intervals = self._get_tree_intervals()
        return [build_time_interval(*i) for i in intervals]
