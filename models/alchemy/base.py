from builtins import object
from math import ceil
from typing import Optional

from sqlalchemy import orm
from sqlalchemy.ext.declarative import declarative_base


class BaseQuery(orm.Query):
    """The default query object used for models. This can be
    subclassed and replaced for individual models by setting
    the Model.query_class attribute. This is a subclass of a
    standard SQLAlchemy sqlalchemy.orm.query.Query class and
    has all the methods of a standard query as well.
    """

    def paginate(self, page, per_page=20, error_out=True):
        """Return `Pagination` instance using already defined query
        parameters.
        """
        if error_out and page < 1:
            raise IndexError

        if per_page is None:
            per_page = self.DEFAULT_PER_PAGE

        items = self.limit(per_page).offset((page - 1) * per_page).all()

        if not items and page != 1 and error_out:
            raise IndexError

        # No need to count if we're on the first page and there are fewer items
        # than we expected.
        if page == 1 and len(items) < per_page:
            total = len(items)
        else:
            total = self.order_by(None).count()

        return Pagination(self, page, per_page, total, items)


class Pagination(object):
    """Class returned by `Query.paginate`. You can also construct
    it from any other SQLAlchemy query object if you are working
    with other libraries. Additionally it is possible to pass
    ``None`` as query object in which case the `prev` and `next`
    will no longer work.
    """

    def __init__(self, query, page, per_page, total, items):
        #: The query object that was used to create this pagination object.
        self.query = query

        #: The current page number (1 indexed).
        self.page = page

        #: The number of items to be displayed on a page.
        self.per_page = per_page

        #: The total number of items matching the query.
        self.total = total

        #: The items for the current page.
        self.items = items

        if self.per_page == 0:
            self.pages = 0
        else:
            #: The total number of pages.
            self.pages = int(ceil(self.total / float(self.per_page)))

        #: Number of the previous page.
        self.prev_num = self.page - 1

        #: True if a previous page exists.
        self.has_prev = self.page > 1

        #: Number of the next page.
        self.next_num = self.page + 1

        #: True if a next page exists.
        self.has_next = self.page < self.pages

    def prev(self, error_out=False):
        """Returns a `Pagination` object for the previous page."""
        assert (
            self.query is not None
        ), 'a query object is required for this method to work'
        return self.query.paginate(self.page - 1, self.per_page, error_out)

    def next(self, error_out=False):
        """Returns a `Pagination` object for the next page."""
        assert (
            self.query is not None
        ), 'a query object is required for this method to work'
        return self.query.paginate(self.page + 1, self.per_page, error_out)


class QueryProperty(object):
    """Query property accessor which gives a model access to query capabilities
    via `ModelBase.query` which is equivalent to ``session.query(Model)``.
    """

    def __init__(self, session):
        self.session = session

    def __get__(self, model, Model):
        mapper = orm.class_mapper(Model)

        if mapper:
            if not getattr(Model, 'query_class', None):
                Model.query_class = BaseQuery

            query_property = Model.query_class(mapper, session=self.session())

            return query_property


class ModelBase(object):
    """Baseclass for custom user models."""

    #: the query class used. The `query` attribute is an instance
    #: of this class. By default a `BaseQuery` is used.
    query_class = BaseQuery

    #: an instance of `query_class`. Can be used to query the
    #: database for instances of this model.
    query: BaseQuery


def set_query_property(model_class, session):
    '''
    Given an instance of a  Model class, does things
    '''

    model_class.query = QueryProperty(session)


Base = declarative_base(cls=ModelBase)
