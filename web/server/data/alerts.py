from flask import current_app

ALERTS_ENABLED_DEPLOYMENTS = {
    'alliance_india',
    'bd',
    'br',
    'et',
    'ke',
    'lr',
    'mz',
    'mz_covid',
    'rw',
    'pk',
    'tg',
    'zen',
    'zm',
}


def is_alert_enabled():
    '''Returns a boolean indicating whether the alerts is enabled for the current
    deployment.
    '''
    return current_app.zen_config.general.DEPLOYMENT_NAME in ALERTS_ENABLED_DEPLOYMENTS
