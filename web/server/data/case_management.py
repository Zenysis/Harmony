# CMA = Case Management App
CMA_ENABLED_DEPLOYMENTS = set(['mz'])

# the way the Case Management navbar button should be named (defaults to
# Case Management)
NAVBAR_TITLES = {'mz': 'Outbreak Investigation'}


def get_case_management_options(deployment_name):
    '''Gets CaseManagementApp options'''
    return {
        # HACK(pablo): Not the best way to do this, but it does not make sense
        # to make this field mandatory.
        'showInNavbar': deployment_name in CMA_ENABLED_DEPLOYMENTS,
        'navbarTitle': NAVBAR_TITLES.get(deployment_name, 'Case Management'),
    }
