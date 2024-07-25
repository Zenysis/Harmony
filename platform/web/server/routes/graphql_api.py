from flask import Blueprint
from flask_graphql import GraphQLView

from web.server.graphql.schema import schema
from web.server.routes.views.authentication import authentication_required


class ZenGraphQLView(GraphQLView):
    '''Adds a authentication to graphQL API access via main endpoint.'''

    @authentication_required(is_api_request=True)
    def dispatch_request(self, *args, **kwargs):
        return super().dispatch_request(*args, **kwargs)


class GraphqlPageRouter:
    def generate_blueprint(self):
        api = Blueprint('graphql', __name__)

        api.add_url_rule(
            '/graphql',
            view_func=ZenGraphQLView.as_view(
                'graphql',
                schema=schema,
                graphiql=True,  # for having the GraphiQL interface
            ),
        )
        return api
