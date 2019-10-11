import json


DEFAULT_COLUMN_COUNT = 6
DEFAULT_SHOW_FILTER_BUTTON = False
DEFAULT_TITLE = 'New Dashboard'
MINIMUM_COLUMN_COUNT = 1
DEFAULT_FILTER_PANEL_SETTINGS = {}

# Default dashboard spec.
EMPTY_SPECIFICATION_2018_04_03 = {
    'dashboardOptions': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2018-04-03',
    'settings': [],
    'items': [],
    'sizes': [],
    'queries': [],
    'filters': [],
    'dateRanges': [],
}

EMPTY_SPECIFICATION_2018_10_30 = {
    'dashboardOptions': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2018-10-30',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

# No base-line specification changes. Only the addition of AQT.
EMPTY_SPECIFICATION_2018_12_11 = {
    'dashboardOptions': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2018-12-11',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_01_24 = {
    'dashboardOptions': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2019-01-24',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_04_10 = {
    'dashboardOptions': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2019-04-10',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_04_11 = {
    'dashboardOptions': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2019-04-11',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_05_24 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2019-05-24',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_06_08 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2019-06-08',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_06_10 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2019-06-10',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_08_23 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'showDashboardFilterButton': DEFAULT_SHOW_FILTER_BUTTON,
    },
    'version': '2019-08-23',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_08_26 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'filterPanelSettings': DEFAULT_FILTER_PANEL_SETTINGS,
    },
    'version': '2019-08-26',
    'settings': {},
    'items': {},
    'sizes': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_09_05 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'filterPanelSettings': DEFAULT_FILTER_PANEL_SETTINGS,
    },
    'version': '2019-09-05',
    'settings': {},
    'items': {},
    'text_elements': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_09_11 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'filterPanelSettings': DEFAULT_FILTER_PANEL_SETTINGS,
    },
    'version': '2019-09-11',
    'settings': {},
    'items': {},
    'text_elements': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION_2019_09_18 = {
    'options': {
        'title': DEFAULT_TITLE,
        'columnCount': DEFAULT_COLUMN_COUNT,
        'filterPanelSettings': DEFAULT_FILTER_PANEL_SETTINGS,
    },
    'version': '2019-09-18',
    'settings': {},
    'items': {},
    'text_elements': {},
    'queries': {},
    'filters': {},
    'dateRanges': {},
}

EMPTY_SPECIFICATION = EMPTY_SPECIFICATION_2019_09_18
EMPTY_SPECIFICATION_AS_JSON = json.dumps(EMPTY_SPECIFICATION)
