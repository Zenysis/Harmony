from typing import Any

import graphene
from flask_sqlalchemy import Model
from sqlalchemy.sql.elements import BinaryExpression
from graphene_sqlalchemy import SQLAlchemyConnectionField
from graphene.types import Scalar
from graphql.language import ast


# TODO: Support _and and _or operators
FILTERING_OPERATORS = {
    'in': 'in_',
    'eq': '__eq__',
    'neq': '__ne__',
    'gte': '__ge__',
    'lte': '__le__',
    'gt': '__gt__',
    'lt': '__lt__',
    'like': 'like',
}


def _recursive_build_dict(obj_value: ast.ObjectValue):
    result = {}
    for field in obj_value.fields:
        name = field.name.value
        if isinstance(field.value, ast.ObjectValue):
            result[name] = _recursive_build_dict(field.value)
        else:
            result[name] = field.value.value
    return result


class WhereField(Scalar):
    '''Where Scalar Description'''

    @staticmethod
    def serialize(dt):
        return dict(dt)

    # pylint: disable=R1710
    @staticmethod
    def parse_literal(node):

        if isinstance(node, ast.ObjectValue):
            result = _recursive_build_dict(node)
            return result

    @staticmethod
    def parse_value(value):
        return dict(value)


def build_filtering_operation(
    model: Model, attribute_name: str, value: Any, operator: str
) -> BinaryExpression:
    '''
    This returns a ready-to-use SQLAlchemy operation that can be passed to query.filter
    '''

    column = getattr(model, attribute_name)
    usable_operator = FILTERING_OPERATORS.get(operator)
    if not usable_operator:
        raise ValueError(f'Undefined filtering operation {operator}')
    operation = getattr(column, usable_operator)(value)
    return operation


class FilteredConnectionField(SQLAlchemyConnectionField):
    '''
    Custom connection field to filter query based on a query like this
    e.g
            where: {
                'validated_status': {
                    'neq': 'BANNED_STATUS'
                },
                'self_match': {
                    'eq': True
                }
            }

    '''

    # pylint:disable=redefined-builtin
    def __init__(self, type, *args, **kwargs):
        super().__init__(
            type,
            *args,
            where=graphene.Argument(WhereField),
            page=graphene.Int(),
            per_page=graphene.Int(),
            **kwargs,
        )

    @classmethod
    def get_query(cls, model, info, sort=None, page=None, per_page=None, **args):
        query = super().get_query(model, info, sort=sort, **args)

        # Try to filter query based on this structure
        where_clause = dict(args.items()).get('where', {})
        for attribute_name, attribute_value in where_clause.items():
            for operator, value in attribute_value.items():
                # TODO: Perform nested lookups and operations
                operation = build_filtering_operation(
                    model, attribute_name, value, operator
                )
                query = query.filter(operation)
        # paginate data
        if per_page:
            query = query.limit(per_page)
        if page:
            query = query.offset((page - 1) * per_page)
        return query
