import hashlib

from models.alchemy.user_query_session.model import UserQuerySession
from web.server.data.data_access import Transaction


def store_query_and_generate_link(query_session_req):
    '''Given a query session, store it in DB and generate a unique link.
    There are two ways of looking at this:
        1) Storing just the encoded string, and taking a hash of that string
        2) Generating UUID per query call
    Going with option 1 makes more sense because we inherently do a check to see
    if a link had already been generated with that hash
    '''
    encoded_request = str(query_session_req).encode('utf-8')
    query_hash = hashlib.md5(encoded_request).hexdigest()

    with Transaction() as transaction:
        # Check for a query with the hash that was generated. Add if it does not
        # exist
        maybe_query_session = transaction.find_all_by_fields(
            UserQuerySession, {'query_uuid': query_hash}
        )
        if not maybe_query_session.first():
            transaction.add_or_update(
                UserQuerySession(
                    query_uuid=query_hash,
                    query_blob=query_session_req['query_blob'],
                    user_id=query_session_req['user_id'],
                ),
                flush=True,
            )

    return query_hash
