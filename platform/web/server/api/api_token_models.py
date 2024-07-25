from flask_potion import fields

from models.alchemy.api_token import APIToken
from web.server.api.api_models import PrincipalResource


class APITokenResource(PrincipalResource):
    class Meta:
        name = 'api-token'
        model = APIToken
        include_fields = ('id', 'created', 'is_revoked', 'token')

    class Schema:
        id = fields.String(io='r')
        created = fields.DateString(io='r')
        isRevoked = fields.Boolean(io='r', attribute='is_revoked')
        revoked = fields.DateString(io='r', attribute='last_modified')
        token = fields.String(io='r', nullable=True)


RESOURCE_TYPES = [APITokenResource]
