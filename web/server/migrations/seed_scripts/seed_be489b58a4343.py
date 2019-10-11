from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

import sqlalchemy as sa

from log import LOG

Base = declarative_base()


class Role(Base):
    '''A class that defines permissions that can be assigned to a `User` or a `Group`.
    '''

    __tablename__ = 'role'

    id = sa.Column(sa.Integer(), primary_key=True)
    name = sa.Column(sa.String(50), nullable=False, server_default=u'', unique=True)
    label = sa.Column(sa.Unicode(255), server_default=u'')  # for display purposes
    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey(
            'resource_type.id', ondelete='CASCADE', name='valid_resource_type'
        ),
        nullable=False,
    )


class Resource(Base):
    '''Represents a resource on the site (e.g. a Dashboard, Database, User or
    even the website itself)
    '''

    __tablename__ = 'resource'

    id = sa.Column(sa.Integer(), primary_key=True)

    resource_type_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource_type.id', name='valid_resource_type'),
        nullable=False,
    )

    name = sa.Column(sa.String(1000), nullable=False)
    label = sa.Column(sa.String(1000), nullable=False)


class PublicRoles(Base):
    '''A class that represents a mapping between an 'Anonymous User' (user that is unauthenticated)
    and a `Role`. All regular Users will also receive the permissions that are assigned to
    Anonymous Users.
    '''

    __tablename__ = 'public_roles'

    id = sa.Column(sa.Integer(), primary_key=True)
    role_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('role.id', ondelete='CASCADE', name='valid_role'),
        nullable=False,
    )
    resource_id = sa.Column(
        sa.Integer(),
        sa.ForeignKey('resource.id', ondelete='CASCADE', name='valid_resource'),
        nullable=True,
    )


def add_public_querying_role(session):
    query_runner_role = session.query(Role).filter_by(name='query_runner')[0]
    root_site_resource = session.query(Resource).filter_by(name='/')[0]

    if (
        session.query(PublicRoles)
        .filter_by(role_id=query_runner_role.id, resource_id=root_site_resource.id)
        .count()
        > 0
    ):

        LOG.info('Seed data is already present.')
        return

    public_querying_role = PublicRoles(
        role_id=query_runner_role.id, resource_id=root_site_resource.id
    )
    session.add(public_querying_role)
    return


def delete_public_querying_role(session):
    query_runner_role = session.query(Role).filter_by(name='query_runner')[0]
    root_site_resource = session.query(Resource).filter_by(name='/')[0]
    public_querying_role = session.query(PublicRoles).filter_by(
        role_id=query_runner_role.id, resource_id=root_site_resource.id
    )[0]
    session.delete(public_querying_role)
    return


def add_seed_data(alembic_operation):
    bind = alembic_operation.get_bind()
    session = Session(bind=bind)
    LOG.info('Adding seed data for be489b58a4343.')
    add_public_querying_role(session)
    session.commit()
    LOG.info('Successfully added seed data.')


def rollback_seed_data(alembic_operation):
    bind = alembic_operation.get_bind()
    session = Session(bind=bind)
    LOG.info('Deleting seed data for be489b58a4343.')
    delete_public_querying_role(session)
    session.commit()
    LOG.info('Successfully deleted seed data.')
