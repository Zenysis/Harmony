import operator
from builtins import object
import related
from related import to_model

from data.query.models import Field
from util.related.polymorphic_model import build_polymorphic_base


@related.immutable
class AlertCheck(build_polymorphic_base()):
    '''Parent object representation of a single Alert check'''

    # pylint: disable=no-self-use,unused-argument
    def evaluate(self, *args) -> bool:
        raise NotImplementedError('evaluate must be implemented by subclass.')

    def create_notification_msg(
        self, fields=None
    ) -> str:  # pylint: disable=no-self-use
        raise NotImplementedError(
            'create_notification_msg must be implemented by subclass.'
        )


EVAL_MAP = {
    '<': operator.lt,
    '>': operator.gt,
    '=': operator.eq,
    '<=': operator.le,
    '>=': operator.ge,
    '!=': operator.ne,
}


@related.immutable
class ThresholdCheck(AlertCheck):
    '''Object representation of a threshold Alert check. A threshold check determines if the
    value meets the condition defined by the operation and threshold for what is 'acceptable'.
    If any values are not within the threshold, alerts will be generated for these values.'''

    TYPE = 'THRESHOLD'

    operation = related.StringField()
    threshold = related.IntegerField()
    type = related.StringField(TYPE)

    def evaluate(self, reported_value: float) -> bool:
        return EVAL_MAP[self.operation](reported_value, self.threshold)

    def create_notification_msg(self, fields=None):
        '''Currently encompasses threshold and operation information'''
        return f'{self.operation} {self.threshold}'


AlertCheck.register_subtype(ThresholdCheck)


@related.immutable
class ComparativeCheck(AlertCheck):
    '''Object representation of a Comparative Alert check. A comparative check determines if two
    values in the order left and right meet the condition defined by the operation.
    If any pair of ordered values do not meet the condition, alerts will be generated for these
    values.'''

    TYPE = 'COMPARATIVE'

    operation = related.StringField()
    type = related.StringField(TYPE)

    def create_notification_msg(self, fields=None) -> str:
        return f'{self.operation} {to_model(Field, fields[1]).field_name()}'

    # pylint: disable=W0221
    def evaluate(self, left_value: float, right_value: float) -> bool:
        '''Compared value from one field to value from another.'''
        return EVAL_MAP[self.operation](left_value, right_value)


AlertCheck.register_subtype(ComparativeCheck)


@related.immutable
class AlertDefinitionMeta(object):
    '''Object representation of the metadata for an Alert Definition.'''

    # NOTE(toshi): Maybe we want to convert this to user?
    user_id = related.StringField(key='userId')
    # $uri or alert definition id
    # id = related.IntegerField()
    uri = related.StringField(key='$uri')


@related.immutable
class AlertDefinition(AlertDefinitionMeta):
    '''Object representation of an alert definition.'''

    # TODO(toshi): Perhaps this should have the basic _uri be part of this.
    checks = AlertCheck.sequence_field()
    time_granularity = related.StringField(key='timeGranularity')
    fields = related.SequenceField('data.query.models.Field')
    filters = related.SequenceField('data.query.models.DimensionValueFilterItem')
    title = related.StringField()
    dimension_name = related.StringField(required=False, key='dimensionName')


@related.immutable
class RefObject(object):
    '''Object representation of an object ref.'''

    ref = related.StringField(key='$ref')


@related.mutable
class AlertNotificationMeta(object):
    '''Object representation of the metadata for an Alert Notification.'''

    generation_date = related.StringField(key='generationDate', required=False)
    # TODO(toshi): Possible to change constructor to take in just a string
    alert_definition = related.ChildField(
        RefObject, key='alertDefinition', required=False
    )
    uri = related.StringField(key='$uri', required=False)


@related.mutable
class DimensionInfo:
    '''JSON representation of the dimension information for a notification.'''

    dimension_val = related.StringField()
    dimension_name = related.StringField()


@related.mutable
class AlertNotification(AlertNotificationMeta):
    '''Object representation of a alert notification.'''

    query_interval = related.StringField(key='queryInterval', required=False)
    reported_val = related.StringField(key='reportedVal', required=False)
    compared_val = related.StringField(key='comparedVal', required=False)
    dimension_info = related.MappingField(
        DimensionInfo, 'dimension_name', default={}, key='dimensionInfo'
    )
