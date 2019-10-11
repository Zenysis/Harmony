#!/usr/bin/env python
# pylint: disable=C0103
import sqlalchemy as sa

from sqlalchemy.orm import relationship, backref

from models.alchemy.base import Base

GROUPS_NAME = 'indicator_groups'
INDICATORS_NAME = 'indicators'

IndicatorConsistuent = sa.Table(
    'indicator_constituents',
    Base.metadata,
    sa.Column(
        'calculated_indicator_id',
        sa.Integer,
        sa.ForeignKey('%s.id' % INDICATORS_NAME),
        primary_key=True,
    ),
    sa.Column(
        'indicator_id',
        sa.Integer,
        sa.ForeignKey('%s.id' % INDICATORS_NAME),
        primary_key=True,
    ),
)


class Indicators(Base):
    '''Stores simple indicator level data
    '''

    __tablename__ = INDICATORS_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    text_id = sa.Column(sa.String(), unique=True)
    group_id = sa.Column(sa.Integer(), sa.ForeignKey('%s.id' % GROUPS_NAME))
    text = sa.Column(sa.String())
    formula = sa.Column(sa.String(), nullable=True)
    raw_formula = sa.Column(sa.String(), nullable=True)
    constituents = relationship(
        'Indicators',
        secondary=IndicatorConsistuent,
        primaryjoin=id == IndicatorConsistuent.c.calculated_indicator_id,
        secondaryjoin=id == IndicatorConsistuent.c.indicator_id,
        backref=backref('constituented_indicators'),
    )
    indicator_group = relationship("IndicatorGroups")

    def __str__(self):
        return self.text


class IndicatorGroups(Base):
    '''Stores indicator group information.
    '''

    __tablename__ = GROUPS_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    text_id = sa.Column(sa.String(), nullable=False, unique=True)
    group_text = sa.Column(sa.String())

    indicators = relationship("Indicators")

    def __str__(self):
        return self.group_text
