from builtins import object
from flask_user import current_user
from flask_potion import fields
from flask_potion.signals import before_update, before_create

from models.alchemy.indicator import IndicatorGroups, Indicators
from models.alchemy.history import HistoryRecord
from web.server.api.api_models import PrincipalResource
from web.server.data.data_access import Transaction
from web.server.util.util import as_dictionary
from data.indicator.indicator_processing import IndicatorFormulaParser


class IndicatorGroupResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the indicator groups
    '''

    class Meta(object):
        model = IndicatorGroups

    class Schema(object):
        textId = fields.String(
            description='The string id of an indicator', attribute='text_id'
        )
        groupText = fields.String(
            description='Indicator description text', attribute='group_text'
        )


class IndicatorResource(PrincipalResource):
    '''Potion class for performing CRUD operations on the Indicator Resource
    '''

    class Meta(object):
        title = 'Indicators API'
        description = (
            'The API through which CRUD operations can be performed on Indicators'
        )
        model = Indicators
        exclude_fields = ['raw_formula']

    class Schema(object):
        textId = fields.String(
            description='The string id of an indicator', attribute='text_id'
        )
        text = fields.String(description='Indicator description text', attribute='text')

        groupId = fields.Integer(
            description='Indicator group ID', attribute='group_id', io='w'
        )

        indicatorGroup = fields.ToOne(
            'indicator_groups', attribute='indicator_group', io='r'
        )

        constituents = fields.ToMany(
            'web.server.api.indicator_api_models.IndicatorResource'
        )


def update_formula(formula):
    if formula:
        parser = IndicatorFormulaParser()
        tokens = parser.read(formula)
        for token in tokens:
            indicator = Indicators.query.filter_by(text_id=token).first()
            if indicator:
                formula = formula.replace(
                    token, 'zen_indicator_{id}'.format(id=indicator.id)
                )
    return formula


# pylint: disable=W0613
# Suppressing this warning because this is the method signature for signal handlers.
@before_update.connect_via(IndicatorGroupResource)
@before_update.connect_via(IndicatorResource)
def before_(sender, item, changes):
    if 'formula' in changes and hasattr(item, 'raw_formula'):
        formula = changes.get('formula')
        item.raw_formula = update_formula(formula)
    with Transaction() as transaction:
        if hasattr(item, 'constituents'):
            constituents = [
                {'id': constituent.id, 'text_id': constituent.text_id}
                for constituent in item.constituents
            ]
            setattr(item, 'constituents', [])
            changes = as_dictionary(item)
            changes['constituents'] = constituents
        else:
            changes = as_dictionary(item)

        record = HistoryRecord(
            object_type=sender.meta.name,
            object_id=item.id,
            changes=changes,
            user_id=current_user.id,
        )
        transaction.add_or_update(record)


@before_create.connect_via(IndicatorResource)
def map_formula_to_raw_formula(sender, item):
    formula = item.formula
    item.raw_formula = update_formula(formula)


RESOURCE_TYPES = [IndicatorGroupResource, IndicatorResource]
