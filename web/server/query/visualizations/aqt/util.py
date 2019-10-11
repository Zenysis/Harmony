from builtins import str
from builtins import object
from operator import itemgetter

from data.wip.models import AndFilter, IntervalFilter, OrFilter
from db.druid.util import build_time_interval


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
    '''Find the overlapping intervals between the two provided interval lists.
    '''
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
