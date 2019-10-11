import json
import related
from slugify import slugify

from flask import g
from flask_user import current_user

from log import LOG
from models.alchemy.dashboard import Dashboard, DashboardUserMetadata
from models.alchemy.permission import ResourceTypeEnum
from models.alchemy.user import User
from models.python.dashboard import (
    DashboardSpecification,
    DASHBOARD_SCHEMA_VERSIONS,
    NEXT_SCHEMA_VERSION_MAP,
    convert_query_to_dashboard,
    remove_orphans_from_dashboard,
    VERSION_TO_UPGRADE_FUNCTION,
)
from web.server.data.data_access import find_one_by_fields, find_by_id, Transaction
from web.server.data.dashboard_specification import ValidationFault, ValidationResult
from web.server.errors import BadDashboardSpecification, ItemNotFound
from web.server.potion.managers import AuthorizationResourceManager
from web.server.routes.views.authorization import is_authorized
from web.server.routes.views.users import try_get_user, add_user_role
from web.server.util.util import get_user_string


def _get_specification_version(specification):
    version = specification.get('version')

    if version and version in DASHBOARD_SCHEMA_VERSIONS:
        return version

    error = None

    if version:
        message = (
            'Specification version \'{0}\' is not valid. '
            'List of valid versions is: \'{1}\''
        ).format(version, DASHBOARD_SCHEMA_VERSIONS)
        error = ValidationResult(message, ValidationFault.INVALID_VERSION)
    else:
        message = 'No specification version was specified. '
        error = ValidationResult(message, ValidationFault.MISSING_VERSION)

    raise BadDashboardSpecification([error])


def _add_visualization(dashboard, add_query_request, is_advanced_query=False):
    with Transaction() as transaction:
        specification = add_query_to_custom_dashboard(
            dashboard.specification,
            add_query_request['activeViewType'],
            add_query_request['querySelections'],
            add_query_request['queryResultSpec'],
            is_advanced_query,
        )
        dashboard.specification = specification
        transaction.add_or_update(dashboard, flush=True)
    return find_by_id(Dashboard, dashboard.id)


def upgrade_dashboard_specification(specification):
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG
    version = _get_specification_version(specification)
    next_version = NEXT_SCHEMA_VERSION_MAP.get(version)
    logger.debug(
        'Received Dashboard specification of version \'%s\'. '
        'Attempting to upgrade to \'%s\'.',
        version,
        next_version,
    )

    try:
        # Keep updating the specification until the latest version is reached.
        while next_version:
            updater_function = VERSION_TO_UPGRADE_FUNCTION[version]
            specification = updater_function(specification)
            version = next_version
            next_version = NEXT_SCHEMA_VERSION_MAP.get(version)
    except Exception as e:
        message = (
            'Dashboard specification upgrade from \'{0}\' to \'{1}\' failed. '
            'Details as follows: \'{2}\'.'.format(version, next_version, e)
        )
        error = ValidationResult(message, ValidationFault.UPGRADE_FAILED)
        logger.warning(message)
        logger.warning(e)
        raise BadDashboardSpecification([error])

    return specification


def get_dashboard(slug, session=None):
    return find_one_by_fields(
        Dashboard, case_sensitive=False, search_fields={'slug': slug}, session=session
    )


# Computes the start coordinates for a new chart based on existing dashboard.
# Function assumes the start location is (0, 0).
def get_coordinates_for_new_chart(dashboard_specification):
    dashboard_items = dashboard_specification.items.values()
    if not dashboard_items:
        return (0, 0)
    item_max_y = max(
        dashboard_items,
        key=lambda item: item.layout_metadata.upper_y + item.layout_metadata.rows,
    )
    return (0, item_max_y.layout_metadata.upper_y + item_max_y.layout_metadata.rows)


def add_query_to_custom_dashboard(
    raw_specification,
    view_type,
    query_selections,
    query_result_spec,
    is_advanced_query=False,
):
    # TODO(vedant) - We will need to actually have a merge function in the
    # server-side Dashboard Model. This is in the event that we end up
    # overwriting IDs in the input specification. Since ids are
    # a concatenation of UUID and type, it is EXTREMELY unlikely that we will
    # ever run into this scenario but we will need to eventually take it into
    # account.

    # First, create a brand new dashboard spec using only this query.
    # This will create any top-level dictionaries that we need (e.g. for settings,
    # sizes, items, etc.). From there we just merge these things into the
    # specification to update.
    converted_specification = convert_query_to_dashboard(
        view_type, query_selections, query_result_spec, is_advanced_query
    )

    # the input specification may have been from an older version, so we
    # need to make sure it's upgraded to the latest dashboard spec version
    raw_specification = upgrade_dashboard_specification(raw_specification)
    updated_specification = related.to_model(DashboardSpecification, raw_specification)

    # set the new coordinates for the newest item we just created
    (upper_x, upper_y) = get_coordinates_for_new_chart(updated_specification)
    new_item = list(converted_specification.items.values())[0]
    new_item.layout_metadata.upper_x = upper_x
    new_item.layout_metadata.upper_y = upper_y

    # get all the top-level dictionaries from the specification to update
    date_ranges = updated_specification.date_ranges
    items = updated_specification.items
    queries = updated_specification.queries
    settings = updated_specification.settings
    filters = updated_specification.filters

    # merge in all the top-level dictionaries from the specification we just
    # created using the query the user submitted
    items.update(converted_specification.items)
    queries.update(converted_specification.queries)
    settings.update(converted_specification.settings)
    date_ranges.update(converted_specification.date_ranges)
    filters.update(converted_specification.filters)
    return related.to_dict(updated_specification)


def convert_and_upgrade_specification(dashboard_specification):
    raw_specification = json.loads(json.dumps(dashboard_specification))
    raw_specification = upgrade_dashboard_specification(raw_specification)
    specification = remove_orphans_from_dashboard(raw_specification)
    return specification


def format_and_upgrade_specification(dashboard_specification):
    try:
        final_specification = convert_and_upgrade_specification(dashboard_specification)
        return related.to_dict(final_specification)
    except ValueError as e:
        logger = g.request_logger if hasattr(g, 'request_logger') else LOG
        title = get_dashboard_title(dashboard_specification)
        message = (
            u'Could not load specification for Dashboard \'{title}\'. '
            'Error was: {error}.'
        ).format(title=title, error=e)
        error = ValidationResult(message, ValidationFault.MALFORMED_SPECIFICATION)
        logger.warning(message)
        logger.warning(e)
        raise BadDashboardSpecification([error])


def get_dashboard_title(specification):
    # HACK(vedant) - The whole point of implementing versioning is to ensure
    # that there's only one way to get data out of a specification. We need to
    # actually support upgrading old specifications automagically so we can
    # just pull the data exactly as it is expected.
    options_dictionary = (
        specification.get('options', {})
        if 'options' in specification
        else specification.get('dashboardOptions', {})
    )
    title = options_dictionary.get('title')
    return title


def get_dashboard_slug(dashboard):
    slug = dashboard.slug
    if not dashboard.slug:
        title = get_dashboard_title(dashboard.specification)
        slug = slugify(title, separator='_')
    else:
        slug = dashboard.slug.lower()

    return slug


def make_author_dashboard_administrator(transaction, authorization_item, user=None):
    user = user or current_user
    add_user_role(
        user or current_user,
        'dashboard_admin',
        ResourceTypeEnum.DASHBOARD.name,
        authorization_item.name,
        session=transaction._session,
        commit=False,
    )


def lookup_author(author_id=None, author_username=None):
    entity = None
    fields = {}

    if author_id:
        entity = find_by_id(User, author_id)
        fields['id'] = author_id

    if author_username and not entity:
        entity = try_get_user(author_username)
        fields['username'] = author_username

    if entity and is_authorized('view_resource', ResourceTypeEnum.USER.name, entity.id):
        return entity

    raise ItemNotFound(ResourceTypeEnum.USER.name, fields, author_id)


def api_bulk_transfer_dashboard_ownership(old_author, new_author):
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG
    new_author_string = get_user_string(new_author)
    old_author_string = get_user_string(old_author)
    logger.info(
        'Attempting to transfer ownership of ALL Dashboards owned by %s to %s',
        old_author_string,
        new_author_string,
    )
    with Transaction() as transaction:
        bulk_transfer_dashboard_ownership(transaction, old_author, new_author)
    logger.info('Transfer was successful.')


def api_transfer_dashboard_ownership(dashboard, new_author):
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG
    with Transaction() as transaction:
        new_author_string = get_user_string(new_author)
        old_author_string = get_user_string(dashboard.author)
        dashboard_string = ('slug: %s, resource_id: %s') % (
            dashboard.slug,
            dashboard.resource_id,
        )

        logger.info(
            'Attempting to transfer ownership of Dashboard \'%s\' from %s to %s',
            dashboard_string,
            old_author_string,
            new_author_string,
        )
        bulk_transfer_dashboard_ownership(transaction, dashboard, new_author)
        logger.info('Transfer was successful.')


def bulk_transfer_dashboard_ownership(transaction, old_author, new_author):
    dashboards = transaction.find_all_by_fields(Dashboard, {'author_id': old_author.id})
    for dashboard in dashboards:
        transfer_dashboard_ownership(transaction, dashboard, new_author)


def transfer_dashboard_ownership(transaction, dashboard, new_author):
    dashboard.author_id = new_author.id
    transaction.add_or_update(dashboard, flush=True)
    make_author_dashboard_administrator(transaction, dashboard.resource, new_author)


def get_metadata(transaction, dashboard_id, user_id=None):
    user_id = user_id or current_user.id
    metadata = transaction.find_one_by_fields(
        DashboardUserMetadata,
        case_sensitive=True,
        search_fields={'user_id': user_id, 'dashboard_id': dashboard_id},
    )
    return metadata


def get_or_create_metadata(transaction, dashboard_id, user_id=None):
    user_id = user_id or current_user.id
    metadata = get_metadata(transaction, dashboard_id, user_id)

    if not metadata:
        metadata = DashboardUserMetadata(user_id=user_id, dashboard_id=dashboard_id)
        transaction.add_or_update(metadata, flush=True)

    return metadata


class DashboardManager(AuthorizationResourceManager):
    '''A subclass of `AuthorizationResourceManager` that handles the additional
    Authorization Model creation, update and deletion for dashboards.
    '''

    def create_authorization_model(self, dashboard, authorization_item):
        self.update_authorization_model(dashboard, {}, authorization_item)

    def before_create(self, transaction, dashboard, authorization_item):
        dashboard.author_id = current_user.id
        dashboard.slug = get_dashboard_slug(dashboard)
        make_author_dashboard_administrator(transaction, authorization_item)

    def update_authorization_model(self, dashboard, changes, authorization_item):
        title = get_dashboard_title(dashboard.specification)
        slug = get_dashboard_slug(dashboard)
        authorization_name = slugify(slug, separator='_')
        authorization_item.name = authorization_name
        authorization_item.label = title
        authorization_item.resource_type_id = ResourceTypeEnum.DASHBOARD.value
