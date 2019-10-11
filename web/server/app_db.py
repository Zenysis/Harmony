from db.sqlalchemy import SQLAlchemy
from models.alchemy.base import Base

# Create a reference to the user database and perform any customizations that
# must happen before the flask app is started
def create_db():
    return SQLAlchemy(None, Model=Base)
