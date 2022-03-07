from past.builtins import basestring
from builtins import object


def get_db_adapter():
    '''Gets the database access object (DAO) that
    is used to interact with the User Database.

    Returns
    -------
    SQLAlchemy
        The SQLAlchemy database access object configured for the current Flask application.
    '''
    # NOTE(stephen): Lazily importing from flask so that this file can be used
    # from the pipeline.
    from flask import current_app

    return current_app.extensions['sqlalchemy'].db


def add_entity(session, new_entity, flush=False, commit=False):
    '''Adds an entity to the database.
    Parameters
    ----------
    session: scoped_session
        The SQLAlchemy session that this operation will be performed in.

    new_entity: models.base.Model
        The entity to be added to the database.

    flush (optional): bool
        The behaviour of flush() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.flush

        In general this is done during addition to retrieve the `id` value assigned to `new_entity`
        before the actual Database transaction is committed.

    commit (optional): bool
        The behaviour of commit() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.commit

    Returns
    -------
    models.base.Model
        The added or updated entity.
    '''

    session.add(new_entity)
    if flush:
        session.flush()
        session.refresh(new_entity)

    if commit:
        session.commit()

    return new_entity


def add_all_entities(session, entity_list, flush=True, commit=False):
    '''Adds a list of entities to the database. Runs flush / commit after each
    individual entity is added.

    Parameters
    ----------
    session: scoped_session
        The SQLalchemy session to connect to the database.

    entity_list: List<models.base.Model>
        List of entities that will be added.

    flush (optional): bool
        The behaviour of flush() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.flush

    commit (optional): bool
        The behaviour of commit() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.commit
    '''
    for entity in entity_list:
        add_entity(session, entity, flush, commit)


def delete_entity(session, entity, flush=False, commit=False):
    '''Deletes an entity from the database.
    Parameters
    ----------
    session: scoped_session
        The SQLAlchemy session that this operation will be performed in.

    entity: models.base.Model
        The entity to be deleted from the database.

    flush (optional): bool
        The behaviour of flush() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.flush

    commit (optional): bool
        The behaviour of commit() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.commit

    Returns
    -------
    models.base.Model
        The deleted entity.
    '''

    session.delete(entity)
    if flush:
        session.flush()

    if commit:
        session.commit()

    return entity


def delete_all_by_fields(
    entity_class, search_fields, session=None, flush=False, commit=False
):
    '''Deletes all entities that are of type `entity_class` that fit params
    described in `search_fields`.

    Parameters
    ----------
    entity_class: models.base.Model
        The entity to be deleted from the database.

    search_fields: dict
        A dictionary with keys representing column names and values representing
        a single column value.

    session(optional): scoped_session
        The SQLAlchemy session that this operation will be performed in.

    flush (optional): bool
        The behaviour of flush() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.flush

    commit (optional): bool
        The behaviour of commit() is defined here:
        http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.commit

    '''
    session = session or get_db_adapter().session
    session.query(entity_class).filter_by(**search_fields).delete()

    if flush:
        session.flush()

    if commit:
        session.commit()


def find_by_id(entity_class, entity_id, id_column='id', session=None):
    '''Tries to get an entity by its 'id'.

    Parameters
    ----------
    entity_class: models.base.Model
        The SQLAlchemy Model Class.

    entity_id: any
        The id of the entity, it is generally an integer but any value
        but is type agnostic. It must however match whatever type is
        defined in the actual database table column otherwise this function
        will not find a match.

    id_column (optional):
        The `id` column of the table. By default, it is assumed to be `id`.

    Returns
    -------
    models.base.Model
        An instance of `entity_class` if such an instance exists or `None`
    '''
    session = session or get_db_adapter().session
    search_fields = {id_column: entity_id}

    if not entity_id:
        return None

    return find_all_by_fields(entity_class, search_fields, session).first()


def find_all_by_fields(entity_class, search_fields, session=None):
    '''Tries to find all entities by multiple fields (given in search_fields)

    Parameters
    ----------
    entity_class: models.base.Model
        The SQLAlchemy Model Class.

    search_fields: dict
        A dictionary with keys representing column names and values representing
        a single column value.

        e.g. If you wanted to search by `first_name` and `last_name`, `search_fields`
        would look like:
        {
            'first_name': 'Foo',
            'last_name: 'Bar',
        }

    Returns
    -------
    iter
        An enumeration of instances of `entity_class` if they exist or an empty list.
    '''
    session = session or get_db_adapter().session
    return session.query(entity_class).filter_by(**search_fields)


def find_one_by_fields(entity_class, case_sensitive, search_fields, session=None):
    '''Tries to find an entity by multiple fields (given in search_fields)

    Parameters
    ----------
    entity_class: models.base.Model
        The SQLAlchemy Model Class.

    case_sensitive: bool
        Indicates whether or not the comparison is case-sensitive or not.

    search_fields: dict
        A dictionary with keys representing column names and values representing
        a single column value.

        e.g. If you wanted to search by `first_name` and `last_name`, `search_fields`
        would look like:
        {
            'first_name': 'Foo',
            'last_name: 'Bar',
        }

    Returns
    -------
    models.base.Model
        An instance of `entity_class` if such an instance exists or `None`
    '''

    if case_sensitive:
        return find_all_by_fields(entity_class, search_fields, session).first()

    # Convert each name/value pair in 'kwargs' into a filter
    session = session or get_db_adapter().session
    query = session.query(entity_class)
    for field_name, field_value in list(search_fields.items()):
        # Make sure that ObjectClass has a 'field_name' property
        field = getattr(entity_class, field_name, None)
        if field is None:
            raise KeyError(
                'Class \'%s\' has no field \'%s\'.' % (entity_class, field_name)
            )

        if isinstance(field_value, basestring):
            # Add a case sensitive filter to the query
            query = query.filter(field.ilike(field_value))  # case INsensitive!!
        else:
            query = query.filter(field == field_value)

    # Execute query
    return query.first()


def find_distinct_field_values(instrumented_attr, session=None):
    '''Gets all distinct values for a field of a given class.
    '''
    session = session or get_db_adapter().session
    return [val[0] for val in session.query(instrumented_attr).distinct().all()]


class Transaction(object):
    '''A simple wrapper around `session` that makes it easy to auto-commit
    or rollback a transaction based on configurable behaviour.
    '''

    def __init__(self, should_commit=None, get_session=None):
        '''Creates a new instance of Transaction.

        Parameters
        ----------
        should_commit: callable
            (optional) A function that takes in the following three parameters:
                1. exception_type: class - The type of exception that was thrown (or None)
                2. exception_value: Exception - The instance of the exception that was thrown
                   (or None)
                3. exception_traceback - The callstack of the thrown exception (or None)

            It should return a `True` or `False` value indicating whether or not to commit
            the transaction.

            If not specified, the default behaviour will be to rollback in the event that
            any exception was thrown in the `with` block.

        get_session: callable
            A function that when invoked returns a new SQLAlchemy database session.
        '''
        self._session = get_session() if get_session else get_db_adapter().session
        self._should_commit = should_commit or Transaction._default_should_commit

    def find_by_id(self, entity_class, entity_id, id_column='id'):
        '''Tries to get an entity by its 'id'.

        Parameters
        ----------
        entity_class: models.base.Model
            The SQLAlchemy Model Class.

        entity_id: any
            The id of the entity, it is generally an integer but any value
            but is type agnostic. It must however match whatever type is
            defined in the actual database table column otherwise this function
            will not find a match.

        id_column (optional):
            The `id` column of the table. By default, it is assumed to be `id`.

        Returns
        -------
        models.base.Model
            An instance of `entity_class` if such an instance exists or `None`
        '''
        return find_by_id(entity_class, entity_id, id_column, self._session)

    def find_all_by_fields(self, entity_class, search_fields: dict):
        '''Tries to find all entities by multiple fields (given in search_fields)

        Parameters
        ----------
        entity_class: models.base.Model
            The SQLAlchemy Model Class.

        search_fields: dict
            A dictionary with keys representing column names and values representing
            a single column value.

            e.g. If you wanted to search by `first_name` and `last_name`, `search_fields`
            would look like:
            {
                'first_name': 'Foo',
                'last_name: 'Bar',
            }

        Returns
        -------
        iter
            An enumeration of instances of `entity_class` if they exist or an empty list.
        '''
        return find_all_by_fields(entity_class, search_fields, self._session)

    def find_all(self, entity_class):
        '''Find all entities

        Parameters
        ----------
        entity_class: models.base.Model
            The SQLAlchemy Model Class.

        Returns
        -------
        iter
            An enumeration of instances of `entity_class` if they exist or an empty list.
        '''
        session = self._session or get_db_adapter().session
        return session.query(entity_class).all()

    def find_distinct_field_values(self, instrumented_attr):
        return find_distinct_field_values(instrumented_attr, self._session)

    def find_one_by_fields(self, entity_class, case_sensitive, search_fields):
        '''Tries to find an entity by multiple fields (given in search_fields)

        Parameters
        ----------
        entity_class: models.base.Model
            The SQLAlchemy Model Class.

        case_sensitive: bool
            Indicates whether or not the comparison is case-sensitive or not.

        search_fields: dict
            A dictionary with keys representing column names and values representing
            a single column value.

            e.g. If you wanted to search by `first_name` and `last_name`, `search_fields`
            would look like:
            {
                'first_name': 'Foo',
                'last_name: 'Bar',
            }

        Returns
        -------
        models.base.Model
            An instance of `entity_class` if such an instance exists or `None`
        '''

        return find_one_by_fields(
            entity_class, case_sensitive, search_fields, self._session
        )

    def add_or_update(self, item, flush=False):
        '''Adds or updates `item` as part of this transaction.
        Parameters
        ----------
        item: models.base.Model
            The entity to be added or updated.

        flush (optional): bool
            The behaviour of flush() is defined here:
            http://docs.sqlalchemy.org/en/latest/orm/session_api.html#sqlalchemy.orm.session.Session.flush

            In general this is done during addition to retrieve the `id` value assigned to
            `new_entity` before the actual Database transaction is committed.

        Returns
        -------
        models.base.Model
            The added or updated entity.
        '''
        item = add_entity(self._session, item, flush=flush, commit=False)
        return item

    def delete(self, item):
        '''Deletes `item` as part of this transaction.
        Parameters
        ----------
        item: models.base.Model
            The entity to be deleted from the database.

        Returns
        -------
        models.base.Model
            The deleted entity.
        '''
        return delete_entity(self._session, item)

    def run_raw(self):
        return self._session

    @classmethod
    def _default_should_commit(
        cls, exception_type, exception_value, exception_traceback
    ):
        if exception_type or exception_value or exception_traceback:
            return False
        return True

    def __enter__(self):
        return self

    def __exit__(self, exception_type, exception_value, exception_traceback):
        commit = self._should_commit(
            exception_type, exception_value, exception_traceback
        )

        commit_successful = False
        try:
            if commit:
                self._session.commit()
                commit_successful = True
        finally:
            if not commit_successful:
                self._session.rollback()
