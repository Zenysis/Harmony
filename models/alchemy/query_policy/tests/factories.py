from factory import RelatedFactory, Sequence, SubFactory
from factory.alchemy import SQLAlchemyModelFactory

from models.alchemy.query_policy import QueryPolicy, QueryPolicyRole
from web.server.tests.session import test_session


class QueryPolicyFactory(SQLAlchemyModelFactory):
    class Meta:
        model = QueryPolicy
        sqlalchemy_session = test_session

    name = Sequence(lambda n: f'query policy {n}')
    roles = RelatedFactory(
        'models.alchemy.query_policy.tests.factories.QueryPolicyRoleFactory'
    )


class QueryPolicyRoleFactory(SQLAlchemyModelFactory):
    class Meta:
        model = QueryPolicyRole
        sqlalchemy_session = test_session

    role = SubFactory('models.alchemy.permission.tests.factories.RoleFactory')
    query_policy = SubFactory(QueryPolicyFactory)
