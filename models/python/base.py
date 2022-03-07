import collections

from abc import ABCMeta, abstractmethod
from functools import wraps

from stringcase import camelcase

from web.server.util.util import assert_mapping

TraversalNode = collections.namedtuple(
    'TraversalNode', ['key', 'value', 'source_object']
)


class PropertyRegistry:
    def __init__(self, key_converter=None):
        self._getter_registry = {}
        self._setter_registry = {}
        self._getter_key_map = {}
        self._setter_key_map = {}
        self._default_setter_validator = {}
        self._nullable_property_map = {}
        self._default_value_map = {}
        self.key_converter = camelcase

    def getter_function(self, key_name):
        _function_name = self._getter_key_map.get(key_name)
        if not _function_name or _function_name not in self._getter_registry:
            raise ValueError(
                (
                    'Could not find any property associated with \'{0}\'. '
                    'Ensure it is decorated with @getter()'
                ).format(key_name)
            )

        return self._getter_registry[_function_name]

    def setter_function(self, key_name):
        _function_name = self._setter_key_map.get(key_name)
        if not _function_name or _function_name not in self._setter_registry:
            raise ValueError(
                (
                    'Could not find any property associated with \'{0}\'. '
                    'Ensure it is decorated with @getter()'
                ).format(key_name)
            )

        return self._setter_registry[_function_name]

    def getters(self):
        for key_name in self._getter_key_map.keys():
            getter_function = self.getter_function(key_name)
            yield (key_name, getter_function)

    def setters(self):
        for key_name in self._setter_key_map.keys():
            setter_function = self.setter_function(key_name)
            yield (key_name, setter_function)

    def getter(
        self,
        serialized_property_name=None,
        value_formatter_function=None,
        value_validate_function=None,
        default_value=None,
        setter_function_name=None,
        nullable=True,
    ):
        '''A decorator for registering properties in a python class for later validation and
        formatting. Expected to wrap the property function for a python class attribute.

        Parameters
        ----------
            serialized_property_name: string
                (optional) The name of the key in the serialized representation of the model.
                If not specified, it will automatically be assumed to be the `camelCase`
                representation of the decorated function's name. For deserialization in the
                `setter` method, the corresponding inverse mapping will be applied.
                TODO(vedant) - Provide a complete example

            value_formatter_function: callable
                (optional) A function that formats the underlying value represented by the property
                into a format that is parsable by the intended recipient.

            value_validate_function: callable
                (optional) A function that validates the underlying value represented by the
                property and raises `ValueError` if the property value is invalid for the given
                key. If no other validation function is specified in the corresponding setter
                method, this function will be used to validate the provided value in the setter
                method.

                NOTE: This function will ONLY be invoked if the underlying value is not `None`.

            default_value: any
                (optional) A default value that will replace the underlying value represented by the
                property. This can also be a callable that takes in zero parameters and upon
                invocation will generate a default value.

            nullable: bool
                (optional) Indicates if this particular property is required. If required, no
                default is specified AND the underlying value is null, a `ValueError` will be
                raised. By default, this is set to `True`.

                This value will also apply during to the property's corresponding setter function
                (if one is defined).

        Raises
        ---------
        ValueError
            - If a property value is invalid
            - If a property value is required but is missing

        Returns
        -------
        callable
            A function that wraps the original and returns the validated and/or formatted value of
            the underlying property
        '''

        def get_property(get_property_value):

            _function_name = get_property_value.__name__
            setter_name = setter_function_name or _function_name
            key_name = serialized_property_name or self.key_converter(_function_name)
            self._getter_key_map[key_name] = _function_name
            self._setter_key_map[key_name] = setter_name
            self._default_setter_validator[setter_name] = value_validate_function
            self._nullable_property_map[setter_name] = nullable
            self._default_value_map[setter_name] = default_value

            @wraps(get_property_value)
            def format_and_validate_property_value(*args, **kwargs):
                value = get_property_value(*args, **kwargs)

                if value is None and default_value is not None:
                    value = (
                        default_value() if callable(default_value) else default_value
                    )

                if value is None and not nullable:
                    raise ValueError(
                        ('Key \'%s\' is marked as required but no value was specified.')
                        % (key_name)
                    )

                if value is not None:
                    if value_validate_function:
                        try:
                            value_validate_function(value)
                        except ValueError as e:
                            raise ValueError(
                                (
                                    u'Value \'%s\' for Key \'%s\' is invalid. '
                                    'Additional details: %s.'
                                )
                                % (value, key_name, e)
                            )
                    value = (
                        value_formatter_function(value)
                        if value_formatter_function
                        else value
                    )
                return value

            self._getter_registry[_function_name] = format_and_validate_property_value

            return format_and_validate_property_value

        return get_property

    def setter(self, value_parser_function=None, value_validate_function=None):
        '''A decorator for registering properties that represent property names/values in a
        python class. Wraps a function that is expected to be the setter function for the
        corresponding
        Provides a convenient way of representing

        Parameters
        ----------
            value_parser_function: callable
                (optional) A function that parses the underlying value before it is passed to the
                property setter function to be set.

                NOTE: This function will ONLY be invoked if the underlying value is not `None`.

            value_validate_function: callable
                (optional) A function that validates the underlying value before it is set as a
                property. It should raise a `ValueError` if the property value is invalid for
                the given key. If a validate function was specified in the corresponding
                getter method for the property, then that validate method will automatically be
                used to validate the input to the decorated function. It can however be
                overriden via this parameter.

                NOTE: This function will ONLY be invoked if the underlying value is not `None`.

        Raises
        ---------
        ValueError
            - If a property value is invalid
            - If a property value is required but is missing

        Returns
        -------
        callable
            A function that wraps the original and returns the validated and/or formatted value of
            the underlying property
        '''

        def set_property(set_property_value):
            _function_name = set_property_value.__name__
            default_validator = self._default_setter_validator.get(_function_name)
            nullable = self._nullable_property_map.get(_function_name)
            validate_function = value_validate_function or default_validator
            default_value = self._default_value_map.get(_function_name)

            @wraps(set_property_value)
            def validate_and_set_property_value(instance, value, *args, **kwargs):
                if value is None and not nullable:

                    if default_value is not None:
                        value = (
                            default_value()
                            if callable(default_value)
                            else default_value
                        )

                    if value is None:
                        raise ValueError(
                            (
                                u'Property \'%s\' is marked as non-nullable but a null'
                                ' value was specified. Either specify a default value'
                                ' in the getter method or provide a non-null value. '
                            )
                            % (_function_name)
                        )

                if value is not None:
                    value = (
                        value_parser_function(value) if value_parser_function else value
                    )

                    if validate_function:
                        try:
                            validate_function(value)
                        except ValueError as e:
                            raise ValueError(
                                (
                                    u'Value \'%s\' for Property \'%s\' is invalid. '
                                    'Additional details: %s.'
                                )
                                % (value, _function_name, e)
                            )

                set_property_value(instance, value, *args, **kwargs)

            self._setter_registry[_function_name] = validate_and_set_property_value

            return validate_and_set_property_value

        return set_property


class PythonModel(dict, metaclass=ABCMeta):
    def __init__(self, values=None, allow_extra_properties=True):
        super(PythonModel, self).__init__()
        if isinstance(values, PythonModel):
            values = values.serialize()
        else:
            values = values or {}

        self.deserialize(values, allow_extra_properties)

    @classmethod
    @abstractmethod
    def registry(cls):
        raise NotImplementedError('\'registry\' must be implemented by subclasses')

    def validate(self):
        errors = []
        _class = self.__class__
        for (_, get_property) in _class.registry().getters():
            try:
                get_property(self)
            except ValueError as e:
                errors.append(e)

        if errors:
            raise ValueError(
                (
                    u'Errors occurred during validation of type: \'{0}\' with value \'{1}\'. '
                    'Errors were: \'{2}\''
                ).format(_class, self, errors)
            )

    def deserialize(self, property_dictionary, allow_extra_properties=True):
        self.before_deserialize()
        assert_mapping(property_dictionary, 'property_dictionary')
        errors = []
        _class = self.__class__

        for (key, value) in property_dictionary.items():
            try:
                set_property = _class.registry().setter_function(key)
            except ValueError as e:
                if not allow_extra_properties:
                    errors.append(e)
                continue

            try:
                set_property(self, value)
            except ValueError as e:
                errors.append(e)

        if errors:
            raise ValueError(
                (u'Errors occurred during deserialization of \'{0}\': \'{1}\'').format(
                    self, errors
                )
            )

        self.after_deserialize()

    def before_deserialize(self):
        pass

    def after_deserialize(self):
        pass

    def serialize(self, include_null_properties=True):
        self.before_serialize()
        output = {}
        _class = self.__class__
        errors = []

        for (key, get_property) in _class.registry().getters():
            try:
                value = get_property(self)
                if (value is not None) or (value is None and include_null_properties):
                    output[key] = value
            except ValueError as e:
                errors.append(e)

        nodes = collections.deque()

        for key, value in output.items():
            nodes.append(TraversalNode(key, value, output))

        while nodes:
            node = nodes.popleft()
            key = node.key
            value = node.value
            source_object = node.source_object

            if isinstance(value, PythonModel):
                value = value.serialize(include_null_properties)
                source_object[key] = value

            for (child_key, child_value) in enumerate_child_nodes(value):
                nodes.append(TraversalNode(child_key, child_value, value))

        if errors:
            raise ValueError(
                (u'Errors occurred during serialization of \'{0}\': \'{1}\'').format(
                    self, errors
                )
            )

        output = self.after_serialize(output)
        return output

    def before_serialize(self):
        pass

    def after_serialize(self, serialized_value):
        return serialized_value


def enumerate_child_nodes(parent_object):
    if isinstance(parent_object, dict):
        for (key, value) in parent_object.items():
            yield (key, value)
    elif isinstance(parent_object, list):
        index = 0
        for element in parent_object:
            yield (index, element)
            index += 1
    else:
        return
