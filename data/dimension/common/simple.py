from past.builtins import basestring
import inspect

from data.dimension.base_dimension import BaseDimension

# Simple dimension types are representable as a simple key to string dimension
# value mapping.
# To create a new simple dimension, subclass SimpleDimension and assign
# class level attributes like you would an enum. Behind the scenes at class
# creation time, the attribute values will be converted from a string into
# an object of that class's type from that string.

# Example:
# The written class definition
#     class Gender(SimpleDimension):
#         MALE = 'Male'
#         FEMALE = 'Female'
#
# is transformed into
#     class Gender(SimpleDimension):
#         MALE = Gender('Male')
#         FEMALE = Gender('Female')
#
# The stored attributes are now subclasses of SimpleDimension (which is a
# subclass of BaseDimension) and support the features of the parent class
# allowing Gender.MALE.get_dimension_value() to work.

# Return all attributes attached to a class object excluding methods and
# private class variables. This is a fairly simple test, so there are most
# likely edge cases that are not handled. It is ok for our purposes
def _is_attribute(key, value):
    return not (
        # Exclude all methods
        inspect.isroutine(value)
        or
        # Exclude any properties of the form '__X__'
        (
            len(key) > 4
            and key[0] == '_'
            and key[1] == '_'
            and key[-1] == '_'
            and key[-2] == '_'
        )
    )


# Use the type of the abstract BaseDimension to avoid metaclass conflicts
_BaseDimensionType = type(BaseDimension)  # pylint: disable=C0103


class SimpleDimension(BaseDimension):
    # Use a metaclass to hook into class creation and replace class level
    # attribute values with full objects
    # Note: This is Python 2 specific
    # Note: Pylint doesn't really understand metaclasses
    # pylint: disable=E0213, E1003, C0103
    class __metaclass__(_BaseDimensionType):
        # When a subclass is created, search for any attributes defined
        # on that subclass and convert them into a full class version by
        # passing the attribute value into the class's constructor
        def __init__(cls, name, bases, namespace):
            super(_BaseDimensionType, cls).__init__(name, bases, namespace)

            # Only rewrite attributes of child classes
            if name != 'SimpleDimension':
                for key, value in namespace.items():
                    if _is_attribute(key, value):
                        setattr(cls, key, cls(value))

    def __init__(self, value):
        assert isinstance(value, basestring), (
            'Simple dimensions can only accept a string value. '
            'Value recevied: %s' % value
        )
        self._value = value

    def get_dimension_value(self):
        return self._value

    def pretty_print(self):
        return self._value


class Gender(SimpleDimension):
    MALE = 'Male'
    FEMALE = 'Female'


class HIVStatus(SimpleDimension):
    POSITIVE = 'Positive'
    NEGATIVE = 'Negative'
