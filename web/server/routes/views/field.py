from builtins import str, object
import json
import re

from io import StringIO
from flask import current_app

from db.druid.query_builder import GroupByQueryBuilder
from util.file.unicode_csv import UnicodeDictWriter
from web.server.util.indicators import get_indicator_by_id, get_indicator_groups

ISO_DATETIME_FORMAT = '%Y-%m-%d'


# TODO(ian,stephen,toshi) - A parting gift from Vedant. Please make this a Potion API.
class FieldSummary(object):
    def __init__(
        self,
        field_id,
        count=0,
        start_date=None,
        end_date=None,
        formula=None,
        human_readable_formula=None,
    ):
        self.field_id = field_id
        self.count = count
        self.start_date = start_date
        self.end_date = end_date
        self.formula = formula
        self.human_readable_formula = human_readable_formula

    def to_json(self):
        # JSON consumed by the frontend is camelCased.
        return {
            'startDate': (
                self.start_date.strftime(ISO_DATETIME_FORMAT)
                if self.start_date
                else None
            ),
            'endDate': (
                self.end_date.strftime(ISO_DATETIME_FORMAT) if self.end_date else None
            ),
            'count': self.count,
            'formula': self.formula,
            'humanReadableFormulaHtml': self.human_readable_formula,
        }

    def __str__(self):
        return json.dumps(self.to_json(), indent=2)


class FieldsApi(object):
    def __init__(self, row_count_lookup):
        self.indicator_group_definitions = get_indicator_groups()
        self.row_count_lookup = row_count_lookup

    def get_indicator_formula(self, field_id):
        indicator = get_indicator_by_id(field_id, {'formula'})
        formula = indicator.get('formula') if indicator else None
        return formula

    def get_human_readable_formula_html(self, field_id):
        formula = self.get_indicator_formula(field_id)
        if not formula:
            return None
        matches = re.findall(r'\w+', formula)

        if not matches:
            return None

        ret = formula[:]
        ret = (
            ret.replace(' ', '')
            .replace('+', ' + ')
            .replace('-', ' - ')
            .replace('/', ' / ')
            .replace('*', ' * ')
        )
        for constit_field_id in set(matches):
            ind = get_indicator_by_id(constit_field_id)
            if ind:
                ret = ret.replace(constit_field_id, '<span>%s</span>' % ind['text'])
        return ret

    def get_field_summary(self, field_id):
        druid_context = current_app.druid_context
        # Simulate building a query so we can access the query filter this field
        # would normally use.
        calculation = current_app.zen_config.aggregation_rules.get_calculation_for_fields(
            [field_id]
        )
        interval = druid_context.data_time_boundary.get_full_time_interval()
        # HACK(ian): Setting granularity to month so that type=STOCK
        # aggregations are counted properly. This fails for
        # stock_granularity!=month, but there are very few of those.
        query = GroupByQueryBuilder('', 'month', [], [interval], calculation)

        # TODO(stephen): These values will be underreported for time interval
        # aggregations. Fix this.
        time_boundary = druid_context.data_time_boundary.get_field_time_boundary(
            field_id, query.query_filter
        )
        total_count = druid_context.row_count_lookup.get_row_count(
            query.query_filter, field_id
        )
        if not time_boundary or not total_count:
            return FieldSummary(field_id, 0)

        human_readable_formula = self.get_human_readable_formula_html(field_id)
        if not total_count:
            return FieldSummary(
                field_id, 0, human_readable_formula=human_readable_formula
            )

        return FieldSummary(
            field_id,
            total_count,
            time_boundary['min'],
            time_boundary['max'],
            formula=self.get_indicator_formula(field_id),
            human_readable_formula=human_readable_formula,
        )

    def get_field_to_name_csv(self):
        '''Returns a CSV mapping field id to name.
        '''
        ret = StringIO()
        w = UnicodeDictWriter(ret, fieldnames=['groupId', 'groupText', 'id', 'text'])
        w.writeheader()
        for group in current_app.zen_config.indicators.GROUP_DEFINITIONS:
            for ind in group['indicators']:
                w.writerow(
                    {
                        'groupId': group['groupId'],
                        'groupText': str(group['groupText']),
                        'id': ind['id'],
                        'text': str(ind['text']),
                    }
                )
        return ret.getvalue()
