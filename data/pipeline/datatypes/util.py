def build_key_from_dimensions(data_dict, dimensions, delimiter='__', prefix=''):
    '''Builds a key from dictionary data, based on list of dimensions.
    '''
    dim_list = (
        dimensions
        if not prefix
        else ['%s%s' % (prefix, dimension_name) for dimension_name in dimensions]
    )
    return delimiter.join(
        [data_dict.get(dimension_name) or '' for dimension_name in dim_list]
    )
