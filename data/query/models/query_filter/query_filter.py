import related

from util.related.polymorphic_model import build_polymorphic_base

# TODO(david): fix type error
@related.immutable
class QueryFilter(build_polymorphic_base()):  # type: ignore[misc]
    '''The QueryFilter model stores a full filter object that can be applied to a query.
    '''

    def to_druid(self):  # pylint: disable=no-self-use
        raise ValueError('to_druid must be implemented by subclass.')

    # pylint: disable=no-self-use
    def is_valid(self) -> bool:
        return True
