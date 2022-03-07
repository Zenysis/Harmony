from data.pipeline.datatypes.base_row import BaseRow


def get_keys_from_dimension(Dimension, exclude=None, exclude_shared_keys=True):
    '''
    Return a list of unique keys in a Dimension class, minus an optional list
    of exclusions and common keys SOURCE and DATE.
    '''
    ret = set([getattr(Dimension, x) for x in dir(Dimension) if not x.startswith('__')])
    if exclude_shared_keys:
        ret -= set([Dimension.SOURCE, Dimension.DATE])
    if exclude:
        ret -= set(exclude)
    return sorted(ret)


def BaseRowFactory(dimension_class, hierarchical_dimensions, parent_relationships):
    '''
    Return a simple class with the attributes MAPPING_KEYS, PARENT_LEVELS, and
    UNMAPPED_KEYS, which are used by the BaseRow implementation.
    '''
    if not getattr(dimension_class, 'SOURCE'):
        raise RuntimeError('Dimension classes must have a SOURCE attribute.')
    if not getattr(dimension_class, 'DATE'):
        raise RuntimeError('Dimension classes must have a DATE attribute.')

    newclass = type(
        'BaseRowGenerated',
        (BaseRow,),
        {
            'MAPPING_KEYS': hierarchical_dimensions,
            'PARENT_LEVELS': parent_relationships,
            'UNMAPPED_KEYS': get_keys_from_dimension(
                dimension_class, exclude=hierarchical_dimensions
            ),
        },
    )
    return newclass
