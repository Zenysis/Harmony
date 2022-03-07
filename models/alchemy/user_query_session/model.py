from typing import TYPE_CHECKING
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from models.alchemy.base import Base


if TYPE_CHECKING:
    from models.alchemy.user import User

USER_QUERY_SESSIONS_TABLE_NAME = 'user_query_session'


class UserQuerySession(Base):
    '''Represents a single query session.
    '''

    __tablename__ = USER_QUERY_SESSIONS_TABLE_NAME
    query_uuid = sa.Column(sa.String(), primary_key=True)
    user_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', name='valid_user', ondelete='CASCADE'),
        nullable=False,
    )
    query_blob = sa.Column(JSONB())

    user = relationship('User', viewonly=True)
