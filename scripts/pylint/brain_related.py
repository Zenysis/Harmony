'''Astroid brain plugin to mark `related` fields that resolve to attr atributes
as unknown types so that we don't see invalid pylint errors like not-an-iterable
during linting.'''

import astroid
from astroid import MANAGER
from astroid.brain.brain_attrs import is_decorated_with_attrs

ATTR_PATH = 'attr.'
DECORATOR_NAMES = ('related.immutable', 'related.mutable')


def is_decorated_with_related(node):
    return is_decorated_with_attrs(node, DECORATOR_NAMES)


def related_attributes_transform(node):
    '''Rewrite the class attributes of the provided node as instance atributes
    since the node provided has a related decorator.
    '''
    node.locals['__attrs_attrs__'] = [astroid.Unknown(parent=node)]
    for body_node in node.body:
        passes = False
        if isinstance(body_node, astroid.Assign) and isinstance(
            body_node.value, astroid.Call
        ):
            passes = all(
                v.pytype().startswith(ATTR_PATH) for v in body_node.value.infer()
            )

        if not passes:
            continue

        for target in body_node.targets:
            rhs_node = astroid.Unknown(
                lineno=body_node.lineno,
                col_offset=body_node.col_offset,
                parent=body_node,
            )
            node.locals[target.name] = [rhs_node]


MANAGER.register_transform(
    astroid.ClassDef, related_attributes_transform, is_decorated_with_related
)
