# pylint: disable=invalid-name

from builtins import object
from data.pipeline.datatypes.dimension_cleaner import DimensionCleaner
from data.pipeline.datatypes.dimension_collector import DimensionCollector
from data.pipeline.datatypes.full_dimension_data_collector import (
    FullRowDimensionDataCollector,
)
from util.file.unicode_csv import UnicodeDictReader


# Create a customized subclass of the DimensionCollector.
def _subclass_dimension_collector(hierarchical_dimensions, non_hierarchical_dimensions):
    class ChildDimensionCollector(DimensionCollector):
        HIERARCHICAL_DIMENSIONS = hierarchical_dimensions
        NON_HIERARCHICAL_DIMENSIONS = non_hierarchical_dimensions

    return ChildDimensionCollector


# Create a customized subclass of the DimensionCleaner.
def _subclass_dimension_cleaner(dimension_collector_cls):
    class ChildDimensionCleaner(DimensionCleaner):
        def __init__(self, dimension_name_to_row_mapping=None):
            super(ChildDimensionCleaner, self).__init__(
                dimension_collector_cls, dimension_name_to_row_mapping
            )

    return ChildDimensionCleaner


# Create a customized subclass of the FullRowDimensionDataCollector.
def _subclass_full_dimension_data_collector(
    hierarchical_dimensions, non_hierarchical_dimensions, clean_prefix, canonical_prefix
):
    class ChildCanonicalAndMetadataCollector(FullRowDimensionDataCollector):
        def __init__(self):
            super(ChildCanonicalAndMetadataCollector, self).__init__(
                canonical_prefix,
                clean_prefix,
                hierarchical_dimensions,
                non_hierarchical_dimensions,
            )

    return ChildCanonicalAndMetadataCollector


# Override a default value if the argument is non None. Explicitly checking
# for None here instead of not bool(argument).
def _maybe_override(argument, default):
    return argument if argument is not None else default


class DimensionFactory(object):
    '''This factory class is useful for cleanly customizing the dimension
    transformation classes based on a known set of paramaters.
    '''

    def __init__(
        self,
        hierarchical_dimensions,
        non_hierarchical_dimensions,
        raw_prefix,
        clean_prefix,
        canonical_prefix,
        default_dimension_collector_cls=None,
        default_dimension_cleaner_cls=None,
        default_canonical_metadata_collector_cls=None,
    ):
        self.hierarchical_dimensions = hierarchical_dimensions
        self.non_hierarchical_dimensions = non_hierarchical_dimensions
        self.matched_dimensions = hierarchical_dimensions + non_hierarchical_dimensions
        self.raw_prefix = raw_prefix
        self.clean_prefix = clean_prefix
        self.canonical_prefix = canonical_prefix

        # Setup default classes (they will be lazily created if they are None).
        # Only override these if you need a custom class to be used all factory
        # users instead of the default customized class the factory would
        # normally produce.
        self._default_dimension_collector_cls = default_dimension_collector_cls
        self._default_dimension_cleaner_cls = default_dimension_cleaner_cls
        self._default_canonical_metadata_collector_cls = (
            default_canonical_metadata_collector_cls
        )

    @property
    def DimensionCollector(
        self, hierarchical_dimensions=None, non_hierarchical_dimensions=None
    ):
        '''Returns a customized DimensionCollector subclass tailored to the
        stored dimension config. Both hierarchical and non-hierarchical
        dimensions can be customized independently of the stored versions, if
        needed. The default should be preferred.
        '''
        if (
            hierarchical_dimensions is not None
            or non_hierarchical_dimensions is not None
        ):
            h_dims = _maybe_override(
                hierarchical_dimensions, self.hierarchical_dimensions
            )
            nh_dims = _maybe_override(
                non_hierarchical_dimensions, self.non_hierarchical_dimensions
            )
            return _subclass_dimension_collector(h_dims, nh_dims)

        if not self._default_dimension_collector_cls:
            self._default_dimension_collector_cls = _subclass_dimension_collector(
                self.hierarchical_dimensions, self.non_hierarchical_dimensions
            )
        return self._default_dimension_collector_cls

    @property
    def DimensionCleaner(self, dimension_collector_cls=None):
        '''Returns a customized DimensionCleaner subclass tailored to the stored
        dimension config. An optional dimension collector class can be passed in
        for additional customization of the returned class, however the default
        should be preferred.
        '''
        if dimension_collector_cls:
            return _subclass_dimension_cleaner(dimension_collector_cls)

        if not self._default_dimension_cleaner_cls:
            self._default_dimension_cleaner_cls = _subclass_dimension_cleaner(
                self.DimensionCollector
            )
        return self._default_dimension_cleaner_cls

    @property
    def CanonicalAndMetadataCollector(
        self,
        hierarchical_dimensions=None,
        non_hierarchical_dimensions=None,
        clean_prefix=None,
        canonical_prefix=None,
    ):
        '''Returns a customized FullRowDimensionDataCollector subclass tailored
        to the stored dimension and output row config. All parameters can be
        customized, however the default should be preferred.
        '''
        if (
            hierarchical_dimensions is not None
            or non_hierarchical_dimensions is not None
            or clean_prefix is not None
            or canonical_prefix is not None
        ):
            return _subclass_full_dimension_data_collector(
                _maybe_override(hierarchical_dimensions, self.hierarchical_dimensions),
                _maybe_override(
                    non_hierarchical_dimensions, self.non_hierarchical_dimensions
                ),
                _maybe_override(clean_prefix, self.clean_prefix),
                _maybe_override(canonical_prefix, self.canonical_prefix),
            )

        if not self._default_canonical_metadata_collector_cls:
            self._default_canonical_metadata_collector_cls = _subclass_full_dimension_data_collector(
                self.hierarchical_dimensions,
                self.non_hierarchical_dimensions,
                self.clean_prefix,
                self.canonical_prefix,
            )
        return self._default_canonical_metadata_collector_cls

    # TODO(all): Implement non-hierarchical dimension metadata collection
    def create_metadata_collector(
        self,
        metadata_filename=None,
        mapped_locations_filename=None,
        mapped_non_hierarchical_filename=None,
    ):
        '''Instantiate a new FullRowDimensionDataCollector instance based on the
        stored CanonicalAndMetadataCollector class. Initialize the instance by
        reading the metadata and mapped locations specified.
        '''
        # pylint: disable=not-callable
        collector = self.CanonicalAndMetadataCollector()
        if metadata_filename:
            with open(metadata_filename) as metadata_file:
                metadata_reader = UnicodeDictReader(metadata_file)
                for row in metadata_reader:
                    collector.collect_metadata(row)

        if mapped_locations_filename:
            with open(mapped_locations_filename) as mapped_locations_file:
                mapped_locations_reader = UnicodeDictReader(mapped_locations_file)
                for row in mapped_locations_reader:
                    collector.collect_hierarchical_canonical_dimensions(row)

        if mapped_non_hierarchical_filename:
            with open(mapped_non_hierarchical_filename) as mapped_non_hierarchical_file:
                mapped_non_hierarchical_reader = UnicodeDictReader(
                    mapped_non_hierarchical_file
                )
                for row in mapped_non_hierarchical_reader:
                    collector.collect_non_hierarchical_canonical_dimensions(row)

        return collector
