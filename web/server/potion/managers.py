from abc import ABCMeta, abstractmethod
import collections

from flask import current_app
from flask_login import current_user
from psycopg2.errorcodes import UNIQUE_VIOLATION
from sqlalchemy.orm import class_mapper
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.attributes import flag_modified

import flask_potion.contrib.alchemy as potion_alchemy
import flask_potion.signals as potion_signals
from flask_potion.exceptions import BackendConflict
from flask_potion.instances import Pagination
from flask_potion.utils import get_value

from web.server.data.data_access import Transaction

from models.alchemy.base import Base, Pagination as SAPagination

POSTGRES_ERROR_ATTRIBUTE = 'pgcode'


class SQLAlchemyManager(potion_alchemy.SQLAlchemyManager):
    '''
    A manager for SQLAlchemy models.

    Expects that ``Meta.model`` contains a SQLALchemy declarative model.

    '''

    PAGINATION_TYPES = (Pagination, SAPagination)

    def __init__(self, resource, model):
        super(SQLAlchemyManager, self).__init__(resource, model)

    def _query_get_paginated_items(self, query, page, per_page):
        if isinstance(query, Base):
            # In the event that the `query` only applies to a single entity
            # return that entity as a BaseQuery instance to keep the return
            # type stable.

            search_fields = {}
            # Find all the primary key columns of the current model class
            primary_key_columns = class_mapper(self.model).primary_key

            # Iterate through the primary key columns and then create a
            # search filter to match the value of the single entity that we have
            for column in primary_key_columns:
                search_fields[column.name] = getattr(query, column.name)

            # Return the corresponding query. No need to paginate since we are
            # only returning a single value
            return self.model.query.filter_by(**search_fields)

        return query.paginate(page=page, per_page=per_page)


class AuthorizationResourceManager(SQLAlchemyManager, metaclass=ABCMeta):
    '''
    An abstract manager implementation for SQLAlchemy models that ties CRUD operations on resources
    to an authorization model that lives alongside the parent model. It is responsible for managing
    the lifecycle of the defined authorization model.

    Expects that ``Meta.model`` contains a SQLALchemy declarative model.
    '''

    PAGINATION_TYPES = (Pagination, SAPagination)

    def __init__(self, resource, model):
        super(AuthorizationResourceManager, self).__init__(resource, model)
        self._init_authorization_layer(resource.meta)
        # TODO(vedant) - Come up with a better way to set this
        # We will eventually move away from some of the contributed Potion
        # and write our own SQLAlchemy Manager and Principals Mixin
        self.debug_mode = current_app.debug if current_app else False

    def _init_authorization_layer(self, meta):
        self.authorization_model = meta.authorization_model
        self.authorization_model_id_attribute = meta.authorization_model_id_attribute
        self.target_model_authorization_attribute = (
            meta.target_model_authorization_attribute
        )

    def create(self, properties, commit=True):
        try:
            with Transaction() as transaction:
                item = self.model()

                for key, value in list(properties.items()):
                    setattr(item, key, value)

                # Create the authorization model associated with this new item and set the
                # appropriate id value of that newly created authorization item on this resource
                authorization_item = self.authorization_model()
                self.create_authorization_model(item, authorization_item)
                authorization_item = transaction.add_or_update(
                    authorization_item, flush=True
                )

                authorization_id = getattr(
                    authorization_item, self.authorization_model_id_attribute
                )
                setattr(
                    item, self.target_model_authorization_attribute, authorization_id
                )
                self.before_create(transaction, item, authorization_item)
                potion_signals.before_create.send(self.resource, item=item)

                transaction.add_or_update(item)
        except IntegrityError as exception:
            self.integrity_error_handler(exception)

        potion_signals.after_create.send(self.resource, item=item)
        return item

    def update(self, item, changes, commit=True):
        try:
            with Transaction(should_commit=lambda *args: commit) as transaction:
                actual_changes = {
                    key: value
                    for key, value in list(changes.items())
                    if self._is_change(get_value(key, item, None), value)
                }

                for key, value in list(changes.items()):
                    # Done for the reasons described here
                    # https://stackoverflow.com/questions/42559434/updates-to-json-field-dont-persist-to-db
                    if isinstance(value, collections.Mapping):
                        flag_modified(item, key)

                authorization_id = getattr(
                    item, self.target_model_authorization_attribute
                )
                authorization_item = transaction.find_by_id(
                    self.authorization_model, authorization_id
                )
                self.update_authorization_model(item, changes, authorization_item)
                authorization_item = transaction.add_or_update(
                    authorization_item, flush=True
                )

                self.before_update(transaction, item, changes, authorization_item)
                potion_signals.before_update.send(
                    self.resource, item=item, changes=actual_changes
                )

                for key, value in list(changes.items()):
                    setattr(item, key, value)
                transaction.add_or_update(item)
        except IntegrityError as exception:
            self.integrity_error_handler(exception)

        potion_signals.after_update.send(
            self.resource, item=item, changes=actual_changes
        )
        return item

    def delete(self, item):
        try:
            with Transaction() as transaction:
                authorization_id = getattr(
                    item, self.target_model_authorization_attribute
                )
                authorization_item = transaction.find_by_id(
                    self.authorization_model, authorization_id
                )
                authorization_item = transaction.delete(authorization_item)

                self.before_delete(transaction, item, authorization_item)
                potion_signals.before_delete.send(self.resource, item=item)
                transaction.delete(item)
        except IntegrityError as exception:
            self.integrity_error_handler(exception)

        potion_signals.after_delete.send(self.resource, item=item)

    def integrity_error_handler(self, exception):
        if hasattr(exception.orig, POSTGRES_ERROR_ATTRIBUTE):
            # duplicate key
            if getattr(exception.orig, POSTGRES_ERROR_ATTRIBUTE) == UNIQUE_VIOLATION:
                raise BackendConflict(message=exception.orig.diag.message_detail)

        if self.debug_mode:
            raise BackendConflict(
                debug_info=dict(
                    exception_message=str(exception),
                    statement=exception.statement,
                    params=exception.params,
                )
            )
        raise BackendConflict()

    @abstractmethod
    def create_authorization_model(self, item, authorization_model):
        '''An abstract method that to be implemented by subclasses. Given an instance of the model
        that this manager backs and an instance of the authorization model, this method should
        populate the appropriate fields in `authorization_item` based on the values provided in
        `item`.

        Parameters
        ----------
        item : web.server.models.Base
            An instance of the resource that is being updated.

        authorization_item : class
            A SQLAlchemy Model class of the authorization model specifically tied to `item`.

        Raises
        -------
        NotImplementedError
            Must be implemented by a subclass
        '''
        raise NotImplementedError()

    @abstractmethod
    def update_authorization_model(self, item, changes, authorization_item):
        '''An abstract method that to be implemented by subclasses. Given an instance of the model
        that this manager backs and an instance of the authorization model, this method should
        update the appropriate fields in `authorization_item` based on the values provided in
        `changes`.

        Parameters
        ----------
        item : web.server.models.Base
            An instance of the resource that is being updated.

        changes : dict
            The changes that are to be applied to `item`.

        authorization_item : class
            The SQLAlchemy representation of the authorization model specifically tied to `item`.

        Raises
        -------
        NotImplementedError
            Must be implemented by a subclass
        '''
        raise NotImplementedError()

    def before_create(self, transaction, item, authorization_item):
        '''An optional method that can be implemented by subclasses. This method is invoked prior
        to the creation of `item`. Any operations of resources related to the creation of `item`
        can be performed here and additional delete/insert/update operations can be performed
        via `transaction`.

        Parameters
        ----------
        transaction : web.server.data.Transaction
            The transaction object to which additional CRUD operations can be performed.

        item : web.server.models.Base
            An instance of the resource that is being updated.

        authorization_item : web.server.models.Base
            The SQLAlchemy representation of the authorization model specifically tied to `item`.
            The creation of `authorization_item` will be automatic and does not need to be
            added to `transaction`.
        '''
        pass

    def before_update(self, transaction, item, changes, authorization_item):
        '''An optional method that can be implemented by subclasses. This method is invoked prior
        to an update of `item`. Any operations on resources related to the updates of `item`
        can be performed here and any additional delete/insert/update operations can be performed
        via `transaction`.

        Parameters
        ----------
        transaction : web.server.data.Transaction
            The transaction object to which additional CRUD operations can be performed.

        item : web.server.models.Base
            An instance of the resource that is being updated.

        changes : dict
            The changes that are to be applied to `item`.

        authorization_item : web.server.models.Base
            The SQLAlchemy representation of the authorization model specifically tied to `item`.
            Updates specified here to `authorization_item` will be automatic and they do not
            need to be added to `transaction`.
        '''
        pass

    def before_delete(self, transaction, item, authorization_item):
        '''An optional method that can be implemented by subclasses. This method is invoked prior
        to the deletion of `item`. Any operations on resources related to the deletion of `item`
        can be performed here and any additional delete/insert/update operations can be performed
        via `transaction`.

        Parameters
        ----------
        transaction : web.server.data.Transaction
            The transaction object to which additional CRUD operations can be performed.

        item : web.server.models.Base
            An instance of the resource that is being updated.

        authorization_item : web.server.models.Base
            The SQLAlchemy representation of the authorization model specifically tied to `item`.
            The delete of `authorization_item` will be automatic and does not need to be
            added to `transaction`.
        '''
        pass


class RoleResourceManager(SQLAlchemyManager):
    def _query(self):
        query = super()._query()
        user = current_user
        if not user.is_superuser():
            role_ids = [role.id for role in user.get_all_roles()]
            return query.filter(getattr(self.model, 'id').in_(role_ids))
        return query


class GroupResourceManager(SQLAlchemyManager):
    def _query(self):
        query = super()._query()
        user = current_user
        if not user.is_superuser():
            group_ids = [group.id for group in user.groups]
            return query.filter(getattr(self.model, 'id').in_(group_ids))
        return query
