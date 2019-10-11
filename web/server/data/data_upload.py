# -*- coding: utf-8 -*-

# HACK(pablo): a lot of these configs would usually go in the config directory.
# But we have so many deployments now it does not make sense to make new configs
# mandatory for all deployments. This was an easier approach. We should really
# develop some way to specify default configs for deployments.

# list of deployments that list the Data Upload link in the Navbar
DEPLOYMENTS_WITH_DATA_UPLOAD_NAVBAR = set(['mz'])

# List which datasets are enabled for data upload.
# If a deployment is not listed, we default to all the categories from the
# config's GROUP_DEFINITIONS. Your categories here don't *have* to map exactly
# to the GROUP_DEFINITIONS. They should map to whatever your users actually
# expect to upload. We also support multi-step data uploads with multiple
# dropdowns. For example, in MZ a user first selects their province, and
# then they select the datasets that are available to them.
UPLOAD_CATEGORIES = {
    'mz': {
        'dropdownLabelKey': 'province',
        'options': [
            {
                'optionName': 'Sofala',
                'dropdownLabelKey': 'dataCategory',
                'options': [
                    {
                        'optionName': 'INS - Monitoria Sofala (Malária, Diarreia, Febre)',
                        'filePrepend': 'ins_ingc_sofala',
                    },
                    {
                        'optionName': 'INS - Monitoria Sofala (Colera)',
                        'filePrepend': 'ins_surveillance_cholera_sofala',
                    },
                    {'optionName': 'INS - Investigaçao', 'filePrepend': 'iud_sofala'},
                ],
            },
            {
                'optionName': 'Cabo Delgado',
                'dropdownLabelKey': 'dataCategory',
                'options': [
                    {
                        'optionName': 'INS - Monitoria Delgado (Malária, Diarreia, Febre)',
                        'filePrepend': 'ins_ingc_delgado',
                    },
                    {
                        'optionName': 'INS - Monitoria Delgado (Colera)',
                        'filePrepend': 'ins_surveillance_cholera_delgado',
                    },
                    {'optionName': 'INS - Investigaçao', 'filePrepend': 'iud_delgado'},
                ],
            },
        ],
    }
}


def _get_upload_categories(deployment_name, indicator_group_definitions):
    if deployment_name in UPLOAD_CATEGORIES:
        return UPLOAD_CATEGORIES[deployment_name]

    main_datasets = [
        {'optionName': g['groupText'], 'filePrepend': g['groupId']}
        for g in indicator_group_definitions
    ]
    return {'dropdownLabelKey': 'dataCategory', 'options': main_datasets}


def get_data_upload_app_options(deployment_name, indicator_group_definitions):
    '''Gets DataUploadApp options. Currently it only returns whether or not the
    data upload link is enabled in the navbar.
    '''
    show_in_navbar = deployment_name in DEPLOYMENTS_WITH_DATA_UPLOAD_NAVBAR
    upload_categories = _get_upload_categories(
        deployment_name, indicator_group_definitions
    )

    return {'showInNavbar': show_in_navbar, 'uploadCategories': upload_categories}
