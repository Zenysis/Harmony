# pylint: disable=C0103
from enum import Enum
from http.client import INTERNAL_SERVER_ERROR
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import relationship
from werkzeug.exceptions import abort

from models.alchemy.base import Base
from models.alchemy.query import Dimension, Field
from web.server.data.data_access import find_one_by_fields


if TYPE_CHECKING:
    from models.alchemy.alerts import AlertNotification


CASE_EVENT_TABLE_NAME = 'case_event'
CASE_METADATA_TABLE_NAME = 'case_metadata'
CASE_METADATA_TYPE_TABLE_NAME = 'case_metadata_type'
CASE_STATUS_TYPE_TABLE_NAME = 'case_status_type'
CASE_TABLE_NAME = 'case'
CASE_TYPE_METADATA_FROM_DRUID_FIELD_TABLE_NAME = 'case_type_metadata_from_druid_field'
CASE_TYPE_METADATA_FROM_DRUID_DIMENSION_TABLE_NAME = (
    'case_type_metadata_from_druid_dimension'
)
# TODO: rename these tables, most of them are not representing anything
# 'default' in the traditional sense.
CASE_TYPE_DEFAULT_EVENT_TABLE_NAME = 'case_type_default_event'
CASE_TYPE_DEFAULT_FIELD_TABLE_NAME = 'case_type_default_field'
CASE_TYPE_DEFAULT_STATUS_TABLE_NAME = 'case_type_default_status'
CASE_TYPE_TABLE_NAME = 'case_type'
EXTERNAL_ALERT_ACTIVITY_TO_IGNORE_TABLE_NAME = 'external_alert_activity_to_ignore'
EXTERNAL_ALERT_TYPE_TABLE_NAME = 'external_alert_type'


class CaseTypeEnum(Enum):
    '''An enumeration of possible case types that a case can be associated with.'''

    # Indicates that the case is an alert.
    ALERT = 1

    # Indicates that the case is a druid dimension.
    DRUID = 2


class MetadataTypeEnum(Enum):
    '''An enumeration of possible types of metadata that can be added to a case.'''

    STRING = 1
    PHONE_NUMBER = 2
    NUMBER = 3
    DATE = 4
    BOOLEAN = 5


class DruidFieldMetadataTypeEnum(Enum):
    '''An enumeration of possible types of metadata that are generated from
    Druid fields.
    NOTE: these must be a subset of MetadataTypeEnum
    '''

    NUMBER = 1
    BOOLEAN = 2


class EventTypeEnum(Enum):
    '''An enumeration of possible types of events that can be added to a case. Note that
    other types of events exist, but they are not stored in postgres.
    '''

    GLOBAL = 1
    USER = 2
    STATUS_CHANGE = 3
    METADATA_CHANGE = 4


class CaseType(Base):
    '''A class that represents the configs and default values for types of cases
    ie. alert or a druid dimension.
    '''

    __tablename__ = CASE_TYPE_TABLE_NAME

    id = sa.Column(sa.Integer(), primary_key=True)

    type = sa.Column(sa.Enum(CaseTypeEnum, name='case_type_enum'), nullable=False)

    # the druid dimension that will be used to represent a CaseType.
    # For example, is this a Patient case? A traveler case? A Region case? That's
    # what the primary_druid_dimension_id tells us. This dimension value can never
    # be empty, but it still does not necessarily guarantee uniqueness of a case.
    # For that, we look at all dimensions with `treat_as_primary_dimension` in the
    # CaseTypeMetadataFromDruidDimension table.
    # So a CaseType only has 1 primary dimension used to identify the CaseType,
    # and its value can *never* be empty. But it can still have *several* dimensions
    # which it will treat as primary dimensions to uniquely identify cases.
    primary_druid_dimension_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_METADATA_FROM_DRUID_DIMENSION_TABLE_NAME}.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='valid_primary_druid_dimension',
        ),
        unique=True,
        nullable=True,
    )

    # the druid dimension that will be used to name this case (only relevant for Druid
    # cases). This is different from the primary_druid_dimension_id. For example, a case
    # might use the patient ID as primary druid dimension, but the naming dimension is
    # the patient name.
    naming_druid_dimension_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_METADATA_FROM_DRUID_DIMENSION_TABLE_NAME}.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='valid_naming_druid_dimension',
        ),
        nullable=True,
    )

    default_case_status_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_STATUS_TYPE_TABLE_NAME}.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='valid_default_case_status_type',
        ),
        nullable=False,
    )
    is_metadata_expandable = sa.Column(sa.Boolean(), nullable=False)
    can_users_add_events = sa.Column(sa.Boolean(), nullable=False)
    default_dashboard_queries = sa.Column(
        MutableList.as_mutable(JSONB()), nullable=False
    )
    spec = sa.Column(MutableDict.as_mutable(JSONB()), nullable=True)
    show_case_type_in_dossier = sa.Column(sa.Boolean(), server_default='true')

    external_alert_types = relationship('ExternalAlertType', viewonly=True)
    default_events = relationship(
        'CaseEvent', secondary=f'{CASE_TYPE_DEFAULT_EVENT_TABLE_NAME}', viewonly=True
    )
    statuses = relationship(
        'CaseStatusType',
        secondary=f'{CASE_TYPE_DEFAULT_STATUS_TABLE_NAME}',
        viewonly=True,
    )
    metadata_types = relationship('CaseMetadataType', viewonly=True)

    primary_druid_dimension = relationship(
        'CaseTypeMetadataFromDruidDimension',
        viewonly=True,
        foreign_keys=[primary_druid_dimension_id],
    )

    naming_druid_dimension = relationship(
        'CaseTypeMetadataFromDruidDimension',
        viewonly=True,
        foreign_keys=[naming_druid_dimension_id],
    )

    # metadata that we pull from druid dimensions (e.g. RegionName = Sofala)
    metadata_from_druid_dimensions = relationship(
        'CaseTypeMetadataFromDruidDimension',
        viewonly=True,
        foreign_keys="CaseTypeMetadataFromDruidDimension.case_type_id",
    )

    # metadata that we pull from druid fields (e.g. number_of_malaria_positive = 100)
    metadata_from_druid_fields = relationship(
        'CaseTypeMetadataFromDruidField', viewonly=True
    )
    fields = relationship('CaseTypeDefaultField', viewonly=True)

    def get_primary_druid_dimensions(self):
        '''If this is a DruidCaseType, it will return an array of the primary
        druid dimension names. Dimension names will be sorted alphabetically.
        If this is not a DruidCaseType, it will return an empty array.
        '''
        primary_dimensions = [
            dimension.druid_dimension_name
            for dimension in self.metadata_from_druid_dimensions
            if dimension.treat_as_primary_dimension
        ]
        return sorted(primary_dimensions)

    def get_druid_case_hash(self, dimension_value_strs):
        '''Convert a dict of dimension value strings into a case hash, that can be used
        to uniquely identify a druid case. This will return an empty string if this is
        not a Druid Case Type.

        Args:
            dimension_value_strs (dict of str): the dimension values representing a
            case (e.g. { DistrictName: 'Sofala', TravelerName: 'ABC' })
        Returns:
            string representing the case hash
        '''
        primary_dimensions = self.get_primary_druid_dimensions()
        return '__'.join(
            [dimension_value_strs[dim_name] or '' for dim_name in primary_dimensions]
        )


class Case(Base):
    '''Represents a case, which is anything concrete to track in case management, ie.
    an alert notification or location.
    '''

    __tablename__ = CASE_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)

    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        nullable=False,
    )

    # all the druid dimension values used to uniquely identify this Case.
    # this is only filled out for Druid Cases, not for Alert Cases.
    primary_druid_dimension_values = sa.Column(
        MutableDict.as_mutable(JSONB()), nullable=True
    )

    # the alert notification id that generated this Alert Case. This is not used
    # by Druid Cases.
    alert_notification_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'alert_notifications.id',
            ondelete='CASCADE',
            name='valid_alert_notification',
        ),
        nullable=True,
        unique=True,
    )
    case_status_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_STATUS_TYPE_TABLE_NAME}.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='valid_case_status_type',
        ),
        nullable=False,
    )

    # currently this is only used to store `{ alertSource: string }` for AlertCases
    spec = sa.Column(MutableDict.as_mutable(JSONB()), nullable=True)

    case_type = relationship('CaseType', viewonly=True)
    alert_notification = relationship('AlertNotification', viewonly=True)
    events = relationship('CaseEvent', viewonly=True)

    # any user-entered metadata values
    # TODO: rename to metadata_values_from_user
    metadata_values = relationship('CaseMetadata', viewonly=True)

    def get_druid_case_hash(self):
        '''Get the unique case hash to identify this case as a string. If this
        case is not a druid case, then it will return an empty string.

        Returns:
            string representing the druid case hash
        '''
        return self.case_type.get_druid_case_hash(self.primary_druid_dimension_values)


class CaseEvent(Base):
    '''Represents an event that can belong to one or more cases.'''

    __tablename__ = CASE_EVENT_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)

    name = sa.Column(sa.Text(), nullable=False)
    created = sa.Column(sa.DateTime(), nullable=False)
    type = sa.Column(sa.Enum(EventTypeEnum, name='event_type_enum'), nullable=False)
    description = sa.Column(sa.Text(), nullable=True)
    additional_info = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)
    case_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(f'{CASE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case'),
        nullable=True,
    )


class CaseTypeDefaultEvent(Base):
    '''A class that represents a mapping of events between a `CaseEvent` and
    `CaseType`.
    '''

    __tablename__ = CASE_TYPE_DEFAULT_EVENT_TABLE_NAME
    case_event_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_EVENT_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_event'
        ),
        primary_key=True,
        nullable=False,
    )
    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        primary_key=True,
        nullable=False,
    )


class CaseTypeMetadataFromDruidField(Base):
    '''Represents the configuration for metadata that is pulled from a Druid
    field.
    '''

    __tablename__ = CASE_TYPE_METADATA_FROM_DRUID_FIELD_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        nullable=False,
    )
    field_id = sa.Column(sa.Text(), nullable=False)
    display_name = sa.Column(sa.Text(), nullable=False)
    type = sa.Column(
        sa.Enum(DruidFieldMetadataTypeEnum, name='druid_field_metadata_type_enum'),
        nullable=False,
    )

    # should this field  be shown in the "All Cases" Overview table? If
    # False then it is only shown in the Case Page's Dossier
    show_in_overview_table = sa.Column(sa.Boolean(), nullable=False)
    dossier_section = sa.Column(sa.Text(), nullable=True)

    # TODO: The field id should be a foreign key and this would not be necessary.
    def get_description(self):
        field = find_one_by_fields(Field, True, {'id': self.field_id})
        if field is None:
            abort(INTERNAL_SERVER_ERROR, f'Field {self.field_id} does not exist.')
        return field.description


class CaseTypeMetadataFromDruidDimension(Base):
    '''A class that represents the additional druid dimensions for a `CaseType`.'''

    __tablename__ = CASE_TYPE_METADATA_FROM_DRUID_DIMENSION_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        nullable=False,
    )
    druid_dimension_name = sa.Column(sa.Text(), nullable=False)

    # should this dimension be treated as a primary dimension? If so, then we
    # will combine this with the case's `primary_druid_dimension` in order to
    # find unique cases. For example, if we don't have unique IDs, then a case
    # might use a TravelerName as the `primary_druid_dimension`, but to ensure
    # uniqueness, we'd also like to treat PhoneNumber as a primary dimension too.
    treat_as_primary_dimension = sa.Column(sa.Boolean(), nullable=False)

    # should this dimension be shown in the "All Cases" Overview table? If
    # False then it is only shown in the Case Page's Dossier
    show_in_overview_table = sa.Column(sa.Boolean(), nullable=False)
    dossier_section = sa.Column(sa.Text(), nullable=True)

    # TODO: The field id should be a foreign key and this would not be necessary
    def get_description(self):
        dimension = find_one_by_fields(
            Dimension, True, {'id': self.druid_dimension_name}
        )
        if dimension is None:
            abort(
                INTERNAL_SERVER_ERROR,
                f'Dimension {self.druid_dimension_name} does not exist.',
            )
        return dimension.description


class CaseStatusType(Base):
    '''A class that represents a status that a case can have.'''

    __tablename__ = CASE_STATUS_TYPE_TABLE_NAME

    id = sa.Column(sa.Integer(), primary_key=True)

    name = sa.Column(sa.Text(), nullable=False)
    is_open = sa.Column(sa.Boolean(), nullable=True)
    is_new = sa.Column(sa.Boolean(), nullable=True)


class CaseTypeDefaultStatus(Base):
    '''A class that represents a mapping of possible statuses between a
    `CaseStatusType` and `CaseType`.
    '''

    __tablename__ = CASE_TYPE_DEFAULT_STATUS_TABLE_NAME

    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        primary_key=True,
        nullable=False,
    )
    case_status_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_STATUS_TYPE_TABLE_NAME}.id',
            ondelete='CASCADE',
            name='valid_case_status_type',
        ),
        primary_key=True,
        nullable=False,
    )


class CaseMetadataType(Base):
    '''A class that represents the metadata that a case can have that is entered
    by user.
    '''

    __tablename__ = CASE_METADATA_TYPE_TABLE_NAME

    id = sa.Column(sa.Integer(), primary_key=True)
    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        nullable=False,
    )

    name = sa.Column(sa.Text(), nullable=False)
    type = sa.Column(
        sa.Enum(MetadataTypeEnum, name='metadata_type_enum'), nullable=False
    )
    is_editable = sa.Column(sa.Boolean(), nullable=False)

    # if the value is empty, should the row still be included in the case's
    # dossier?
    is_displayed_empty = sa.Column(sa.Boolean(), nullable=False)
    empty_display_value = sa.Column(sa.Text(), nullable=False)
    dossier_section = sa.Column(sa.Text(), nullable=True)


# TODO: rename this to CaseMetadataFromUser?
class CaseMetadata(Base):
    '''A class that represents a mapping of user-entered values (like a phone number or
    personnel info) for metadata between a `CaseMetadataType` and `Case`. This is the
    table that actually holds the values that the user entered.

    NOTE: this table stores only the user-entered metadata. Metadata that is
    pulled from Druid dimensions or indicators do not get stored here. They remain
    stored in druid.
    '''

    __tablename__ = CASE_METADATA_TABLE_NAME

    case_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(f'{CASE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case'),
        primary_key=True,
        nullable=False,
    )
    case_metadata_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_METADATA_TYPE_TABLE_NAME}.id',
            ondelete='CASCADE',
            name='valid_case_metadata_type',
        ),
        primary_key=True,
        nullable=False,
    )

    # all case metadata that is user-entered is always stored as a string
    value = sa.Column(sa.Text(), nullable=False)

    case_metadata_type = relationship('CaseMetadataType', viewonly=True)


class CaseTypeDefaultField(Base):
    '''A class that represents a mapping of monitored fields between a `CaseType` and
    a field.
    '''

    __tablename__ = CASE_TYPE_DEFAULT_FIELD_TABLE_NAME

    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        primary_key=True,
        nullable=False,
    )
    field_id = sa.Column(sa.Text(), primary_key=True, nullable=False)


class ExternalAlertType(Base):
    '''A class that represents a mapping of external alert types to a `CaseType`.
    External alert types are other alert systems that are integrated into Zenysis's.
    '''

    __tablename__ = EXTERNAL_ALERT_TYPE_TABLE_NAME

    id = sa.Column(sa.Integer(), primary_key=True)

    name = sa.Column(sa.Text(), nullable=False, unique=True)
    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        nullable=False,
    )
    field_id = sa.Column(sa.Text(), nullable=False)
    druid_dimension = sa.Column(sa.Text(), nullable=False)
    data_dimension = sa.Column(sa.Text(), nullable=False)

    ignored_activities = relationship('ExternalAlertActivityToIgnore', viewonly=True)


class ExternalAlertActivityToIgnore(Base):
    '''A class that represents a mapping of activities to ignore to an
    `ExternalAlertType`.
    '''

    __tablename__ = EXTERNAL_ALERT_ACTIVITY_TO_IGNORE_TABLE_NAME

    external_alert_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{EXTERNAL_ALERT_TYPE_TABLE_NAME}.id',
            ondelete='CASCADE',
            name='valid_external_alert_type',
        ),
        primary_key=True,
        nullable=False,
    )

    activity = sa.Column(sa.Text(), primary_key=True, nullable=False)
