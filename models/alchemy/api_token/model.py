from datetime import datetime, timedelta
import random
import string
from typing import Optional

import sqlalchemy as sa
from sqlalchemy.orm import relationship

from models.alchemy.base import Base
from models.alchemy.mixin import UTCTimestampMixin
from models.alchemy.user import User


class APIToken(Base, UTCTimestampMixin):
    ID_CHARACTER_SET = string.ascii_letters + string.digits
    ID_LENGTH = 10
    # This is a field for actual token but we don't want it to be stored in the db
    # so it's just a class attr, not SA field
    token: Optional[str] = None

    __tablename__ = 'api_token'

    id = sa.Column(sa.String(ID_LENGTH), primary_key=True)
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', name='valid_user', ondelete='CASCADE'),
        nullable=False,
    )
    is_revoked = sa.Column(sa.Boolean(), nullable=False, default=False)

    user = relationship(User, viewonly=True)

    @classmethod
    def generate_id(cls):
        return ''.join(
            random.choice(cls.ID_CHARACTER_SET) for _ in range(cls.ID_LENGTH)
        )

    @classmethod
    def generate_token(cls, user: User) -> 'APIToken':
        # NOTE: to avoid the need to install it on pipeline servers
        # pylint: disable=import-outside-toplevel
        from flask_jwt_extended import create_access_token

        token_obj = cls(
            id=cls.generate_id(),
            user=user,
            created=datetime.utcnow(),
            last_modified=datetime.utcnow(),
        )
        token_obj.token = create_access_token(
            identity=user.username,
            # NOTE: I consider 20 years to be indefinite here
            expires_delta=timedelta(seconds=86400 * 365 * 20),
            user_claims={
                'id': token_obj.id,
                'needs': ['*'],
                'query_needs': ['*'],
            },
        )
        return token_obj
