#!/usr/bin/env python
# pylint: disable=C0103
from typing import TYPE_CHECKING
import sqlalchemy as sa

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.types import DateTime

from models.alchemy.base import Base


if TYPE_CHECKING:
    from models.alchemy.user import User


class HistoryRecord(Base):
    '''Model will represent table to hold all revisions to all resources
    '''

    __tablename__ = 'history_records'

    id = sa.Column(sa.Integer, primary_key=True)
    object_type = sa.Column(sa.String(100), index=True, nullable=False)
    object_id = sa.Column(sa.Integer, index=True, nullable=False)
    changes = sa.Column(JSONB)
    user_id = sa.Column(
        sa.Integer(), sa.ForeignKey('user.id', ondelete='SET NULL', name='valid_user')
    )
    user = relationship('User', viewonly=True)
    created = sa.Column(DateTime, nullable=False, server_default=sa.func.now())
