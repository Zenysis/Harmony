import ast
import re

from functools import partial

from pydruid.utils.postaggregator import Const, Field, Postaggregator

from db.druid.util import ExpressionPostAggregator

# Mapping from node type to druid postaggregation operation
ARITHMETIC_NODE_MAP = {'Add': '+', 'Sub': '-', 'Mult': '*', 'Div': '/'}

# Pattern for extracting the data fields referenced in a mathematical formula.
# TODO(stephen): Consolidate duplicate uses of this expression here.
FIELD_MATCH_PATTERN = re.compile('\\b([a-zA-Z_][a-zA-Z0-9_]+)\\b')

# Triggered when a formula being parsed is not of the format expected
class FormulaError(Exception):
    def __init__(self, formula):
        error_msg = 'Formula cannot be parsed: %s' % formula
        self.formula = formula
        super(FormulaError, self).__init__(error_msg)


# Triggered when a formula operation is encountered that we cannot handle
class UnsupportedNodeError(Exception):
    def __init__(self, node_type):
        error_msg = 'Node type is not supported: %s' % node_type
        self.node_type = node_type
        super(UnsupportedNodeError, self).__init__(error_msg)

    def __str__(self):
        return repr(self.value)


# Only allow formulas that are straight arithmetic expressions with no
# assignment
def _validate_formula_tree(tree):
    return (
        # Only allow 1 statement
        len(tree.body) == 1
        and
        # The single statement should only be returning a value
        tree.body[0]._fields == ('value',)
    )


def _get_root(tree):
    return tree.body[0].value


def _parse_formula(formula_str):
    tree = ast.parse(formula_str)
    if not _validate_formula_tree(tree):
        raise FormulaError(formula_str)

    return _get_root(tree)


# Build postaggregations from an AST by traversing the tree and
# pulling out the various arithmetic operations being applied
def _build_from_node(node):
    node_type = type(node).__name__

    # Variables encountered are considered to be druid data fields
    if node_type == 'Name':
        return Field(node.id)
    if node_type in ('Num', 'Constant'):
        return Const(node.n)
    if node_type == 'BinOp':
        node_op_type = type(node.op).__name__
        if node_op_type not in ARITHMETIC_NODE_MAP:
            raise UnsupportedNodeError(node_op_type)

        fn = ARITHMETIC_NODE_MAP[node_op_type]

        # Recurse to get fields being operated on
        left = _build_from_node(node.left).post_aggregator
        right = _build_from_node(node.right).post_aggregator
        fields = [left, right]

        # Collapse equivalent calculations into a single calculation
        if left.get('fn') == fn:
            fields = left['fields'] + [right]
        elif right.get('fn') == fn:
            fields = [left] + right['fields']

        return Postaggregator(fn, fields, 'bin_op')

    raise UnsupportedNodeError(node_type)


# Parse formula string into a druid postaggregation
def build_post_aggregation_from_formula(formula_str):
    if not formula_str:
        return None

    root = _parse_formula(formula_str)
    return _build_from_node(root)


# Create the "expression" post aggregator type to have druid fully evaluate
# and run the expression. This post aggregator will result in the same
# output value as "build_post_aggregation_from_formula" above, but it can
# support complex aggregators (like thetaSketch) more easily.
# NOTE(stephen): Should we maintain both types? Even though "expression" isn't
# documented in Druid, it is part of the core codebase and not an extension.
# Our version came first, though.
def build_expression_post_aggregator(formula_str):
    if not formula_str:
        return None

    root = _parse_formula(formula_str)
    # Ensure the formula is a valid arithmetic expression that druid can
    # process. We don't need to store the decomposed post aggregation since
    # we are using the "expression" post aggregation type.
    _ = _build_from_node(root)
    return ExpressionPostAggregator(formula_str)


def test_expression_formula_valid(formula_str: str) -> bool:
    '''Test to see if the formula string provided is a valid formula that can be parsed
    and evaluated by Druid as a post aggregator.
    '''
    if not formula_str:
        return False

    try:
        root = _parse_formula(formula_str)
        _ = _build_from_node(root)
    except (FormulaError, UnsupportedNodeError):
        return False
    return True


def walk_post_aggregator(post_aggregator, callback):
    '''Recursively operate on all post aggregations stored inside the provided
    post aggregator.
    '''
    # NOTE(stephen): Pydruid stores the post_aggregator dict as an instance on
    # the class. All child post aggregators referenced by the input post
    # aggregator are stored in their built form and not their class form.
    _recursive_walk_post_aggregator(post_aggregator.post_aggregator, callback)


def _recursive_walk_post_aggregator(
    post_aggregator, callback, max_depth=100, cur_depth=0
):
    if cur_depth >= max_depth:
        raise RuntimeError('Maximum recursion depth reached')

    callback(post_aggregator=post_aggregator)
    depth = cur_depth + 1
    for field in post_aggregator.get('fields', []):
        _recursive_walk_post_aggregator(field, callback, cur_depth=depth)


def rename_post_aggregator(post_aggregator, suffix):
    '''Update this post aggregator to include the provided suffix on its field
    and any fields referenced by it.
    '''

    callback = partial(_rename_post_aggregator, suffix=suffix)
    walk_post_aggregator(post_aggregator, callback)


def _rename_post_aggregator(suffix, post_aggregator):
    # Update the current field's name if it has one.
    field_name = post_aggregator.get('fieldName')
    if field_name:
        post_aggregator['fieldName'] = '%s%s' % (field_name, suffix)

    # JS post aggregators can reference multiple fields.
    if post_aggregator['type'] == 'javascript':
        post_aggregator['fieldNames'] = [
            '%s%s' % (field_name, suffix)
            for field_name in post_aggregator['fieldNames']
        ]

    # Expression post aggregators are special and can contain field references
    # directly in the formula referenced.
    if post_aggregator['type'] == 'expression':
        formula = post_aggregator['expression']
        post_aggregator['expression'] = add_suffix_to_expression(formula, suffix)


def add_suffix_to_expression(expression, suffix):
    '''Add the suffix to all fields referenced by the expression and return the
    updated expression.
    '''
    pieces = []
    prev = 0
    for match in FIELD_MATCH_PATTERN.finditer(expression):
        (start, end) = match.span()
        pieces.append(expression[prev:start])
        pieces.append('%s%s' % (match.group(), suffix))
        prev = end

    pieces.append(expression[prev:])
    return ''.join(pieces)
