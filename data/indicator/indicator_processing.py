from builtins import object
import re
from models.alchemy.indicator import Indicators, IndicatorGroups


class IndicatorTableGenerator(object):
    def __init__(self, groups, calculated_indicator_formulas, session):
        self.session = session
        self.groups = groups
        self.calculated_indicator_formulas = calculated_indicator_formulas

    def get_indicator_group(self, group_text_id):
        return (
            self.session.query(IndicatorGroups).filter_by(text_id=group_text_id).first()
        )

    def get_indicator(self, text_id):
        return self.session.query(Indicators).filter_by(text_id=text_id).first()

    def build_groups_table(self):
        # Extract the necessary group information from the provided
        # groups
        for group in self.groups:
            indicator_group = self.get_indicator_group(group['groupId'])
            if not indicator_group:
                indicator_group = IndicatorGroups(
                    text_id=group['groupId'], group_text=group['groupText']
                )
                self.session.add(indicator_group)

    def build_formula(self, formula):
        parser = IndicatorFormulaParser()
        for token in parser.read(formula):
            if token:
                indicator = self.get_indicator(token)
                if indicator:
                    formula = formula.replace(
                        token, 'zen_indicator_{id}'.format(id=indicator.id)
                    )
        return formula

    def build_indicators_table(self):
        for group in self.groups:
            group_id = group['groupId']
            indicator_group = self.get_indicator_group(group_id)
            for indicator in group['indicators']:
                indicator_text_id = indicator['id']
                simple_indicator = self.get_indicator(indicator_text_id)
                if not simple_indicator:
                    simple_indicator = Indicators(
                        text_id=indicator_text_id,
                        group_id=indicator_group.id,
                        text=indicator['text'],
                        formula=self.calculated_indicator_formulas.get(
                            indicator_text_id
                        ),
                    )
                    self.session.add(simple_indicator)

    def populate_indicator_table(self):
        self.build_indicators_table()
        self.session.commit()

    def populate_indicator_group_table(self):
        self.build_groups_table()
        self.session.commit()

    def populate_indicator_fields(self):
        for group in self.groups:
            for indicator in group['indicators']:
                simple_indicator = self.get_indicator(indicator['id'])
                constituents = indicator.get('constituents')
                if simple_indicator and constituents:
                    all_constituents = (
                        self.session.query(Indicators)
                        .filter(Indicators.text_id.in_(constituents))
                        .all()
                    )
                    simple_indicator.constituents = all_constituents
                formula = self.calculated_indicator_formulas.get(
                    simple_indicator.text_id
                )
                if formula:
                    new_formula = self.build_formula(formula)
                    simple_indicator.raw_formula = new_formula
                self.session.add(simple_indicator)
        self.session.commit()

    def populate_tables(self):
        # Since the Indicators table relies on the ids in the IndicatorGroups table
        # being populated, all of the group_id's that are referenced in the Indicators
        # must exist in the IndicatorGroups table before populating the Indicator table.
        self.populate_indicator_group_table()
        self.populate_indicator_table()
        self.populate_indicator_fields()


class IndicatorFormulaParser(object):
    def __init__(self):
        self._position = 0
        self._ch = None
        self._input = None
        self._read_position = 0

    def read(self, formula):
        self._input = formula
        for _ in range(len(self._input)):
            self.read_char()
            if self._ch.strip() in ['+', '-', '/', '*', '(', ')', '']:
                yield None
            else:
                ident = self.read_indentifier().strip()
                if ident.isdecimal():
                    yield None
                else:
                    yield ident

    @staticmethod
    def is_operand_char(ch):
        ch = ch.strip()
        return re.match(r'\w', ch) is not None

    def read_char(self):
        if self._read_position >= len(self._input):
            self._ch = ''
        else:
            self._ch = self._input[self._read_position]
        self._position = self._read_position
        self._read_position = self._read_position + 1

    def read_indentifier(self):
        position = self._position
        while self.is_operand_char(self._ch):
            self.read_char()
        return self._input[position : self._position]
