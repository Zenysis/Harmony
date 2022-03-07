# pylint: disable=C0302
'''Note that this seed script is specifically for MZ.
'''
from datetime import datetime
from enum import Enum
import pandas as pd
import pytz
from slugify import slugify
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import relationship

from config.database import DATASOURCE
from config.indicators import GROUP_DEFINITIONS
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.query_builder import GroupByQueryBuilder
from db.druid.query_client import DruidQueryClient
from log.log import LOG
from web.server.data.data_access import Transaction
from web.server.migrations.seed_scripts.data_1a712d1436eb import DRUID_DIMENSION_VALUES
from . import get_session

# pylint: disable=C0103
# pylint: disable=W0640

Base = declarative_base()

ALERT_DEFINITION_TABLE_NAME = 'alert_definitions'
ALERT_NOTIFICATION_TABLE_NAME = 'alert_notifications'
CASE_EVENT_TABLE_NAME = 'case_event'
CASE_METADATA_TABLE_NAME = 'case_metadata'
CASE_METADATA_TYPE_TABLE_NAME = 'case_metadata_type'
CASE_STATUS_TYPE_TABLE_NAME = 'case_status_type'
CASE_TABLE_NAME = 'case'
CASE_TYPE_DEFAULT_DRUID_DIMENSION_TABLE_NAME = 'case_type_default_druid_dimension'
CASE_TYPE_DEFAULT_EVENT_TABLE_NAME = 'case_type_default_event'
CASE_TYPE_DEFAULT_FIELD_TABLE_NAME = 'case_type_default_field'
CASE_TYPE_DEFAULT_METADATA_TABLE_NAME = 'case_type_default_metadata'
CASE_TYPE_DEFAULT_STATUS_TABLE_NAME = 'case_type_default_status'
CASE_TYPE_TABLE_NAME = 'case_type'


class CaseTypeEnum(Enum):
    '''An enumeration of possible case types that a case can be associated with.
    '''

    # Indicates that the case is an alert.
    ALERT = 1

    # Indicates that the case is a druid dimension.
    DRUID = 2


class MetadataTypeEnum(Enum):
    '''An enumeration of possible types of metadata that can be added to a case.
    '''

    STRING = 1
    PHONE_NUMBER = 2
    NUMBER = 3
    DATE = 4


class EventTypeEnum(Enum):
    '''An enumeration of possible types of events that can be added to a case. Note that
    other types of events exist, but they are not stored in postgres.
    '''

    GLOBAL = 1
    USER = 2
    STATUS_CHANGE = 3
    METADATA_CHANGE = 4


class AlertDefinition(Base):
    '''Represents an alert definition.
    '''

    __tablename__ = ALERT_DEFINITION_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    checks = sa.Column(MutableList.as_mutable(JSONB()))
    dimension_name = sa.Column(sa.String())
    field_id = sa.Column(sa.String())
    time_granularity = sa.Column(sa.String())
    user_id = sa.Column(sa.Integer(), sa.ForeignKey('user.id', name='valid_user'))

    alert_notification = relationship('AlertNotification', viewonly=True)

    authorization_resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_alert_resource'),
        nullable=False,
        unique=True,
    )

    @hybrid_property
    def author_username(self):
        return self.user.username


class AlertNotification(Base):
    '''Represents an alert notification.
    '''

    __tablename__ = ALERT_NOTIFICATION_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)
    alert_definition_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('alert_definitions.id', ondelete='CASCADE'),
        name='alert_definition_id',
    )
    dimension_val = sa.Column(sa.String())
    generation_date = sa.Column(sa.String())
    message = sa.Column(sa.String())
    reported_val = sa.Column(sa.String())
    query_interval = sa.Column(sa.String())

    alert_definition = relationship('AlertDefinition')

    @hybrid_property
    def authorization_resource_id(self):
        return self.alert_definition.authorization_resource_id


class CaseType(Base):
    '''A class that represents the configs and default values for types of cases
    ie. alert or a druid dimension.
    '''

    __tablename__ = CASE_TYPE_TABLE_NAME

    id = sa.Column(sa.Integer(), primary_key=True)

    type = sa.Column(sa.Enum(CaseTypeEnum), nullable=False)
    druid_dimension = sa.Column(sa.Text(), nullable=True, unique=True)
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

    default_events = relationship(
        'CaseEvent', secondary=f'{CASE_TYPE_DEFAULT_EVENT_TABLE_NAME}', viewonly=True
    )
    statuses = relationship(
        'CaseStatusType',
        secondary=f'{CASE_TYPE_DEFAULT_STATUS_TABLE_NAME}',
        viewonly=True,
    )
    metadata_types = relationship(
        'CaseMetadataType',
        secondary=f'{CASE_TYPE_DEFAULT_METADATA_TABLE_NAME}',
        viewonly=True,
    )
    additional_druid_dimensions = relationship(
        'CaseTypeDefaultDruidDimension', viewonly=True
    )
    fields = relationship('CaseTypeDefaultField', viewonly=True)


class TemporaryCase(Base):
    '''Represents a case, which is anything concrete to track in case management, ie.
    an alert notification or location as the data is being upverted and downverted.
    '''

    __tablename__ = CASE_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)

    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        nullable=True,
    )
    druid_dimension_id = sa.Column(sa.Text(), nullable=True, unique=True)
    alert_notification_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{AlertNotification.__tablename__}.id',
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
        nullable=True,
    )
    spec = sa.Column(MutableDict.as_mutable(JSONB()), nullable=True)
    name = sa.Column(sa.String())
    type = sa.Column(sa.String())
    case_spec = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)

    case_type = relationship('CaseType', viewonly=True)
    alert_notification = relationship('AlertNotification', viewonly=True)
    status = relationship('CaseStatusType', viewonly=True)
    events = relationship('CaseEvent', viewonly=True)
    metadata_values = relationship('CaseMetadata', viewonly=True)


class CaseEvent(Base):
    '''Represents an event that can belong to one or more cases.
    '''

    __tablename__ = CASE_EVENT_TABLE_NAME
    id = sa.Column(sa.Integer(), primary_key=True)

    name = sa.Column(sa.Text(), nullable=False)
    created = sa.Column(sa.DateTime(), nullable=False)
    type = sa.Column(sa.Enum(EventTypeEnum), nullable=False)
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


class CaseTypeDefaultDruidDimension(Base):
    '''A class that represents the additional druid dimensions for a `CaseType`.
    '''

    __tablename__ = CASE_TYPE_DEFAULT_DRUID_DIMENSION_TABLE_NAME

    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
        primary_key=True,
        nullable=False,
    )
    druid_dimension_name = sa.Column(sa.Text(), nullable=False)


class CaseStatusType(Base):
    '''A class that represents a status that a case can have.
    '''

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
    '''A class that represents the metadata that a case can have.
    '''

    __tablename__ = CASE_METADATA_TYPE_TABLE_NAME

    id = sa.Column(sa.Integer(), primary_key=True)

    name = sa.Column(sa.Text(), nullable=False)
    type = sa.Column(sa.Enum(MetadataTypeEnum), nullable=False)
    is_editable = sa.Column(sa.Boolean(), nullable=False)
    is_displayed_empty = sa.Column(sa.Boolean(), nullable=False)
    empty_display_value = sa.Column(sa.Text(), nullable=False)


class CaseTypeDefaultMetadata(Base):
    '''A class that represents a mapping of possible metadata between a
    `CaseMetadataType` and `CaseType`.
    '''

    __tablename__ = CASE_TYPE_DEFAULT_METADATA_TABLE_NAME

    case_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            f'{CASE_TYPE_TABLE_NAME}.id', ondelete='CASCADE', name='valid_case_type'
        ),
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


class CaseMetadata(Base):
    '''A class that represents a mapping of user entered values (like a phone number or
    personnel info) for metadata between a `CaseMetadataType` and `Case`.
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
    value = sa.Column(sa.Text(), nullable=False)


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


# Metadata names changed due display names needing to be stored in postgres
OLD_METADATA_NAMES_TO_NEW = {
    'ewarsAlertStage': 'ewarsAlertStage',
    'ewarsAlertStageState': 'ewarsAlertStageState',
    'ewarsAlertState': 'ewarsAlertState',
    'outcome': 'outcome',
    'ewarsAlertRisk': 'ewarsAlertRisk',
    'ewarsPhone': 'EWARS Phone',
    'pointOfContact': 'Point of Contact',
    'personalPhone': 'Personal Phone',
}
NEW_METADATA_NAMES_TO_OLD = {
    'ewarsAlertStage': 'ewarsAlertStage',
    'ewarsAlertStageState': 'ewarsAlertStageState',
    'ewarsAlertState': 'ewarsAlertState',
    'outcome': 'outcome',
    'ewarsAlertRisk': 'ewarsAlertRisk',
    'EWARS Phone': 'ewarsPhone',
    'Point of Contact': 'pointOfContact',
    'Personal Phone': 'personalPhone',
}

# Status names also changed to store display names
OLD_STATUS_NAMES_TO_NEW = {
    'new': 'New',
    'VERIFICATION': 'VERIFICATION',
    'RISK_CHAR': 'RISK_CHAR',
    'RISK_ASSESS': 'RISK_ASSESS',
    'MONITOR': 'MONITOR',
    'RESPONSE': 'RESPONSE',
    'DISCARDED': 'DISCARDED',
    'CLOSED': 'CLOSED',
    'active': 'Active',
    'inactive': 'Inactive',
}
NEW_STATUS_NAMES_TO_OLD = {
    'New': 'new',
    'VERIFICATION': 'VERIFICATION',
    'RISK_CHAR': 'RISK_CHAR',
    'RISK_ASSESS': 'RISK_ASSESS',
    'MONITOR': 'MONITOR',
    'RESPONSE': 'RESPONSE',
    'DISCARDED': 'DISCARDED',
    'CLOSED': 'CLOSED',
    'Active': 'active',
    'Inactive': 'inactive',
}

IDAI_LANDFALL_EVENT = {
    'name': 'Idai landfall',
    'created': '2019-03-14',
    'type': EventTypeEnum.GLOBAL,
    'description': None,
    'additional_info': {'metadata': []},
}

# Can't determine the DistrictName for Bairros
ADDITIONAL_DIMENSIONS = {
    'FacilityName': ['DistrictName', 'ProvinceName'],
    'DistrictName': ['ProvinceName'],
    'BairroName': [],
}

MAPPINGS = {
    'FacilityName': pd.read_csv(
        'pipeline/mozambique/static_data/mappings/facility_mapped.csv'
    ),
    'PostoName': pd.read_csv(
        'pipeline/mozambique/static_data/mappings/posto_mapped.csv'
    ),
    'DistrictName': pd.read_csv(
        'pipeline/mozambique/static_data/mappings/district_mapped.csv'
    ),
    'ProvinceName': pd.read_csv(
        'pipeline/mozambique/static_data/mappings/province_mapped.csv'
    ),
}

# The datetime columns have no timezone, so set it for the events be created now. This
# won't be a problem as cases will be created in the timezone they're being viewed in
MZ_TZ = pytz.timezone('Africa/Maputo')

# Stored in every alert in the old case table
ALERT_CONFIG = {
    "caseType": "alert",
    "caseModelType": "ALERT",
    "caseTypeLabel": "Alert",
    "defaultStatus": "new",
    "caseStatusTypes": [
        "new",
        "VERIFICATION",
        "RISK_CHAR",
        "RISK_ASSESS",
        "MONITOR",
        "RESPONSE",
        "DISCARDED",
        "CLOSED",
    ],
    "caseMetadataOrder": [
        "ewarsAlertStage",
        "ewarsAlertStageState",
        "ewarsAlertState",
        "ewarsAlertRisk",
        "outcome",
    ],
    "closedStatusTypes": ["CLOSED", "DISCARDED"],
    "defaultAlertSource": "mAlert",
    "summaryStatusTypes": ["new", "VERIFICATION"],
    "caseTypePluralLabel": "Alerts",
    "externalAlertFieldId": "ewars_alert_count",
    "isCaseDataExpandable": True,
    "caseStatusDescriptors": {
        "new": {"id": "new", "label": "New"},
        "CLOSED": {"id": "CLOSED", "label": "Closed"},
        "MONITOR": {"id": "MONITOR", "label": "Monitor"},
        "RESPONSE": {"id": "RESPONSE", "label": "Response"},
        "DISCARDED": {"id": "DISCARDED", "label": "Discarded"},
        "RISK_CHAR": {"id": "RISK_CHAR", "label": "Risk Characterization"},
        "RISK_ASSESS": {"id": "RISK_ASSESS", "label": "Risk Assessment"},
        "VERIFICATION": {"id": "VERIFICATION", "label": "Verification"},
    },
    "dashboardQueryMetadata": [{"viewType": "TIME", "granularity": "day"}],
    "externalAlertDimension": "FacilityName",
    "caseMetadataDescriptors": {
        "outcome": {
            "id": "outcome",
            "type": "string",
            "label": "EWARS Outcome",
            "isEditable": False,
            "displayEmpty": True,
            "emptyDisplayValue": "",
        },
        "ewarsAlertRisk": {
            "id": "ewarsAlertRisk",
            "type": "string",
            "label": "EWARS Alert Risk",
            "isEditable": False,
            "displayEmpty": True,
            "emptyDisplayValue": "",
        },
        "ewarsAlertStage": {
            "id": "ewarsAlertStage",
            "type": "string",
            "label": "EWARS Alert Stage",
            "isEditable": False,
            "displayEmpty": False,
            "emptyDisplayValue": "",
        },
        "ewarsAlertState": {
            "id": "ewarsAlertState",
            "type": "string",
            "label": "EWARS Alert State",
            "isEditable": False,
            "displayEmpty": False,
            "emptyDisplayValue": "",
        },
        "ewarsAlertStageState": {
            "id": "ewarsAlertStageState",
            "type": "string",
            "label": "EWARS Stage State",
            "isEditable": False,
            "displayEmpty": False,
            "emptyDisplayValue": "",
        },
    },
    "externalAlertDataDimension": "AlertData",
    "alwaysUseZenysisAlertStatus": True,
    "externalAlertActivitiesToIgnore": {},
}


# Query druid to get last date data was added and additional dimensions for all
# locations for downverting the table
def query_druid():
    base_query = GroupByQueryBuilder(
        datasource=DATASOURCE.name,
        granularity='all',
        grouping_fields=[
            'BairroName',
            'FacilityName',
            'PostoName',
            'DistrictName',
            'ProvinceName',
        ],
        intervals=['1970-01-01/2070-01-01'],
        calculation=BaseCalculation(
            aggregations={'lastDate': {'type': 'longMax', 'fieldName': '__time'}}
        ),
        dimension_filter=GroupByQueryBuilder.build_dimension_filter(
            [
                {'source': 'INS-INGC'},
                {'source': 'INS-SURVEILLANCE-CHOLERA'},
                {'source': 'IUD'},
                {'source': 'EWARS-monitoring'},
                {'source': 'EWARS-cholera-line-list'},
            ]
        ),
    )
    return DruidQueryClient.run_query(base_query).result


# Save the result of the druid query
QUERY_RESULTS = query_druid()


def upvert_data(alembic_operation):
    clean_mappings()

    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_default_case_events(transaction)

        case_types = {}
        for x in transaction.find_all_by_fields(CaseType, {}):
            if x.type == CaseTypeEnum.ALERT:
                case_types['alert'] = x
            else:
                case_types[x.druid_dimension] = x

        # Update every case in the case table
        for case in transaction.find_all_by_fields(TemporaryCase, {}):
            case_info = case.case_spec['coreInfo']

            if case.type == 'alert':
                druid_dimension_id = None

                alert_notification = transaction.find_by_id(
                    AlertNotification, int(case_info['alertNotification']['id'])
                )
                # If the alert notification has been deleted, delete the case
                if not alert_notification:
                    LOG.info(
                        'Deleted alert \'%s\' since alert notification %s was deleted.',
                        case_info['name'],
                        case_info['alertNotification']['id'],
                    )
                    transaction.delete(case)
                    continue

                alert_notification_id = alert_notification.id
                spec = {'alertSource': case_info['alertSource']}
            else:
                dimensions = {case_info['caseType']: case_info['name']}
                for dimension in case_info['additionalDimensions']:
                    dimensions[dimension['dimensionId']] = dimension['value']

                druid_dimension_id = get_dimension_id(dimensions, case_info['caseType'])
                duplicate_case = transaction.find_one_by_fields(
                    TemporaryCase,
                    True,
                    {
                        'druid_dimension_id': druid_dimension_id,
                        'case_type_id': case_types[case.type].id,
                    },
                )
                # If there is a duplicate case due to name changes, merge them
                if duplicate_case:
                    case_id = duplicate_case.id
                    add_case_events_and_metadata(
                        transaction,
                        case_id,
                        case.case_spec['events'],
                        case.case_spec['caseMetadata'],
                    )

                    transaction.delete(case)
                    LOG.info('Merged druid cases %s', dimensions[case_info['caseType']])
                    continue

                alert_notification_id = None
                spec = None

            case_status_type = transaction.find_one_by_fields(
                CaseStatusType,
                True,
                {'name': OLD_STATUS_NAMES_TO_NEW[case_info['caseStatusId']]},
            )
            if not case_status_type:
                raise ValueError(
                    'Could not find case status type \'{}\''.format(
                        OLD_STATUS_NAMES_TO_NEW[case_info['caseStatusId']]
                    )
                )

            case.case_type_id = case_types[case.type].id
            case.druid_dimension_id = druid_dimension_id
            case.alert_notification_id = alert_notification_id
            case.case_status_type_id = case_status_type.id
            case.spec = spec
            transaction.add_or_update(case, flush=True)

            add_case_events_and_metadata(
                transaction,
                case.id,
                case.case_spec['events'],
                case.case_spec['caseMetadata'],
            )
        LOG.info('Successfully updated all cases.')


def downvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        delete_default_case_events(transaction)

        # Update every case in the case table
        for case in transaction.find_all_by_fields(TemporaryCase, {}):
            # Move events from their own table back to case_spec
            case_spec = {'events': [], 'caseMetadata': {}}
            for case_event in case.events:
                if case_event.type in [
                    EventTypeEnum.USER,
                    EventTypeEnum.STATUS_CHANGE,
                    EventTypeEnum.METADATA_CHANGE,
                ]:
                    case_event_type = 'USER'
                else:  # GLOBAL EventTypeEnum
                    case_event_type = 'CONFIG'

                case_event_spec = {
                    'date': case_event.created.astimezone(MZ_TZ).isoformat(),
                    'name': case_event.name,
                    'type': case_event_type,
                    'customIcon': case_event.additional_info.get(
                        'customIcon', 'glyphicon-pencil'
                    ),
                    'description': case_event.description
                    if case_event.description
                    else '',
                    'additionalInfo': case_event.additional_info['metadata'],
                }
                case_spec['events'].append(case_event_spec)

            # Recreate the coreInfo portion of case_spec
            case_spec['coreInfo'] = {
                'caseStatusId': NEW_STATUS_NAMES_TO_OLD[case.status.name]
            }

            if case.case_type.type == CaseTypeEnum.ALERT:
                alert_notification = case.alert_notification
                alert_definition = alert_notification.alert_definition

                case_spec['coreInfo']['name'] = get_field_name(
                    alert_definition.field_id, alert_notification
                )
                case_spec['coreInfo']['config'] = ALERT_CONFIG
                case_spec['coreInfo']['caseType'] = 'alert'
                case_spec['coreInfo']['alertSource'] = case.spec['alertSource']
                case_spec['coreInfo']['alertNotification'] = {
                    'id': alert_notification.id,
                    '$uri': '/api2/alert_notifications/' + str(alert_notification.id),
                    'fieldId': alert_definition.field_id,
                    'message': alert_notification.message,
                    'reportedVal': alert_notification.reported_val,
                    'dimensionVal': alert_notification.dimension_val,
                    'dimensionName': alert_definition.dimension_name,
                    'queryInterval': alert_notification.query_interval,
                    'generationDate': alert_notification.generation_date,
                    'alertDefinition': {
                        '$ref': '/api2/alert_definitions/' + str(alert_definition.id)
                    },
                }
            else:
                dimension = case.case_type.druid_dimension
                dimension_value = get_dimension_value(case.druid_dimension_id)

                case_spec['coreInfo']['caseType'] = dimension
                case_spec['coreInfo']['name'] = dimension_value['name']
                case_spec['coreInfo']['lastDateAvailable'] = get_last_date(
                    dimension_value
                )
                case_spec['coreInfo'][
                    'additionalDimensions'
                ] = get_additional_dimensions(dimension_value, dimension)

            # Move metadata from their own table back to case_spec
            for case_metadata in case.metadata_values:
                # Find the name of the metadata by its id
                name = next(
                    x.name
                    for x in case.case_type.metadata_types
                    if x.id == case_metadata.case_metadata_type_id
                )
                case_spec['caseMetadata'][
                    NEW_METADATA_NAMES_TO_OLD[name]
                ] = case_metadata.value

            case.name = case_spec['coreInfo']['name']
            case.type = case_spec['coreInfo']['caseType']
            case.case_spec = case_spec
            transaction.add_or_update(case)

        # Delete all events from CaseEvent
        events = transaction.find_all_by_fields(CaseEvent, {})
        for event in events:
            transaction.delete(event)
        LOG.info('Migrated all case events back to the case table.')

        # Delete all metadata entries from CaseMetadata
        metadata = transaction.find_all_by_fields(CaseMetadata, {})
        for metadatum in metadata:
            transaction.delete(metadatum)
        LOG.info('Migrated all case metadata back to the case table.')

        LOG.info('Successfully reverted all cases.')


# Recreate the old case id
def recreate_id(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        for case in transaction.find_all_by_fields(TemporaryCase, {}):
            case.id = _get_id_from_core_info(case.case_spec['coreInfo'])
            transaction.add_or_update(case)

    LOG.info('Recreated all case ids.')


# Add all default events for a case type
def add_default_case_events(transaction):
    case_event = CaseEvent(
        name=IDAI_LANDFALL_EVENT['name'],
        created=IDAI_LANDFALL_EVENT['created'],
        type=IDAI_LANDFALL_EVENT['type'],
        description=IDAI_LANDFALL_EVENT['description'],
        additional_info=IDAI_LANDFALL_EVENT['additional_info'],
    )
    transaction.add_or_update(case_event, flush=True)

    # Idai is a default for all druid case types
    case_types = transaction.find_all_by_fields(CaseType, {'type': CaseTypeEnum.DRUID})
    for case_type in case_types:
        default_event = CaseTypeDefaultEvent(
            case_event_id=case_event.id, case_type_id=case_type.id
        )
        transaction.add_or_update(default_event)

    LOG.info('Added all default case events.')


# Put all case events and metadata in their own tables
def add_case_events_and_metadata(transaction, case_id, events, metadata):
    # Move events
    for event in events:
        if event['description']:
            description = event['description']
        else:
            description = None

        additional_info = {'metadata': []}
        if event['name'] in NEW_STATUS_NAMES_TO_OLD.keys():
            event_type = EventTypeEnum.STATUS_CHANGE
        elif event['type'] == 'USER':
            event_type = EventTypeEnum.USER
            if event['customIcon'] != 'glyphicon-option-horizontal':
                additional_info['customIcon'] = event['customIcon']
        else:
            raise ValueError(
                'Unrecognized case event type \'{}\''.format(event['type'])
            )

        for event_metadata in event['additionalInfo']:
            additional_info['metadata'].append(event_metadata)

        case_event = CaseEvent(
            name=event['name'],
            created=datetime.fromisoformat(event['date']).astimezone(MZ_TZ),
            type=event_type,
            description=description,
            additional_info=additional_info,
            case_id=case_id,
        )
        transaction.add_or_update(case_event)

    # Move metadata
    for metadata_name, value in metadata.items():
        if value is not None:
            case_metadata_type = transaction.find_one_by_fields(
                CaseMetadataType,
                True,
                {'name': OLD_METADATA_NAMES_TO_NEW[metadata_name]},
            )
            if not case_metadata_type:
                raise ValueError(
                    f'Could not find case metadata type \'{metadata_name}\''
                )

            metadatum = CaseMetadata(
                case_id=case_id,
                case_metadata_type_id=case_metadata_type.id,
                value=value,
            )
            transaction.add_or_update(metadatum)


# Remove all default events for a case type
def delete_default_case_events(transaction):
    case_event = transaction.find_one_by_fields(CaseEvent, True, IDAI_LANDFALL_EVENT)
    if not case_event:
        raise ValueError('Could not find case event Idai Landfall.')

    transaction.delete(case_event)
    LOG.info('Deleted all default case events.')


# Get the unique dimension id and update any location names that have changed
def get_dimension_id(dimensions, case_dimension):
    # Bairro doesn't have a mappings file
    if case_dimension == 'BairroName':
        dimensions_to_check = {
            k: dimensions[k] for k in ADDITIONAL_DIMENSIONS['BairroName']
        }
    else:
        dimensions_to_check = dimensions

    # Check the location exists in druid by checking the mappings. If it doesn't, then
    # attempt to correct it.
    for dimension, dimension_name in dimensions_to_check.items():
        df = MAPPINGS[dimension]
        if dimension_name not in df[dimension].values:
            row = df[df['Matched'].apply(lambda x: dimension_name.lower() in x)]
            if len(row.index) != 1:
                raise ValueError(
                    f'Dimension could not be corrected: {dimension} '
                    f'{dimension_name} matched {row}.'
                )
            LOG.info(
                '%s %s updated to %s', dimension, dimension_name, row[dimension].iloc[0]
            )
            dimensions[dimension] = row[dimension].iloc[0]

    if case_dimension == 'BairroName':
        druid_dimensions = {'BairroName': dimensions['BairroName']}
    else:
        druid_dimensions = dimensions

    for x in DRUID_DIMENSION_VALUES:
        if druid_dimensions.items() <= x['filter'].items():
            return x['id']

    raise ValueError(f'Could not find dimension id for {dimensions}.')


# Get the dimension value from druid cache
def get_dimension_value(dimension_id):
    for x in DRUID_DIMENSION_VALUES:
        if x['id'] == dimension_id:
            return x

    raise ValueError(f'Could not find dimension value for {dimension_id}.')


# Get the additional dimensions according to ADDITIONAL_DIMENSIONS
def get_additional_dimensions(dimension_value, case_dimension):
    additional_dimensions = []
    for dimension in ADDITIONAL_DIMENSIONS[case_dimension]:
        additional_dimension_value = dimension_value['filter'][dimension]
        additional_dimensions.append(
            {'value': additional_dimension_value, 'dimensionId': dimension}
        )
    return additional_dimensions


# Get the last date data was available
def get_last_date(dimension_value):
    # Data is grouped by smallest location type, so may need to aggregate multiple
    # results for the correct date.
    last_date = 0
    for query in QUERY_RESULTS:
        if dimension_value['filter'].items() <= query['event'].items():
            last_date = max(query['event']['lastDate'], last_date)

    return datetime.fromtimestamp(last_date / 1000).astimezone().isoformat()


# From case_management_api_models to convert a case name to an id, copied to preserve
# database migrations.
def _get_id_from_core_info(case_core_info):
    case_type = case_core_info['caseType']
    case_id_from_name = slugify(case_core_info['name'], separator='_')
    if case_type == 'alert':
        # multiple alerts can have the same name, so append the alert notification id
        # to ensure it is unique
        alert_id = case_core_info['alertNotification']['id']
        return f'{case_id_from_name}_{alert_id}'
    return case_id_from_name


# Get the original case field name in quick stats
def get_field_name(field_id, alert_notification):
    for field_group in GROUP_DEFINITIONS:
        for field in field_group['indicators']:
            if field['id'] == field_id:
                return '{} - {} ({}) {}'.format(
                    alert_notification.dimension_val,
                    field['text'],
                    field_group['groupTextShort'],
                    alert_notification.message,
                )
    raise ValueError(f'Could not find full field name \'{field_id}\'.')


# Get the columns in MAPPINGS that are name matches, clean them, and convert them to a
# list
def clean_mappings():
    mappings_match = {
        k: [x for x in v.columns if 'match' in x] for k, v in MAPPINGS.items()
    }
    for dimension, df in MAPPINGS.items():
        df['Matched'] = df[mappings_match[dimension]].values.tolist()
        df['Matched'] = df['Matched'].apply(
            lambda l: [match.strip().lower() for match in l if not pd.isna(match)]
        )
