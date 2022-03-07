import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import relationship

from web.server.data.data_access import Transaction

from . import get_session

# pylint: disable=C0103

Base = declarative_base()


class Resource(Base):
    __tablename__ = 'resource'
    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id',
            ondelete='RESTRICT',
            onupdate='CASCADE',
            name='valid_resource_type',
        ),
        nullable=False,
    )
    name = sa.Column(sa.String(1000), nullable=False)
    label = sa.Column(sa.String(1000), nullable=False)


class Dashboard(Base):
    __tablename__ = 'dashboard'
    id = sa.Column(sa.Integer, primary_key=True)
    slug = sa.Column(sa.String(1000), unique=True)
    description = sa.Column(sa.Text(), nullable=True)
    specification = sa.Column(MutableDict.as_mutable(JSONB()), nullable=False)
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource.id',
            ondelete='CASCADE',
            onupdate='CASCADE',
            name='valid_dashboard_resource',
        ),
        nullable=False,
        unique=True,
    )
    author_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('user.id', ondelete='RESTRICT', name='valid_user'),
        nullable=False,
    )
    is_official = sa.Column(sa.Boolean(), server_default='false', nullable=False)
    total_views = sa.Column(sa.Integer(), nullable=False, server_default='0')
    resource = relationship('Resource', viewonly=True)


class SitewideResourceAcl(Base):
    __tablename__ = 'sitewide_resource_acl'
    id = sa.Column(sa.Integer(), primary_key=True)
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=False,
        unique=True,
    )
    registered_resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id',
            ondelete='CASCADE',
            name='valid_registered_resource_role',
        ),
        nullable=True,
    )
    unregistered_resource_role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_role.id',
            ondelete='CASCADE',
            name='valid_unregistered_resource_role',
        ),
        nullable=True,
    )


class ResourceRole(Base):
    __tablename__ = 'resource_role'
    id = sa.Column(sa.Integer(), primary_key=True, autoincrement=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='RESTRICT', name='valid_resource_type'
        ),
        nullable=False,
    )


def add_official_dashboard_as_sitewide_resource(transaction):
    official_dashboards = transaction.find_all_by_fields(
        Dashboard, {'is_official': True}
    )
    dashboard_viewer_resource_role = transaction.find_one_by_fields(
        ResourceRole, True, {'name': 'dashboard_viewer'}
    )
    for dashboard in official_dashboards:
        dashboard_resource_id = dashboard.resource.id
        sitewide_resource_acl = transaction.find_one_by_fields(
            SitewideResourceAcl, True, {'resource_id': dashboard_resource_id}
        )
        if sitewide_resource_acl:
            sitewide_resource_acl.registered_resource_role_id = (
                dashboard_viewer_resource_role.id
            )
            transaction.add_or_update(sitewide_resource_acl)
        else:
            transaction.add_or_update(
                SitewideResourceAcl(
                    resource_id=dashboard_resource_id,
                    registered_resource_role_id=dashboard_viewer_resource_role.id,
                )
            )


# Mark all official dashboards as viewable across all sitewide registered users
def upvert_data(alembic_operation):
    with Transaction(get_session=lambda: get_session(alembic_operation)) as transaction:
        add_official_dashboard_as_sitewide_resource(transaction)
