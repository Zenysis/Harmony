import attr
import related

# pylint: disable=invalid-name


class MultiTypeSequenceConverter:
    def __init__(self, base_classes):
        self._allowed_types = tuple(base_classes)

    def __call__(self, values):
        output = related.TypedSequence(self._allowed_types[0], [])
        output.allowed_types = self._allowed_types
        output.extend(values)
        return output


def MultiTypeSequenceField(base_classes):
    '''This field type allows multiple class types to be stored in the same
    sequence of a related model.

    NOTE: Because Potion is deserializing the raw request into full
    Dimension and Granularity models, this field doesn't actually do any
    deserialization. It most likely wouldn't work if it needed to.
    '''
    attrib = related.SequenceField(base_classes[0])
    attrib.converter = MultiTypeSequenceConverter(base_classes)
    return attrib


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

        # NOTE: for some reason client adds empty filter to a [formula] calculation
        # as an empty object, which in our case should return `None` otherwise it crashes
        # below at referencing `type`
        if value == {}:
            return None

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
            # List comprehensions require explicit super calls due to their scope
            # https://docs.python.org/3/reference/datamodel.html#special-method-lookup
            # https://stackoverflow.com/questions/31895302
            # pylint: disable=super-with-arguments
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

        def update_fields(self, **kwargs):
            """
            Creates a copy of the model with updated fields
            """
            return related.to_model(
                type_map[self.type],
                {
                    **related.to_dict(self),
                    **kwargs,
                },
            )

        @staticmethod
        def register_subtype(subclass):
            type_map[attr.fields(subclass).type.default] = subclass
            return subclass

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

        @staticmethod
        def polymorphic_to_model(value):
            '''Convert a value into the correct child model.'''
            converter = PolymorphicModelBase.child_field().converter
            return converter(value)

    return PolymorphicModelBase
