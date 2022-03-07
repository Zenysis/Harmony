'''A module for generating responses to API requests
'''
from http.client import BAD_REQUEST
from werkzeug import exceptions

from flask_potion import fields
from flask_potion.schema import FieldSet


class StandardResponse(dict):
    '''A response type that all Zenysis APIs should use
    '''

    def __init__(self, description, code, success, **additional_fields):
        super(StandardResponse, self).__init__()
        self['message'] = description
        self['code'] = code
        self['success'] = success
        for key, value in list(additional_fields.items()):
            self[key] = value


STANDARD_RESPONSE_FIELDS = {
    'success': fields.Boolean(
        description='Indicates whether the requested operation was successful or not.',
        nullable=True,
    ),
    'message': fields.String(min_length=1, description='The response from the server.'),
    'code': fields.Integer(description='The HTTP response code from the server.'),
}

STANDARD_RESPONSE_SCHEMA = FieldSet(STANDARD_RESPONSE_FIELDS)


def augment_standard_schema(additional_fields):
    '''Augments the schema of the `StandardResponse` class with additional fields that are to be
    included in the response to an API request.

    Example
    ----------
    ```
    # The `StandardResponse` has 3 attributes: `success`, `description` and `code`. I wish to
    # return a field named `foo_bar` as well in the response object.

    from flask_potion import fields

    # I create the following dictionary that defines the username
    new_fields = { 'foo_bar': fields.String(
        title='Foo's bar',
        description='Some random text I want to include.')}

    # I augment the standard response schema
    NEW_SCHEMA = augment_standard_schema(new_fields)

    # In some API, I have the following Route (`baz`) under the `qux` API:
    @Route.POST('/baz', response_schema=NEW_SCHEMA)
    def do_something():
        return StandardResponse(message, OK, True, {'foo_bar': 'lorem ipsum dolor'})

    # If I view the schema for that API (http://localhost:5000/api2/qux/schema),
    # I will see that the `foo_bar` field is included as a response type in the schema for
    # the `POST` method of the `http://localhost:5000/api2/qux/baz` route.
    ```

    Parameters
    ----------
    additional_fields : dict
        The dictionary containing the new/updated fields in the response object.

    Returns
    -------
    `flask_potion.schema.FieldSet`
        The new schema.
    '''
    merged_fields = dict(STANDARD_RESPONSE_FIELDS)
    merged_fields.update(additional_fields)
    return FieldSet(merged_fields)
