#!/usr/bin/env python
# mypy: disallow_untyped_defs=True
from typing import Optional, TYPE_CHECKING

from data.query.models.calculation import Calculation

# TODO: Upgrade the Python version on the pipeline machines to
# be 3.8 or greater.
if TYPE_CHECKING:
    from typing_extensions import TypedDict
else:
    TypedDict = dict


class ZenField(TypedDict):
    id: str
    name: str
    short_name: str
    calculation: Calculation
    description: str
    category_id: str
    pipeline_datasource_id: str
    constructed: bool


class ZenCategory(TypedDict):
    id: str
    name: str
    parent_id: str


METADATA_COLUMNS = [
    'id',
    'name',
    'short_name',
    'calculation',
    'description',
    'category_id',
    'pipeline_datasource_id',
    'constructed',
]

CATEGORY_COLUMNS = [
    'id',
    'name',
    'parent_id',
]


def shorten_field_name(field_name: str, category_name: str) -> Optional[str]:
    '''Overwrite the field short name to drop the category name if it contains it'''
    if field_name.startswith(category_name):
        short_name = field_name[len(category_name) :].strip()
        if short_name.startswith(':'):
            short_name = short_name[1:].strip()
        if short_name:
            return short_name
    return None
