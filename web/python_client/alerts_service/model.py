from builtins import object
import related


@related.immutable
class AlertCheck(object):
    '''Object representation of a single Alert check
    '''

    operation = related.StringField()
    threshold = related.IntegerField()


@related.immutable
class AlertDefinitionMeta(object):
    '''Object representation of the metadata for an Alert Definition.
    '''

    # NOTE(toshi): Maybe we want to convert this to user?
    user_id = related.StringField(key='userId')
    # $uri or alert definition id
    # id = related.IntegerField()
    uri = related.StringField(key='$uri')


@related.immutable
class AlertDefinition(AlertDefinitionMeta):
    '''Object representation of a alert definition.
    '''

    # TODO(toshi): Perhaps this should have the basic _uri be part of this.
    checks = related.SequenceField(AlertCheck)
    time_granularity = related.StringField(key='timeGranularity')
    field_id = related.StringField(key='fieldId')
    dimension_name = related.StringField(key='dimensionName')


@related.immutable
class RefObject(object):
    '''Object representation of an object ref.
    '''

    ref = related.StringField(key='$ref')


@related.mutable
class AlertNotificationMeta(object):
    '''Object representation of the metadata for an Alert Notification.
    '''

    generation_date = related.StringField(key='generationDate', required=False)
    # TODO(toshi): Possible to change constructor to take in just a string
    alert_definition = related.ChildField(
        RefObject, key='alertDefinition', required=False
    )
    uri = related.StringField(key='$uri', required=False)


@related.mutable
class AlertNotification(AlertNotificationMeta):
    '''Object representation of a alert notification.
    '''

    query_interval = related.StringField(key='queryInterval', required=False)
    reported_val = related.StringField(key='reportedVal', required=False)
    message = related.StringField(key='message', required=False)
    dimension_val = related.StringField(key='dimensionVal', required=False)
