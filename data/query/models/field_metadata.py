import related

from data.query.models.category import Category
from data.query.models.dataset import Dataset
from data.query.models.dimension import Dimension


@related.immutable
class FieldMetadata:
    '''The FieldMetadata model stores both the category and dataset source of a
    calculable field in the database. It also stores the id to keep in sync
    with the related Field model.
    '''

    id = related.StringField()
    category = related.ChildField(Category, required=False)
    constituents = related.SequenceField('data.query.models.Field', [], required=False)
    description = related.StringField('', required=False)
    dimensions = related.SequenceField(Dimension, [], required=False)
    source = related.ChildField(Dataset, required=False)
