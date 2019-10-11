DEMO_GROUPS = [
    {
        'groupId': 'health_care_finance',
        'groupText': 'Health Care Finance Management System',
        'groupTextShort': 'Health Care Finance',
        'hiddenByDefault': False,
        'indicators': [
            {'id': 'angioplasty_cost', 'text': 'Cost of Angioplasty'},
            {
                'id': 'clinical_treatment_ihd',
                'text': 'Cost of Clinical Treatment for IHD',
            },
            {
                'id': 'coronary_revascularisation_or_heart_bypass_surgery',
                'text': 'Cost of Coronary Revascularisation Or Heart Bypass Surgery',
            },
        ],
    },
    {
        'groupId': 'sistema_unico_hmis',
        'groupText': 'Sistema Único de Saúde HMIS',
        'groupTextShort': 'HMIS',
        'hiddenByDefault': False,
        'indicators': [
            {'id': 'angioplasty_count', 'text': 'Angioplasty Cases'},
            {'id': 'municipality_population', 'text': 'Municipality Population'},
            {'id': 'yellow_fever_incidence', 'text': 'Yellow Fever Incidence'},
            {'id': 'yellow_fever_cases', 'text': 'Yellow Fever Cases'},
            {
                'id': 'epizootic_cases_confirmed',
                'text': 'Yellow Fever Epizootic cases confirmed',
            },
            {'id': 'ihd_mortality_cases', 'text': 'IHD Deaths'},
            {'id': 'ihd_morbidity_cases', 'text': 'New Cases of IHD'},
        ],
    },
    {
        'groupId': 'health_financing_models',
        'groupText': 'Health Financing Models',
        'groupTextShort': 'Health Financing',
        'hiddenByDefault': False,
        'indicators': [
            {
                'id': 'probability_of_patient_needing_angioplasty',
                'text': 'Probability Of Patient Needing Angioplasty',
            },
            {
                'id': 'probability_of_patient_needing_clinical_intervention_ihd',
                'text': 'Probability Of Needing Clinical Intervention',
            },
            {
                'id': 'probability_of_patient_needing_ihd_surgery',
                'text': 'Probability Of Needing Surgery (IHD)',
            },
        ],
    },
    {
        'groupId': 'ihris',
        'groupText': 'iHRIS',
        'groupTextShort': 'iHRIS',
        'hiddenByDefault': False,
        'indicators': [
            {'id': 'nurses', 'text': 'Nurses'},
            {'id': 'doctors', 'text': 'Doctors'},
        ],
    },
    {
        'groupId': 'quality_of_care',
        'groupText': 'Quality of Care',
        'groupTextShort': '',
        'hiddenByDefault': False,
        'indicators': [
            {'id': 'qoc_survey_respondents', 'text': 'QOC survey respondents'},
            {
                'id': 'what_number_do_you_rate_your_health_care_1_10',
                'text': 'How do you rate health care you received 1-10',
            },
            {
                'id': 'adherence_to_clinical_guidelines',
                'text': 'Adherence to Clinical Guidelines',
            },
        ],
    },
    {
        'groupId': 'Forecast',
        'groupText': 'Forecast',
        'groupTextShort': '',
        'hiddenByDefault': False,
        'indicators': [
            {
                'id': 'forecast_tabnet_1850',
                'text': 'Forecast: Pneumonia (Valor Total)',
                'enableDimensions': ['StateName'],
            }
        ],
    },
    {
        'groupId': 'Forecast_Errors',
        'groupTextShort': 'ForecastErr',
        'groupText': 'Forecast Errors',
        'hiddenByDefault': True,
        'indicators': [
            {
                'id': 'forecast_error_tabnet_1850',
                'text': 'Forecast: Pneumonia',
                'enableDimensions': ['StateName'],
                'type': 'SIGMA',
            }
        ],
    },
]
