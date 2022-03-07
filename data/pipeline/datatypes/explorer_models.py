# pylint: disable=C0103
from typing import TYPE_CHECKING
from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

if TYPE_CHECKING:
    BASE = object
else:
    BASE = declarative_base()

LOCATION_TYPES_NAME = 'location_types'
LOCATIONS_NAME = 'locations'
METRICS_NAME = 'metrics'
PROPERTIES_NAME = 'properties'
FIELDS_NAME = 'fields'
GROUPS_NAME = 'groups'
TABLE_NAMES = {
    LOCATION_TYPES_NAME,
    LOCATIONS_NAME,
    METRICS_NAME,
    PROPERTIES_NAME,
    FIELDS_NAME,
    GROUPS_NAME,
}


class LocationTypes(BASE):
    '''A class that represents a locaiton type.
    0: region, 1: zone, 2: woreda, 3: facility.
    '''

    __tablename__ = LOCATION_TYPES_NAME
    id = Column(Integer, primary_key=True)
    name = Column(String)
    rel = relationship('Locations')


class Locations(BASE):
    '''A class that represents an location.
    '''

    __tablename__ = LOCATIONS_NAME
    id = Column(Integer, primary_key=True)
    lat = Column(Float)
    lng = Column(Float)
    name = Column(String)
    rel1 = relationship('Metrics')
    rel2 = relationship('Properties')
    parent_id = Column(Integer, ForeignKey('%s.id' % LOCATIONS_NAME))
    type_id = Column(Integer, ForeignKey('%s.id' % LOCATION_TYPES_NAME))


class Metrics(BASE):
    '''A class that represents an indicator value at a location,
    Where the field is mapped to a float value.
    '''

    __tablename__ = METRICS_NAME
    id = Column(Integer, primary_key=True)
    date = Column(Date)
    value = Column(Float)
    source = Column(String)
    field_id = Column(String, ForeignKey('%s.id' % FIELDS_NAME))
    location_id = Column(Integer, ForeignKey('%s.id' % LOCATIONS_NAME))


class Properties(BASE):
    '''A class that represents an indicator value at a location,
    Where the field is mapped to a ture/false value.
    '''

    __tablename__ = PROPERTIES_NAME
    id = Column(Integer, primary_key=True)
    date = Column(Date)
    source = Column(String)
    value = Column(String, ForeignKey('%s.id' % FIELDS_NAME))
    field_id = Column(String, ForeignKey('%s.id' % GROUPS_NAME))
    location_id = Column(Integer, ForeignKey('%s.id' % LOCATIONS_NAME))


class Fields(BASE):
    '''A class that represents an indicator.
    '''

    __tablename__ = FIELDS_NAME
    id = Column(String, primary_key=True)
    text = Column(String)
    group_id = Column(String, ForeignKey('%s.id' % GROUPS_NAME))
    rel1 = relationship('Metrics')
    rel2 = relationship('Properties')


class Groups(BASE):
    '''A class that represents an indicator group.
    '''

    __tablename__ = GROUPS_NAME
    id = Column(String, primary_key=True)
    group_text_short = Column(String)
    group_text = Column(String)
    rel = relationship('Fields')
    rel2 = relationship('Properties')


def create_tables(engine):
    '''Creates all the tables on the postgres db.
    '''
    BASE.metadata.create_all(engine)
