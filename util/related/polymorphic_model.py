import attr
import related

# pylint: disable=invalid-name


class PolymorphicChildConverter:
    '''Convert a serialized child class into the full child class representation
    based on a 'type' parameter. This is useful when multiple classes derive
    from a single base class and can be uniquely identified by a 'type'
    parameter.
    '''

    def __init__(self, base_cls, cls_map):
        self._base_cls = base_cls
        self._cls_map = cls_map

    def __call__(self, value):
        '''Coerce a value into a model based on the child-class type.'''
        # If the value is already in full model form, return it directly.
        if isinstance(value, self._base_cls) or value is None:
            return value

        # Convert a serialized version of the child class into a full model.
        # Mimic the behavior of `related.converters.to_child_field`.
        try:
            cls = self._cls_map[value['type']]
            return related.to_model(cls, value)
        except ValueError as e:
            error_msg = related.converters.CHILD_ERROR_MSG.format(
                value, self._base_cls, str(e)
            )
            raise ValueError(error_msg)


class PolymorphicSequenceConverter(PolymorphicChildConverter):
    '''Convert a list of serialized child classes into their full representation
    based on a 'type' parameter of each item in the list.
    '''

    def __call__(self, values):
        values = values or []
        args = [
            super(PolymorphicSequenceConverter, self).__call__(value)
            for value in values
        ]
        return related.types.TypedSequence(cls=self._base_cls, args=args)


def build_polymorphic_base():
    type_map = {}

    @related.mutable
    class PolymorphicModelBase:
        '''A related model designed for inheritance where subclasses override the
        `type` property.

        During deserialization, the PolymorphicModelBase can determine which concrete
        child type to use as the target of deserialization.

        After subclassing, the new class should call `register_subtype` once to add it
        to the list of possible child classes.

        See AQT's Calculation and QueryFilter models for examples.
        '''

        type = related.StringField()

        @staticmethod
        def register_subtype(subclass):
            type_map[attr.fields(subclass).type.default] = subclass

        @staticmethod
        def child_field(required=True, key=None):
            '''Create a new polymorphic child field of this model.'''
            attrib = related.ChildField(
                PolymorphicModelBase, required=required, key=key
            )

            # Replace the normal ChildField converter with our polymorphic version that
            # can deduce what class a serialized value should be converted to.
            attrib.converter = PolymorphicChildConverter(PolymorphicModelBase, type_map)
            return attrib

        @staticmethod
        def sequence_field(required=True, key=None):
            '''Create a new polymorphic child sequence of this model.'''
            attrib = related.SequenceField(
                PolymorphicModelBase, required=required, key=key
            )

            # Replace the normal SequenceField converter with our polymorphic version
            # that can deduce which class to deserialize each value into.
            attrib.converter = PolymorphicSequenceConverter(
                PolymorphicModelBase, type_map
            )
            return attrib

    return PolymorphicModelBase
