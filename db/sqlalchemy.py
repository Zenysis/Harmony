from flask_sqlalchemy import SQLAlchemy as SQLAlchemyBase

from models.alchemy.base import set_query_property


class SQLAlchemy(SQLAlchemyBase):
    """Flask extension that integrates alchy with Flask-SQLAlchemy."""

    def __init__(
        self, app=None, use_native_unicode=True, session_options=None, Model=None
    ):
        self.Model = Model

        super().__init__(app, use_native_unicode, session_options)

    def make_declarative_base(self, model, metadata=None):
        """Creates or extends the declarative base."""
        try:
            if self.Model is None:
                self.Model = super().make_declarative_base(model, metadata)

            set_query_property(self.Model, self.session)
            return self.Model
        except Exception as e:
            # Handle any exceptions that might occur during base creation
            print(f"Error during declarative base creation: {e}")
            raise
