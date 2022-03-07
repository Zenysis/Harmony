from sqlalchemy import and_

from models.alchemy.alerts import AlertNotification


def get_latest_notifications(definition_id_lst=None, date_str=None):
    '''Gets the latest notifications and optionally filters for a given list of
    alert definitions and date. If no date is provided, the most recent date for
    generated alerts is used.
    '''
    if not date_str:
        latest_obj = AlertNotification.query.order_by(
            AlertNotification.generation_date.desc()
        ).first()

        date_str = latest_obj.generation_date if latest_obj else ''

        # We only want non stale notifications
        date_str = date_str.split('.')[0]

    date_filter = AlertNotification.generation_date == date_str
    complete_filter = (
        and_(date_filter, AlertNotification.alert_definition_id.in_(definition_id_lst))
        if definition_id_lst is not None
        else date_filter
    )

    return AlertNotification.query.filter(complete_filter)
