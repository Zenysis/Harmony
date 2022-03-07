# pylint: disable=C0411, C0413
from http.client import NOT_FOUND

from flask import Blueprint, abort

from models.alchemy.query import Field
from web.server.routes.views.authentication import authentication_required
from web.server.data.data_access import Transaction


def build_template_args(field_id=''):
    return {'data_catalog': {'field_id': field_id}}


class DataCatalogPageRouter:
    def __init__(self, template_renderer, default_locale):
        self.template_renderer = template_renderer
        self.default_locale = default_locale

    # TODO(yitian): tighten the security here
    @authentication_required(force_authentication=True)
    def data_catalog(self, locale=None):
        locale = locale or self.default_locale
        template_args = build_template_args()
        return self.template_renderer.render_helper(
            'data_catalog.html', locale, template_args, template_args
        )

    # TODO(yitian): tighten the security here
    @authentication_required(force_authentication=True)
    def data_catalog_field(self, field_id_path, locale=None):
        locale = locale or self.default_locale

        # NOTE(stephen): Experimenting with pretty SEO-style URLs for the field
        # details page. The URL will end with something like `my-field-name--<id>`.
        # This is backwards compatible with a version that has no informational text in
        # the url.
        field_id = field_id_path.rsplit('--', 1)[-1]

        # NOTE(stephen): Disabling field ID validation for now while we work through
        # graphql implementation.
        # with Transaction() as transaction:
        #    field = transaction.find_by_id(Field, field_id)
        #    # If field_id doesn't match to an existing field, abort with not
        #    # found error to render the not found page
        #    if not field:
        #        abort(NOT_FOUND)

        template_args = build_template_args(field_id)
        return self.template_renderer.render_helper(
            'data_catalog.html', locale, template_args, template_args
        )

    def generate_blueprint(self):
        data_catalog = Blueprint('data_catalog', __name__, template_folder='templates')

        data_catalog.add_url_rule('/data-catalog', 'data_catalog', self.data_catalog)
        data_catalog.add_url_rule(
            '/<locale>/data-catalog', 'data_catalog', self.data_catalog
        )
        data_catalog.add_url_rule(
            '/data-catalog/field/<field_id_path>',
            'data_catalog_field',
            self.data_catalog_field,
        )
        data_catalog.add_url_rule(
            '/<locale>/data-catalog/field/<field_id_path>',
            'data_catalog_field',
            self.data_catalog_field,
        )

        return data_catalog
