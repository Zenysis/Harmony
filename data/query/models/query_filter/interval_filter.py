import related

from data.query.models.query_filter.query_filter import QueryFilter
from db.druid.util import build_interval_filter, build_time_interval

DATE_FORMAT = '%Y-%m-%d'


@related.immutable
class IntervalFilter(QueryFilter):
    '''The IntervalFilter model represents a filtering of a specific start date and end
    date for a dimension.
    '''

    start = related.DateField(DATE_FORMAT)
    end = related.DateField(DATE_FORMAT)
    type = related.StringField('INTERVAL')

    def to_druid(self):
        interval = build_time_interval(self.start, self.end)
        return build_interval_filter([interval])

    def is_valid(self):
        return self.start <= self.end


QueryFilter.register_subtype(IntervalFilter)
