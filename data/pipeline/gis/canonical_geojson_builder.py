from builtins import range
from data.pipeline.gis.geojson_builder import GeojsonBuilder
from log import LOG


class CanonicalGeojsonBuilder(GeojsonBuilder):
    '''Convert locations in a geojson file to their canonical version.

    This class is useful for taking the original geojson file produced before
    matching, storing the canonical location properties on their appropriate
    shapes, and merging together any features that share the same canonical
    location.

    You can structure your input GeoJSON file in a specific way to avoid having
    to override much of this class.
        - Each Feature's location properties should have passed through the
            location matching process.

    Args:
        mapped_dimension_collector: Instance of FullRowDimensionDataCollector
            that can translate the original Feature location properties into
            the canonical properties that should be stored.
    '''

    def __init__(self, mapped_dimension_collector):
        self._collector = mapped_dimension_collector
        self.unmatched_count = 0
        self.unique_location_count = self._collector.clean_row_count
        super().__init__()

    def get_feature_id(self, feature):
        '''Find the matched canonical location data for this feature.
        Build a unique ID that represents this canonical location.'''
        properties = feature.properties
        canonical_dimensions = self._collector.get_data_for_row(properties)
        if not canonical_dimensions:
            LOG.info(
                'Canonical lookup missing for row. Shape properties: %s', properties
            )
            self.unmatched_count += 1
            return tuple()

        dimension_values = [
            canonical_dimensions.get(dimension) or ''
            for dimension in self._collector.hierarchical_dimensions
        ]

        # The level for this feature ID is the index of the last non-empty
        # value. We need to limit the feature ID to the exact level the feature
        # represents so that merging at a specific level works properly.
        level = 0
        for i, value in enumerate(dimension_values):
            if value:
                level = i

        feature_id = tuple(dimension_values[: (level + 1)])
        return feature_id

    def add_feature(self, feature):
        '''Add the feature to the current feature collection.

        If the feature does not have a canonical match, do not add it.
        '''
        feature_id = self.get_feature_id(feature)
        # Only add the feature to the collection if it has a canonical match.
        # TODO: If a "nation" level shape is desired, this will need
        # to be modified.
        if feature_id:
            self._features[feature_id].append(feature)

    def get_merged_properties(self, feature_id, features):
        '''Return the canonical location properties for this feature.'''
        properties = {}
        for i, dimension in enumerate(feature_id):
            properties[self._collector.hierarchical_dimensions[i]] = dimension
        return properties

    def merge(self):
        '''Merge all features that have the same canonical location.'''

        # Since the location key we are using is a tuple, we should use ints
        # to iterate across the different hierarchies. Loop through each level
        # (i.e. woreda, zone, region) and merge all features that have the same
        # canonical location. After a feature has been merged for a level, add
        # it to the parent level so it can be merged there as well.
        for level in range(len(self._collector.hierarchical_dimensions), 0, -1):
            features_for_level = {
                feature_id: features
                for feature_id, features in self.feature_mapping.items()
                if len(feature_id) == level
            }

            # Replace the currently stored features with just the features for
            # the level we want to merge. This is needed so that we can merge
            # upwards from most granular to least granular with the cleanest
            # shapes possible each time. This is also faster since it means we
            # have fewer shapes to merge at each level as we go.
            current_features = self._features
            self._features = features_for_level

            LOG.info('Building %s shapes at level %s', len(features_for_level), level)
            super().merge()

            for feature_id, feature_list in self.feature_mapping.items():
                # Replace the unmerged features with their merged version and
                # store back on the class again.
                current_features[feature_id] = feature_list

                # Store the merged shape up a level so that it can be used to
                # create the parent level's shape (i.e. merged woreda -> zone)
                # NOTE: Skipping the least granular level since we
                # won't be creating a nation shape.
                if level > 1:
                    parent_location = feature_id[: (level - 1)]
                    current_features[parent_location].extend(feature_list)

            # Store the post-merge features (plus any existing features not
            # from this level) back on our self and continue processing.
            self._features = current_features

    def finalize(
        self,
        simplify_tolerance=None,
        decimal_degrees=None,
        start_proj=None,
        end_proj=None,
    ):
        '''Perform common cleanup and simplification operations.

        Args:
            simplify_tolerance: An optional numeric value indicating the
                distance to use when simplifying the shape's points.
            decimal_degrees: An optional numeric value indicating the decimal
                precision the coordinates should be rounded to.
            start_proj: An optional projection system that represents the
                coordinate system of the stored features.
            end_proj: An optional projection system to convert the coordinate
                system of the stored features to. Both start_proj and end_proj
                must be specified if projection system conversion is desired.
        '''
        if start_proj:
            assert start_proj and end_proj, (
                'Both start and end projection systems must be provided if '
                'projection system conversion is desired.'
            )

        for feature in self.features_iterator():
            feature.clean()
            if start_proj:
                feature.transform_coordinates(start_proj, end_proj)
            if decimal_degrees is not None:
                feature.round_coordinates(decimal_degrees)
            if simplify_tolerance:
                feature.simplify(simplify_tolerance)
