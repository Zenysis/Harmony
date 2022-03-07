from typing import Any, Optional, TypedDict, List, Dict, Tuple, Union
import json
import traceback
import related
import sqlalchemy
from slugify import slugify

from flask import current_app, g, url_for
from flask_user import current_user

from log import LOG
from models.alchemy.dashboard import Dashboard, DashboardUserMetadata
from models.alchemy.feed import FeedUpdateTypeEnum
from models.alchemy.permission import ResourceTypeEnum
from models.alchemy.user import User
from models.python.dashboard import (
    build_new_item_holder,
    get_position_for_new_tile,
    DASHBOARD_SCHEMA_VERSIONS,
    NEXT_SCHEMA_VERSION_MAP,
    VERSION_TO_UPGRADE_FUNCTION,
    PREVIOUS_SCHEMA_VERSION_MAP,
    VERSION_TO_DOWNGRADE_FUNCTION,
)
from models.python.dashboard.latest.model import (
    DashboardItemHolder,
    GISItemDefinition,
    QueryDefinition,
)
from web.server.data.data_access import find_one_by_fields, find_by_id, Transaction
from web.server.data.dashboard_specification import ValidationFault, ValidationResult
from web.server.errors import (
    BadDashboardSpecification,
    BadDashboardSpecificationList,
    ItemNotFound,
    NotificationError,
)
from web.server.potion.managers import AuthorizationResourceManager
from web.server.routes.views.authorization import is_authorized
from web.server.routes.views.feed import add_share_notification
from web.server.routes.views.users import add_user_acl, get_current_user, try_get_user
from web.server.routes.views.page_renderer import (
    grid_dashboard_to_pdf,
    grid_dashboard_to_image,
)

from web.server.util.util import get_user_string, get_dashboard_title


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


def _add_gis_item(dashboard, add_request):
    gis_query = related.to_model(GISItemDefinition, add_request)
    with Transaction() as transaction:
        specification = add_gis_item_to_custom_dashboard(
            dashboard.specification, gis_query
        )
        dashboard.specification = specification
        transaction.add_or_update(dashboard, flush=True)
    return find_by_id(Dashboard, dashboard.id)


def _add_visualization(dashboard, add_query_request):
    query = related.to_model(QueryDefinition, add_query_request)
    with Transaction() as transaction:
        specification = add_query_to_custom_dashboard(dashboard.specification, query)
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
    upgrade_func_name = ''

    try:
        # Keep updating the specification until the latest version is reached.
        while next_version:
            updater_function = VERSION_TO_UPGRADE_FUNCTION[version]
            upgrade_func_name = updater_function.__name__
            specification = updater_function(specification)
            version = next_version
            next_version = NEXT_SCHEMA_VERSION_MAP.get(version)
    except Exception as e:
        err_str = str(e)
        if isinstance(e, KeyError):
            err_str = f'KeyError: {err_str}'

        message = (
            'Dashboard specification upgrade from \'{0}\' to \'{1}\' failed '
            'when running upgrade function \'{2}\'. '
            'Details as follows: \'{3}\'.'.format(
                version, next_version, upgrade_func_name, err_str
            )
        )
        error = ValidationResult(message, ValidationFault.UPGRADE_FAILED)
        logger.warning(message)
        logger.warning(e)
        logger.warning(traceback.format_exc())
        raise BadDashboardSpecification([error]) from e

    return specification


def get_dashboard(slug, session=None) -> Dashboard:
    return find_one_by_fields(
        Dashboard, case_sensitive=False, search_fields={'slug': slug}, session=session
    )


def add_gis_item_to_custom_dashboard(
    raw_specification: dict, gis_item: GISItemDefinition
) -> dict:
    # First, we ensure that the dashboard specification is upgraded to the
    # latest version
    raw_specification = upgrade_dashboard_specification(raw_specification)

    # Next we build the new gis item
    new_item_holder = build_new_item_holder(raw_specification, gis_item)

    # Finally, we update the spec to include the new item
    raw_specification['items'] = [
        *raw_specification['items'],
        related.to_dict(new_item_holder),
    ]
    return raw_specification


def add_query_to_custom_dashboard(
    raw_specification: dict, query_item: QueryDefinition
) -> dict:
    # First, we ensure that the dashboard specification is upgraded to the
    # latest version
    raw_specification = upgrade_dashboard_specification(raw_specification)

    # Next we build the new query item
    new_item_holder = build_new_item_holder(raw_specification, query_item)

    # Finally, we update the spec to include the new item
    raw_specification['items'] = [
        *raw_specification['items'],
        related.to_dict(new_item_holder),
    ]
    return raw_specification


def add_item_holder_to_dashboard(dashboard: Dashboard, raw_item_holder: dict):
    # First, we ensure that the dashboard specification is upgraded to the
    # latest version
    raw_specification = upgrade_dashboard_specification(dashboard.specification)

    # Next we find the y coordinate that this item should be placed at.
    y_pos = get_position_for_new_tile(raw_specification).y

    # Next we store the y position on the raw item holder.
    raw_item_holder['position']['y'] = y_pos

    # Next we build the full DashboardItemHolder.
    new_item_holder = related.to_model(DashboardItemHolder, raw_item_holder)

    # Finally, we update the spec to include the new item and store it in the DB.
    raw_specification['items'] = [
        *raw_specification['items'],
        related.to_dict(new_item_holder),
    ]

    with Transaction() as transaction:
        dashboard.specification = raw_specification
        transaction.add_or_update(dashboard, flush=True)


def convert_and_upgrade_specification(dashboard_specification):
    raw_specification = json.loads(json.dumps(dashboard_specification))
    raw_specification = upgrade_dashboard_specification(raw_specification)
    return raw_specification


def format_and_upgrade_specification(
    dashboard_specification: Dict[str, Any]
) -> Dict[str, Any]:
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
        raise BadDashboardSpecification([error]) from e


class SpecificationTuple(TypedDict):
    slug: str
    specification: Dict[str, Any]


# pylint: disable=invalid-name
def format_and_upgrade_specification_list(
    spec_list: Union[List[SpecificationTuple], List[Tuple[str, Dict[str, Any]]]]
) -> List[SpecificationTuple]:
    '''This function is used to upgrade a list of dashboard specifications,
    not just a single one. This function will attempt to upgrade ALL the
    received specifications. It will collect all errors together, instead
    of just throwing an error on the first failure.

    Args:
        spec_list (List of SpecificationTuple objects, or List of tuples of
            (slug, specification)): the list of slug, spec tuples to process.
            The tuples can be either a python tuple, or a dict with 'slug' and
            'specification' keys

    Returns:
        List[SpecificationTuple]: list of objects with 'slug' and 'specification'
            keys

    '''
    dashboard_errors: List[Tuple[str, BadDashboardSpecification]] = []
    upgraded_specs: List[SpecificationTuple] = []
    for spec_obj in spec_list:
        if isinstance(spec_obj, tuple):
            slug, specification = spec_obj
        else:
            slug, specification = spec_obj['slug'], spec_obj['specification']

        try:
            upgraded_specs.append(
                {
                    'slug': slug,
                    'specification': format_and_upgrade_specification(specification),
                }
            )
        except BadDashboardSpecification as e:
            dashboard_errors.append((slug, e))

    # raise one single error for all the failed dashboards, if any errors were
    # caught
    if len(dashboard_errors) > 0:
        raise BadDashboardSpecificationList(dashboard_errors)

    return upgraded_specs


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
    add_user_acl(
        user or current_user,
        'dashboard_admin',
        ResourceTypeEnum.DASHBOARD.name,
        authorization_item.name,
        session=transaction.run_raw(),
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
    user_id = user_id or get_current_user().id
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

    def create_dashboard(
        self, slug: str, specification: dict, user_id: Optional[int] = None
    ) -> Dashboard:
        user_id = user_id or get_current_user().id
        created_dashboard = self.create({'slug': slug, 'specification': specification})
        return _attach_metadata_to_dashboard_query(
            # pylint: disable=no-member
            Dashboard.query.filter(Dashboard.id == created_dashboard.id),
            user_id=user_id,
        ).first()


def get_email_attachments(
    auth_user_email,
    slug,
    should_attach_pdf=False,
    should_embed_image=False,
    dashboard_url=None,
):
    attachments = []
    image_name = None
    if should_attach_pdf:
        render_response = grid_dashboard_to_pdf(
            name=slug, dashboard_url=dashboard_url, auth_user_email=auth_user_email
        )
        if render_response.status_code != 200:
            g.request_logger.error(f'Failed to render dashboard: "{slug}" to PDF')
            return False
        attachments.append(('attachment', (f'{slug}.pdf', render_response.content)))

    if should_embed_image:
        image_render_response = grid_dashboard_to_image(
            name=slug, dashboard_url=dashboard_url, auth_user_email=auth_user_email
        )
        if image_render_response.status_code != 200:
            g.request_logger.error(f'Failed to render dashboard: "{slug}" to JPEG')
            return False
        image_name = f'{slug}.jpeg'
        attachments.append(("inline", (f'{slug}.jpeg', image_render_response.content)))
    return attachments, image_name


def send_email(
    auth_user_email, dashboard, recipient_list, body, subject, sender, **kwargs
):
    '''Send an email to user with or without attachments
    Args:
        auth_user_email (str): Authenticating user email
        dashboard (Dashboard): Dashboard to be shared
        recipient_list (List): A list of recipient's emails
        body(str): Email body
        subject(str): Email subject
        sender(str): Email of the sender
    Kwargs:
        should_attach_pdf (bool): Value to attach pdf
        should_embed_image (bool): Value to embed image in email
        is_scheduled_report (bool): Value to schedule a report
    '''
    dashboard_url = kwargs.get('dashboard_url')
    if not dashboard_url:
        dashboard_url = url_for(
            'dashboard.grid_dashboard', name=dashboard.slug, _external=True
        )

    should_attach_pdf = kwargs.get('should_attach_pdf')
    should_embed_image = kwargs.get('should_embed_image')
    is_scheduled_report = kwargs.get('is_scheduled_report')
    use_email_thread = kwargs.get('use_email_thread')
    slug = dashboard.slug
    attachments, image_name = get_email_attachments(
        auth_user_email, slug, should_attach_pdf, should_embed_image, dashboard_url
    )

    email_message = current_app.email_renderer.create_share_dashboard_pdf_message(
        recipient_list,
        attachments,
        body,
        subject,
        dashboard_url,
        sender,
        image_name,
        slug,
        is_scheduled_report=is_scheduled_report,
        use_email_thread=use_email_thread,
    )
    try:
        g.request_logger.info(
            f'Sending pdf dashboard notification emails to: {recipient_list}'
        )
        current_app.notification_service.send_email(email_message)
    except NotificationError:
        g.request_logger.error(
            f'Failed to send pdf dashboard notification emails to: {recipient_list}'
        )


def share_dashboard_via_email(
    dashboard,
    recipient_list,
    body,
    subject,
    sender,
    use_recipient_permissions=True,
    **kwargs,
):
    '''Share dashboard an email with an attached PDF rendering of the given dashboard.
    Args:
        dashboard (Dashboard): Dashboard to be shared
        recipient_list (List): A list of recipient's emails
        body(str): Email body
        subject(str): Email subject
        sender(str): Email of the sender
        use_recipient_permissions: Value to use recipient's permissions
    Kwargs:
        should_attach_pdf (bool): Value to attach pdf
        should_embed_image (bool): Value to embed image in email
        is_scheduled_report (bool): Value to schedule a report
    '''
    current_user_email = current_user.username
    use_email_thread = kwargs.get('use_email_thread')
    for recipient in recipient_list:
        add_share_notification(
            FeedUpdateTypeEnum.DASHBOARD_SHARED.value,
            current_user.id,
            recipient,
            {'dashboard_slug': dashboard.slug},
        )
    if not use_recipient_permissions or use_email_thread:
        # use current user email for dashboard/pdf generation
        # and/or use a single email thread
        send_email(
            current_user_email,
            dashboard,
            recipient_list,
            body,
            subject,
            sender,
            **kwargs,
        )
        return

    # send an email to each individual recipient in the list
    for email in recipient_list:
        # pylint: disable=no-member
        if User.query.filter(User.username == email).first():
            # when user exists, use their email for dashboard/pdf generation
            send_email(email, dashboard, [email], body, subject, sender, **kwargs)
        else:
            # when user is not registered on the platform use the current user email
            # as the token subject claim
            send_email(
                current_user_email, dashboard, [email], body, subject, sender, **kwargs
            )


# HACK(stephen): Attaching dashboard metadata to the base dashboard model
# response is like fitting a square peg into a round hole. To add that
# information in ways that Flask-Potion would naturally work causes us to
# issue a huge number of queries per dashboard (previously 14 queries per
# dashboard with a naive implementation). This query encapsulates all the
# information needed for the dashboard response into a single query.
# TODO(stephen): If we have to write workarounds like this, it probably
# means we shouldn't be jamming too much information into a single API.
def _attach_metadata_to_dashboard_query(
    query, include_dashboard_spec=False, user_id=None, use_legacy_spec=False
):
    user_id = user_id or get_current_user().id

    # NOTE(stephen): I don't think a transaction is necessary for this
    # read only query, but it is an easy way to access the session.
    with Transaction() as transaction:
        session = transaction.run_raw()
        subquery = DashboardUserMetadata.summary_by_dashboard_for_user(
            session, user_id
        ).subquery()

        # Include all dashboard columns. Otherwise, a new query will be issued EACH
        # TIME we access a dashboard value in the query result.
        dashboard_columns = [
            column
            # pylint: disable=no-member
            for column in Dashboard.__table__.columns
            if column.name not in ('specification', 'legacy_specification')
        ]

        # HACK(stephen): If the caller wants to include the legacy dashboard spec, we
        # will produce a query so that the `legacy_specification` is fetched from the DB
        # *but labeled as `specification`* so that downstream users don't have to know
        # anything about it.
        if include_dashboard_spec:
            spec_column = (
                Dashboard.legacy_specification.label('specification')
                if use_legacy_spec
                else Dashboard.specification
            )
            dashboard_columns.append(spec_column)

        required_columns = [
            # Make sure all the metadata columns are included.
            subquery,
            *dashboard_columns,
            # Extract the dashboard title using native Postgres JSONB functions
            # instead of requiring the full spec to be pulled into python,
            # deserialized, and then extracted.
            sqlalchemy.func.jsonb_extract_path_text(
                Dashboard.specification, 'options', 'title'
            ).label('title'),
            # Manually set up author_username since hybrid properties weren't
            # transferring.
            User.username.label('author_username'),
        ]

        # Build the full query. Explicitly include all columns needed so that they
        # are eagerly loaded instead of lazily loaded.
        full_query = (
            query
            # Join in the summarized metadata for each dashboard.
            .outerjoin(subquery, Dashboard.id == subquery.c.dashboard_id)
            # Attach user info so we can extract the author username.
            .outerjoin(User, Dashboard.author_id == User.id).add_columns(
                *required_columns
            )
        )

        # NOTE(stephen): If the dashboard spec is not needed for the result, we want
        # to force SQLAlchemy to *not include* it in the query issued to the DB.
        # This will help reduce memory usage significantly since dashboard specs are
        # often very large. If they aren't needed, then we don't want the server to
        # spend time deserializing and allocating space for it when it will just get
        # thrown away. By using the `from_self` method, we can craft a subquery that
        # only includes the output columns requested.
        if not include_dashboard_spec:
            return full_query.from_self(*required_columns)

        return full_query


def _downgrade_dashboard_specification(specification):
    logger = g.request_logger if hasattr(g, 'request_logger') else LOG
    version = _get_specification_version(specification)
    previous_version = PREVIOUS_SCHEMA_VERSION_MAP.get(version)
    downgrade_func_name = 'N/A'
    logger.debug(
        "Received Dashboard specification of version '%s'. "
        "Attempting to downgrade to '%s'.",
        version,
        previous_version,
    )

    try:
        downgrader_function = VERSION_TO_DOWNGRADE_FUNCTION[version]
        downgrade_func_name = downgrader_function.__name__
        return downgrader_function(specification)
    except Exception as e:
        err_str = str(e)
        if isinstance(e, KeyError):
            err_str = f'KeyError: {err_str}'

        message = (
            f"Dashboard specification downgrade from '{version}' to '{previous_version}' "
            f"failed when running downgrade function '{downgrade_func_name}'. Details "
            f"as follows: '{err_str}'."
        )
        error = ValidationResult(message, ValidationFault.DOWNGRADE_FAILED)
        logger.warning(message)
        logger.warning(e)
        logger.warning(traceback.format_exc())
        raise BadDashboardSpecification([error]) from e


def format_and_downgrade_specification(
    dashboard_specification: Dict[str, Any]
) -> Dict[str, Any]:
    raw_specification = json.loads(json.dumps(dashboard_specification))
    return _downgrade_dashboard_specification(raw_specification)


def format_and_downgrade_dashboard_list(
    dashboards: List[Dashboard],
) -> List[SpecificationTuple]:
    dashboard_errors: List[Tuple[str, BadDashboardSpecification]] = []
    downgraded_specs: List[SpecificationTuple] = []
    for dashboard in dashboards:
        slug = get_dashboard_slug(dashboard)
        try:
            downgraded_specs.append(
                {
                    'slug': slug,
                    'specification': format_and_downgrade_specification(
                        dashboard.specification
                    ),
                }
            )
        except BadDashboardSpecification as e:
            dashboard_errors.append((slug, e))

    # raise one single error for all the failed dashboards, if any errors were
    # caught
    if len(dashboard_errors) > 0:
        raise BadDashboardSpecificationList(dashboard_errors)

    return downgraded_specs
