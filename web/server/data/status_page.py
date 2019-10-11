from flask import current_app

from web.server.data.status import MAX_TIME_FIELD, MIN_TIME_FIELD, SOURCE_FIELD


# Map status to display class in the form.
COLOR_MAP = {
    'STATUS_GOOD': 'success',
    'STATUS_WARNING': 'warning',
    'STATUS_BAD': 'danger',
    'STATUS_INFO': 'info',
}


def get_status_page_data():
    """ Return a list of dictionaries for Jinja to render the template page
    [{SOURCE_FIELD: , 'date_range': , 'status': , 'notes': }]
    """
    output = []
    druid_context = current_app.druid_context
    data_status = druid_context.data_status_information.status

    for (source, entry) in list(data_status.items()):
        output.append(
            {
                SOURCE_FIELD: source,
                'status_text': entry.get('status_text', ''),
                'notes': entry.get('notes', ''),
                'granularity': entry.get('granularity', ''),
                'color': status_to_color(entry.get('status', 'STATUS_WARNING')),
                'date_range': get_date_range_string(entry),
                'validation_text': entry.get('validation_text', 'Not validated'),
                'validation_color': status_to_color(
                    entry.get('validation_status', 'STATUS_BAD')
                ),
                'validation_url': entry.get('validation_url'),
            }
        )

    # Sort each list seperately by source.
    return sorted(output, key=lambda w: w[SOURCE_FIELD])


def status_to_color(status):
    return COLOR_MAP.get(status)


def get_date_range_string(entry):
    """ Return the string representation of an entry's start and end timestamp
        (e.g. Aug 1990-Dec 1991).
    """
    # Some entries might not have a start/end timestamp defined
    if MIN_TIME_FIELD not in entry or MAX_TIME_FIELD not in entry:
        return ''

    start_date = entry[MIN_TIME_FIELD]
    end_date = entry[MAX_TIME_FIELD]
    start_date_str = start_date.strftime('%b %Y')
    if start_date.year == end_date.year:
        return start_date_str

    return '%s - %s' % (start_date_str, end_date.strftime('%b %Y'))
