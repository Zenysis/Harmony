from factory import LazyAttribute, Sequence, SubFactory
from factory.alchemy import SQLAlchemyModelFactory

from models.alchemy.query import (
    Dimension,
    Field,
    FieldDimensionMapping,
    UnpublishedField,
)
from models.alchemy.query.model import (
    Category,
    DimensionCategory,
    DimensionCategoryMapping,
    FieldCategoryMapping,
    FieldPipelineDatasourceMapping,
    PipelineDatasource,
    UnpublishedFieldCategoryMapping,
    UnpublishedFieldDimensionMapping,
)
from web.server.tests.session import test_session


class FieldFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Field
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'field {n}')
    short_name = LazyAttribute(lambda field: field.name)
    copied_from_field = SubFactory('models.alchemy.query.factories.FieldFactory')


class UnpublishedFieldFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UnpublishedField
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'unpublished field {n}')
    short_name = LazyAttribute(lambda field: field.name)


class DimensionFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Dimension
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'dimension {n}')


class FieldDimensionMappingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = FieldDimensionMapping
        sqlalchemy_session = test_session

    field = SubFactory(FieldFactory)
    dimension = SubFactory(DimensionFactory)


class UnpublishedFieldDimensionMappingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UnpublishedFieldDimensionMapping
        sqlalchemy_session = test_session

    unpublished_field = SubFactory(UnpublishedFieldFactory)
    dimension = SubFactory(DimensionFactory)


class PipelineDatasourceFactory(SQLAlchemyModelFactory):
    class Meta:
        model = PipelineDatasource
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'pipeline datasource {n}')


class FieldPipelineDatasourceMappingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = FieldPipelineDatasourceMapping
        sqlalchemy_session = test_session

    field = SubFactory(FieldFactory)
    pipeline_datasource = SubFactory(PipelineDatasourceFactory)


class UnpublishedFieldPipelineDatasourceMappingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = FieldPipelineDatasourceMapping
        sqlalchemy_session = test_session

    unpublished_field = SubFactory(UnpublishedFieldFactory)
    pipeline_datasource = SubFactory(PipelineDatasourceFactory)


class CategoryFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Category
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'category {n}')
    parent = SubFactory('models.alchemy.query.factories.CategoryFactory')


class FieldCategoryMappingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = FieldCategoryMapping
        sqlalchemy_session = test_session

    field = SubFactory(FieldFactory)
    category = SubFactory(CategoryFactory)


class UnpublishedFieldCategoryMappingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = UnpublishedFieldCategoryMapping
        sqlalchemy_session = test_session

    unpublished_field = SubFactory(UnpublishedFieldFactory)
    category = SubFactory(CategoryFactory)


class DimensionCategoryFactory(SQLAlchemyModelFactory):
    class Meta:
        model = DimensionCategory
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'category {n}')
    parent = SubFactory('models.alchemy.query.factories.DimensionCategoryFactory')


class DimensionCategoryMappingFactory(SQLAlchemyModelFactory):
    class Meta:
        model = DimensionCategoryMapping
        sqlalchemy_session = test_session

    dimension = SubFactory(DimensionFactory)
    category = SubFactory(DimensionCategoryFactory)
