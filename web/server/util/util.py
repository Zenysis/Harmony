from builtins import str
from builtins import range
from past.builtins import basestring
import collections
import copy
import re
import time
from datetime import datetime

import stringcase
from flask import request, current_app
from wtforms.validators import ValidationError

from log import LOG
from models.alchemy.user import User
from web.server.data.data_access import Transaction

# Attribute names to ignore when doing dictionary conversions of SQLAlchemy Objects.
IGNORABLE_ATTRIBUTES = {'_sa_instance_state'}

EMAIL_PATTERN = r'(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)'
EMAIL_REGEX = re.compile(EMAIL_PATTERN)

LOCALHOST_WHITELIST = ['http://localhost:5000/']
TRUE_VALUES = {'true', '1', 't', 'y', 'yes', 'yarp'}
UNAUTHORIZED_ERROR = 'UNAUTHORIZED'
INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
ISO_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%S'
SELECTIONS_DATETIME_FORMAT = '%Y-%m-%d'
DATE_TIME_NOW = '@now'
REMEMBER_COOKIE_NAME = 'remember_token'

Node = collections.namedtuple('Node', ['original_dictionary', 'new_dictionary', 'key'])


# Common response type from the backend
class Response(dict):
    def __init__(self, data=None, success=True):
        super(Response, self).__init__()
        self['success'] = success
        self['data'] = data


class Error(Response):
    def __init__(self, error_data):
        super(Error, self).__init__(data=error_data, success=False)


class Success(Response):
    def __init__(self, data=None):
        super(Success, self).__init__(data=data, success=True)


def unauthorized_error(required_permission):
    return Error(
        {
            'code': UNAUTHORIZED_ERROR,
            'message': (
                'You do not have the authorization to perform this operation. '
                'Required permission: \'%s\'' % (required_permission)
            ),
        }
    )


def generic_error(uid='not provided'):
    return Error(
        {
            'code': INTERNAL_SERVER_ERROR,
            'message': f'An internal server error has occurred. [Error uid: {uid}]',
        }
    )


def get_remote_ip_address():
    return request.headers.get('X-Forwarded-For', request.remote_addr)


def get_user_string(user, include_ip=True):
    remote_ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)
    if user.is_authenticated:
        ip_string = (', IP:%s' % remote_ip_address) if include_ip else ''

        return '%s, %s (Id:%s%s)' % (
            user.last_name,
            user.first_name,
            user.username,
            ip_string,
        )

    return 'Anonymous (IP:%s)' % (remote_ip_address)


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


def get_resource_string(resource_name, resource_type):
    if resource_name:
        return 'resource \'%s\' of type: \'%s\'' % (resource_name, resource_type)
    return 'all resources of type \'%s\'' % resource_type


def validate_password(form, field):
    if len(field.data) < 2:
        raise ValidationError('Password must be 2 or more characters')


def validate_email(form, field):
    message_data = field.data

    if not re.match(EMAIL_PATTERN, message_data):
        raise ValidationError('Please enter a valid email address')


def is_zenysis_user(username: str):
    return username.endswith('@zenysis.com')


def get_enum_values(enum_class):
    return set([enum_value.name for enum_value in enum_class])


def get_enum_keys(enum_class):
    return set([enum_value.value for enum_value in enum_class])


def timed(fn):
    def wrap(*args):
        time1 = time.time()
        ret = fn(*args)
        time2 = time.time()
        LOG.info('*** %s function took %0.3f ms', fn.__name__, (time2 - time1) * 1000.0)
        return ret

    return wrap


# Given a dictionary and list of keys, return a new dictionary with only
# the keys from the list
def pick(dictionary, keys):
    return {key: dictionary[key] for key in keys}


def as_dictionary(model, keys=None, name_overrides=None, camelcase_keys=False):
    '''
    Converts a SQL Alchemy user model to a Python dictionary.

    Parameters
    ----------
    model : models.base.Model
        The model that is to be converted to a dictionary representation.

    keys : list (optional)
        The properties in the model that are to be serialized.
        By default this includes all the properties.

    name_overrides : dict (optional)
        A string-to-string mapping that maps the key names in the model
        to alternate names that should appear in the JSON-representation
        of the model.

        (e.g.) If the model contained a key called 'id' and it should be
        renamed to 'incidentId', name overrides would contain the following mapping:
        'id' => 'incidentId'

    camelcase_keys: bool (optional)
        Indicates whether or not the resulting object should have camel-cased string
        keys (i.e. have the output keys changed from 'snake_case' to 'camelCase')

    Returns
    -------
    dict
        The dictionary representation of the model.
    '''

    if not model:
        return {}

    dictionary = model.__dict__
    name_overrides = name_overrides or {}
    keys = keys or list(dictionary.keys())
    keys = [key for key in keys if key not in IGNORABLE_ATTRIBUTES]

    if camelcase_keys:
        return {
            stringcase.camelcase(name_overrides.get(key, key)): dictionary[key]
            for key in keys
        }
    else:
        return {name_overrides.get(key, key): dictionary[key] for key in keys}


def deep_update(source_dictionary, merge_dictionary):
    '''
    Performs a deep merge on `source_dictionary` from the values in `merge_dictionary`.

    1. If values corresponding to the same `key` in `source_dictionary` and `merge_dictionary`
       are both instances of `collections.Mapping`, they will be deep merged.

    2. If cyclic references are detected in `source_dictionary` and `merge_dictionary`, cyclic
       references will NOT be merged

    3. If values corresponding to the same `key` in `source_dictionary` and `merge_dictionary`
       are both instances of `collections.Iterable`, they will also be merged via the `extend`
       method.

    Parameters
    ----------
    source_dictionary : dict
        The source dictionary that is to be merged with another dictionary

    merge_dictionary : dict
        The dictionary containing updated key/value mappings

    Example
    ----------
    ```
    source = { 'foo' : { 'bar': [1], 'baz': 2, 'quz': 3 }, 'do': 1 }
    other = { 'foo': { 'bar': [4], 'qux': 2, 'baz': [10] } }

    merged = deep_update(source, other)
    # Merged would look like:
    # { 'foo': { 'bar': [1, 4], 'baz': [10], 'quz': 3, 'qux': 2 }, 'do': 1 }
    ```

    Returns
    ----------
    The deeply merged dictionary.
    '''
    source_dictionary = copy.deepcopy(source_dictionary)

    nodes = (
        Node(source_dictionary, merge_dictionary, key)
        for key in list(merge_dictionary.keys())
    )
    nodes_to_visit = collections.deque(nodes)
    visited_nodes = set()

    while len(nodes_to_visit):
        current_node = nodes_to_visit.popleft()
        original_dictionary = current_node.original_dictionary
        new_dictionary = current_node.new_dictionary
        key = current_node.key

        if id(new_dictionary) in visited_nodes and id(key) in visited_nodes:
            continue

        if key in original_dictionary:
            original_value = original_dictionary[key]
            new_value = new_dictionary[key]
            original_is_mapping = isinstance(original_value, collections.Mapping)
            new_is_mapping = isinstance(new_value, collections.Mapping)
            original_is_iterable = isinstance(original_value, collections.Iterable)
            new_is_iterable = isinstance(new_value, collections.Iterable)
            original_is_string = isinstance(original_value, basestring)
            new_is_string = isinstance(new_value, basestring)
            mapping_and_iterable_mix = (original_is_mapping and not new_is_mapping) or (
                not original_is_mapping and new_is_mapping
            )

            # Check if the values are mappings first since a mapping
            # is ALSO an iterable
            if original_is_mapping and new_is_mapping:
                for new_key in list(new_value.keys()):
                    nodes_to_visit.append(Node(original_value, new_value, new_key))

            elif (
                original_is_iterable
                and new_is_iterable
                and not mapping_and_iterable_mix
                and not original_is_string
                and not new_is_string
            ):
                original_value.extend(new_value)
                original_dictionary[key] = original_value

            else:
                original_dictionary[key] = new_value
        else:
            original_dictionary[key] = new_dictionary[key]

        visited_nodes.add(id(new_dictionary))
        visited_nodes.add(id(key))

    return source_dictionary


def string_to_boolean(string_value):
    return string_value.lower() in TRUE_VALUES


def assert_boolean(value, argument_name=None):
    _assert_type(value, bool, argument_name=argument_name)


def assert_string(value, argument_name=None, pattern=None):
    _assert_type(value, basestring, argument_name=argument_name)

    pattern_is_string = isinstance(pattern, basestring)
    if pattern and (pattern_is_string or hasattr(pattern, 'pattern')):
        pattern_value = pattern if pattern_is_string else pattern.pattern

        if not re.match(pattern, value):
            value_string = (
                'The value for \'{0}\''.format(argument_name)
                if argument_name
                else 'The value'
            )
            message = (
                '{prefix} does not match pattern ' '\'{pattern_string}\''
            ).format(prefix=value_string, pattern_string=pattern_value)
            raise ValueError(message)


def assert_optional_string(value, argument_name=None, pattern=None):
    '''Asserts that a value is a string or a None type'''
    if value is not None:
        assert_string(value, argument_name, pattern)


def assert_integer(value, argument_name=None, lower_bound=None, upper_bound=None):
    _assert_type(value, int, argument_name=argument_name)
    _assert_numerical(value, argument_name, lower_bound, upper_bound)


def assert_float(value, argument_name=None, lower_bound=None, upper_bound=None):
    _assert_type(value, float, argument_name=argument_name)
    _assert_numerical(value, argument_name, lower_bound, upper_bound)


def assert_number(value, argument_name=None, lower_bound=None, upper_bound=None):
    _assert_type(value, (int, float), argument_name=argument_name)
    _assert_numerical(value, argument_name, lower_bound, upper_bound)


def assert_datetime(value, argument_name=None, lower_bound=None, upper_bound=None):
    _assert_type(value, datetime, argument_name=argument_name)
    _assert_numerical(value, argument_name, lower_bound, upper_bound)


def _assert_numerical(value, argument_name=None, lower_bound=None, upper_bound=None):
    if lower_bound is not None:
        if value < lower_bound:
            value_string = (
                'The value for \'{0}\''.format(argument_name)
                if argument_name
                else 'The value'
            )
            message = (
                '{prefix} must be greater than or equal to '
                '\'{expected_value}\'. It was \'{value}\''
            ).format(prefix=value_string, expected_value=lower_bound, value=value)
            raise ValueError(message)

    if upper_bound is not None:
        if value > upper_bound:
            value_string = (
                'The value for \'{0}\''.format(argument_name)
                if argument_name
                else 'The value'
            )
            message = (
                '{prefix} must be less than or equal to '
                '\'{expected_value}\'. It was \'{value}\''
            ).format(prefix=value_string, expected_value=upper_bound, value=value)
            raise ValueError(message)


def assert_enum(value, enum_type, enum_name=None, argument_name=None):
    _assert_type(value, enum_type, enum_name, argument_name=argument_name)


def assert_iterable(value, argument_name=None):
    _assert_type(
        value, collections.Iterable, 'iterable', basestring, 'string', argument_name
    )


def assert_non_string_iterable(value, argument_name=None, element_validator=None):
    _assert_type(
        value, collections.Iterable, 'iterable', basestring, 'string', argument_name
    )

    if element_validator:
        errors = []
        try:
            for i in range(0, len(value)):
                element = value[i]
                element_validator(element, i, argument_name)
        # pylint:disable = W0703
        except ValueError as e:
            errors.append(e)

        if errors:
            value_string = (
                'the value for \'{0}\''.format(argument_name)
                if argument_name
                else 'the value'
            )
            message = (
                'Errors occurred while validating {value_string}. '
                'They are as follows: {errors}'
            ).format(value_string=value_string, errors=errors)
            raise ValueError(message)


def assert_mapping(value, argument_name=None, key_value_validator=None):
    _assert_type(value, collections.Mapping, 'mapping', argument_name=argument_name)

    if key_value_validator:
        errors = []
        try:
            for key in value:
                _value = value.get(key)
                key_value_validator(key, _value, argument_name)
        # pylint:disable = W0703
        except ValueError as e:
            errors.append(e)

        if errors:
            value_string = (
                'the value for \'{0}\''.format(argument_name)
                if argument_name
                else 'the value'
            )
            message = (
                'Errors occurred while validating {value_string}. '
                'They are as follows: {errors}'
            ).format(value_string=value_string, errors=errors)
            raise ValueError(message)


def assert_in(value, all_values, argument_name=None):
    if value not in all_values:
        argument_string = (
            'for argument \'{0}\''.format(argument_name) if argument_name else ''
        )

        raise ValueError(
            'Value \'{value}\' {argument_string} is not in \'{all_values}\''.format(
                value=value, argument_string=argument_string, all_values=all_values
            )
        )


def assert_one_of(value, valid_types, argument_name=None):
    for _type in valid_types:
        try:
            assert_type(value, _type, argument_name=argument_name)
            return
        except ValueError:
            continue

    value_string = (
        'The value for \'{0}\''.format(argument_name) if argument_name else 'The value'
    )

    if not isinstance(value, _type):
        message = (
            '{prefix} must be one of the following types: \'{desired_types}\'. '
            'Instead, received type: \'{actual_type}\' with value \'{value}\'.'
        ).format(
            prefix=value_string,
            desired_types=valid_types,
            actual_type=type(value),
            value=value,
        )
        raise ValueError(message)


EQUALS_ARGUMENT_FORMAT = 'for \'{name}\' (value: \'{value}\')'


def assert_equals(
    this_value, that_value, this_argument_name=None, that_argument_name=None
):

    if this_value != that_value:
        this_argument = (
            EQUALS_ARGUMENT_FORMAT.format(name=this_argument_name, value=this_value)
            if this_argument_name
            else str(this_value)
        )
        that_argument = (
            EQUALS_ARGUMENT_FORMAT.format(name=that_argument_name, value=that_value)
            if that_argument_name
            else str(that_value)
        )
        message = (
            'Expected value {this_argument} to match value ' '{that_argument}.'
        ).format(this_argument=this_argument, that_argument=that_argument)
        raise ValueError(message)


def assert_type(value, desired_type, type_name=None, argument_name=None):
    _assert_type(
        value, _type=desired_type, type_name=type_name, argument_name=argument_name
    )


def assert_callable(value, argument_name=None):
    value_string = (
        'The value for \'{0}\''.format(argument_name) if argument_name else 'The value'
    )

    if not callable(value):
        message = (
            '{prefix} must be of callable. '
            'Instead, received type: \'{actual_type}\' with value \'{value}\'.'
        ).format(prefix=value_string, actual_type=type(value), value=value)
        raise ValueError(message)


def _assert_type(
    value,
    _type,
    type_name=None,
    exclude_type=None,
    exclude_type_name=None,
    argument_name=None,
):

    value_string = (
        'The value for \'{0}\''.format(argument_name) if argument_name else 'The value'
    )

    if not isinstance(value, _type):
        message = (
            '{prefix} must be of type: \'{desired_type}\'. '
            'Instead, received type: \'{actual_type}\' with value \'{value}\'.'
        ).format(
            prefix=value_string,
            desired_type=type_name or _type,
            actual_type=type(value),
            value=value,
        )
        raise ValueError(message)

    if exclude_type and isinstance(value, exclude_type):
        message = (
            '{prefix} must be of type: \'{desired_type}\' but NOT of type: \'{excluded_type}\'. '
            'Instead, received type: \'{actual_type}\' with value \'{value}\'.'
        ).format(
            prefix=value_string,
            desired_type=type_name or _type,
            excluded_type=exclude_type_name or exclude_type,
            actual_type=type(value),
            value=value,
        )
        raise ValueError(message)


def element_type_validator(
    value, index, argument_name=None, desired_type=None, type_name=None
):
    argument_name = (
        '{0}[{1}]'.format(argument_name, index)
        if argument_name
        else 'Element \'{0}\''.format(index)
    )
    assert_type(value, desired_type, type_name, argument_name)


def string_type_validator(value, index, argument_name):
    element_type_validator(value, index, argument_name, basestring, 'string')


def key_value_element_validator(
    key,
    value,
    argument_name=None,
    desired_key_type=None,
    desired_key_type_name=None,
    desired_value_type=None,
    desired_value_type_name=None,
):
    argument_name = (
        '{0}[{1}]'.format(argument_name, key)
        if argument_name
        else 'Key \'{0}\''.format(key)
    )

    assert_type(key, desired_key_type, desired_key_type_name, argument_name)
    assert_type(value, desired_value_type, desired_value_type_name, argument_name)


def convert_datetime(timestamp, timestamp_format=ISO_DATETIME_FORMAT):
    if timestamp == DATE_TIME_NOW:
        return datetime.utcnow()

    if isinstance(timestamp, datetime):
        return timestamp

    assert_string(timestamp, 'timestamp')
    return datetime.strptime(timestamp, timestamp_format)


def stringify_datetime(timestamp, timestamp_format=ISO_DATETIME_FORMAT):
    if timestamp == DATE_TIME_NOW:
        return datetime.utcnow()

    assert_datetime(timestamp, 'timestamp')
    return datetime.strftime(timestamp, timestamp_format)


def try_parse_enum(value, enum_type, argument_name=None, value_converter_function=None):
    if isinstance(value, enum_type):
        return value

    assert_string(value, argument_name)
    value = value.strip()

    try:
        if value_converter_function:
            assert_callable(value_converter_function, 'value_converter_function')
            value = value_converter_function(value)

        return enum_type[value]
    except KeyError:
        raise ValueError(
            'Unexpected value for \'{0}\': \'{1}\''.format(enum_type, value)
        )


def assert_users_exist(value):
    undefined_users = []
    for user_id in value:
        with Transaction() as transaction:
            user = transaction.find_by_id(User, user_id)
            if not user:
                undefined_users.append(user_id)

    if undefined_users:
        raise ValueError('Users with ids %s do not exist' % undefined_users)


def construct_recursive_dictionary():
    return collections.defaultdict(construct_recursive_dictionary)


def is_session_persisted():
    cookie_name = current_app.config.get('REMEMBER_COOKIE_NAME', REMEMBER_COOKIE_NAME)
    return cookie_name in request.cookies
