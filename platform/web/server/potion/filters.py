from flask_potion import fields
from flask_potion.contrib.alchemy.filters import SQLAlchemyBaseFilter
from werkzeug.utils import cached_property

from models.alchemy.user import User
from models.alchemy.permission import ResourceType, ResourceTypeEnum
from web.server.data.data_access import find_one_by_fields
from web.server.api.model_schemas import USERNAME_SCHEMA


class ResourceTypeFilter(SQLAlchemyBaseFilter):
    '''A Flask-Potion filter that implements equality comparison for the
    `models.permission_models.ResourceType` model.
    '''

    @cached_property
    def filter_field(self):
        return fields.String(enum=[e.name for e in ResourceTypeEnum])

    def expression(self, value):
        return self.column == find_one_by_fields(ResourceType, True, {'name': value})


class UserFilter(SQLAlchemyBaseFilter):
    '''A Flask-Potion filter that implements equality comparison for Authors of a
    Dashboard
    '''

    @cached_property
    def filter_field(self):
        return USERNAME_SCHEMA

    def expression(self, value):
        matching_user = find_one_by_fields(User, True, {'username': value})

        if not matching_user:
            return False

        return self.column == matching_user.id
