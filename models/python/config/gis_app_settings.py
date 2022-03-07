import related

# TODO(nina): An instance of MetadataProperty describes important information
# about a given list of columns present in the layer dataset. Each instance
# can be used to color and filter the dataset, as well as act as a list of keys
# to display values for in marker tooltips. Some of these properties
# should be determined on the user-end, and in general, they are initial
# guesses as to what needs to be set from our end to start
@related.mutable(strict=True)
class MetadataProperty:
    # Label of metadata property
    label = related.StringField()

    # Flag to determine if this property is filterable
    is_filterable = related.BooleanField(True, key='isFilterable')

    # Flag to determine whether to show this key value in the tooltip
    show_key = related.BooleanField(True, key='showKey')


# TODO(nina): $GISRefactor - An instance of PropertyHierarchy describes the
# relationship between two different properties. In some datasets, there is a
# complex hierarchy such that some columns contain child values of other
# columns. This helps us account for that when generating filters. Ideally,
# this should be given to us somehow, not something we input and set ourselves
@related.mutable(strict=True)
class PropertyHierarchy:
    # Current property by name
    property = related.StringField()

    # Parent property of this property
    parent = related.StringField()


# TODO(nina): Currently this only describes settings for 'Entity' layers, i.e.
# layers that we display as markers and filter based on certain dimensions.
# In the future we will be adding more types of layers. Additionally, the
# properties listed are initial guesses based on need and subject to change.
@related.mutable(strict=True)
class LayerDataSettings:
    # Name of dataset
    name = related.StringField()

    # ID of dataset
    id = related.StringField()

    # URL for dataset
    url = related.StringField()

    # A list of properties that are also columns in the dataset, that can
    # be filtered/colored on. We also use these properties to determine
    # what can be added to map labels
    # TODO(nina): This should also be something determined by the user,
    # not by us $GISRefactor
    metadata = related.SequenceField(MetadataProperty, [])

    # A list of properties that contain information about their parent
    # property, if any. This is useful for hierarchical datasets.
    property_hierarchy = related.SequenceField(
        PropertyHierarchy, [], key='propertyHierarchy'
    )


@related.mutable(strict=True)
class GISAppSettings:
    '''The GIS settings that determine the display format and layer types for
    a list of datasets for a deployment.
    '''

    layer_data_settings = related.SequenceField(
        LayerDataSettings, [], key='layerDataSettings'
    )

    def add_new_layer(
        self, name, layer_id, url, metadata=None, property_hierarchy=None
    ):

        self.layer_data_settings.append(
            LayerDataSettings(name, layer_id, url, metadata, property_hierarchy)
        )
