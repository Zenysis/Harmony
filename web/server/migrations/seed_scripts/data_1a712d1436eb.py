# pylint: disable=C0302, C0103

# When upgrading the Case table, we need the dimension ids, but they aren't
# loaded in the migrations workflow so hardcode them here.
raw_druid_dimension_values = []


def get_dimension(obj):
    return obj['dimension']['$ref'].split('/')[-1]


DRUID_DIMENSION_VALUES = []
for x in raw_druid_dimension_values:
    if get_dimension(x) == 'BairroName':
        filters = {'BairroName': x['name']}
    else:
        filters = {
            get_dimension(y): y['value'] if y['value'] else None
            for y in x['filter']['fields']
        }
    DRUID_DIMENSION_VALUES.append({"filter": filters, "id": x['id'], "name": x['name']})
