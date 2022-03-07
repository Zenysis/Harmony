import hashlib

from web.server.data.data_access import Transaction
from models.alchemy.dashboard import Dashboard, DashboardSession


def get_dashboard_session_hash(session_req):
    '''Given a dashboard filter session, return an associated hash.
    '''
    encoded_request = str(session_req).encode('utf-8')
    session_hash = hashlib.md5(encoded_request).hexdigest()

    # TODO (solo): The value being passed here as dashboard id is
    # a dashboard resource id instead. Rename it to dashboard resource id
    # in all referenced parts
    dashboard_resource_id = session_req['dashboard_id']

    with Transaction() as transaction:
        # Check for a query with the hash that was generated. Add if it does not
        # exist
        maybe_session = transaction.find_all_by_fields(
            DashboardSession, {'uuid': session_hash}
        )
        if maybe_session.first():
            return session_hash

        maybe_dashboard = transaction.find_all_by_fields(
            Dashboard, {'resource_id': dashboard_resource_id}
        ).first()
        if maybe_dashboard:
            transaction.add_or_update(
                DashboardSession(
                    uuid=session_hash,
                    data_blob=session_req['data_blob'],
                    dashboard_id=maybe_dashboard.id,
                ),
                flush=True,
            )
        return session_hash
