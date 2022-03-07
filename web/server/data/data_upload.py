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
    },
    'pk': {
        'dropdownLabelKey': 'dataCategory',
        'options': [
            {'optionName': "DSC Zero Dose Line List", 'filePrepend': "dsc_zd"},
            {'optionName': "DSC Missed Children", 'filePrepend': "dsc_missed_children"},
            {'optionName': "BCG (VLMIS)", 'filePrepend': "vlmis-bcg"},
            {'optionName': "OPV (VLMIS)", 'filePrepend': "vlmis-opv"},
            {'optionName': "Penta (VLMIS)", 'filePrepend': "vlmis-penta"},
            {'optionName': "PCV-10 (VLMIS)", 'filePrepend': "vlmis-pcv-10"},
            {'optionName': "Rotarix (VLMIS)", 'filePrepend': "vlmis-rotarix"},
            {'optionName': "Dt (VLMIS)", 'filePrepend': "vlmis-dt"},
            {'optionName': "Hep B (VLMIS)", 'filePrepend': "vlmis-hep-b"},
            {'optionName': "Measles (VLMIS)", 'filePrepend': "vlmis-measles"},
            {'optionName': "TT (VLMIS)", 'filePrepend': "vlmis-tt"},
            {'optionName': "TCV 5 (VLMIS)", 'filePrepend': "vlmis-tcv"},
            {'optionName': "IPV (VLMIS)", 'filePrepend': "vlmis-ipv"},
            {'optionName': "Measles (VPD-surveillance)", 'filePrepend': "vpd-measles"},
            {'optionName': "NNT (VPD-surveillance)", 'filePrepend': "vpd-nnt"},
            {
                'optionName': "Pertusis (VPD-surveillance)",
                'filePrepend': "vpd-pertusis",
            },
            {
                'optionName': "Diptheria (VPD-surveillance)",
                'filePrepend': "vpd-diptheria",
            },
            {'optionName': "AFP (VPD-surveillance)", 'filePrepend': "vpd-afp"},
            {
                'optionName': "Childhood TB (VPD-surveillance)",
                'filePrepend': "vpd-childhood-tb",
            },
            {'optionName': "AEFI (VPD surveillance)", 'filePrepend': "vpd-aefi"},
            {'optionName': "IDIMS", 'filePrepend': "polio_idims"},
            {'optionName': "ICM", 'filePrepend': "polio_icm"},
            {'optionName': "Polio Catch Up", 'filePrepend': "polio_catch_up"},
            {'optionName': "EOC", 'filePrepend': "polio_eoc"},
            {'optionName': "EPI/EOA", 'filePrepend': "epi_eoa"},
        ],
    },
}


def _get_upload_categories(deployment_name, indicator_group_definitions):
    if deployment_name in UPLOAD_CATEGORIES:
        return UPLOAD_CATEGORIES[deployment_name]

    main_datasets = [
        {'optionName': g['groupText'], 'filePrepend': g['groupId']}
        for g in indicator_group_definitions
    ]
    return {'dropdownLabelKey': 'dataCategory', 'options': main_datasets}


def get_raw_data_upload_show_in_navbar(deployment_name):
    '''Gets whether or not the raw data upload link is enabled in the navbar.'''
    return deployment_name in DEPLOYMENTS_WITH_DATA_UPLOAD_NAVBAR


def get_raw_data_upload_app_options(deployment_name, indicator_group_definitions):
    '''Gets RawDataUploadApp options.'''
    upload_categories = _get_upload_categories(
        deployment_name, indicator_group_definitions
    )

    return {
        'showInNavbar': get_raw_data_upload_show_in_navbar(deployment_name),
        'uploadCategories': upload_categories,
    }
