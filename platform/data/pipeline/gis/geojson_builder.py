import json

from collections import defaultdict
from functools import partial

from concurrent import futures  # NOTE: Move this import up for python3
from pyproj import transform as pyproj_transform
from shapely.geometry import mapping as Mapping, shape as Shape, JOIN_STYLE
from shapely.ops import cascaded_union, transform as shapely_transform

from log import LOG

# A small tolerance distance is needed for cleaning shapes and fixing invalid
# polygons. This should be small to avoid distorting the original shape too
# much.
CLEAN_TOLERANCE = 0.0001


def create_geojson_feature_dict(properties, geometry):
    '''Create a valid geojson feature from the input properties and geometry.'''
    return {'type': 'Feature', 'properties': properties, 'geometry': geometry}


def _clean_shape(shape):
    '''Clean the input shape and remove unwanted features.

    Clean up any stray lines, sliver geometries, or invalid polygons by
    buffering the potential points this polygon represents.
    Ref: https://gis.stackexchange.com/a/120314
    '''
    return shape.buffer(CLEAN_TOLERANCE, 1, join_style=JOIN_STYLE.mitre).buffer(
        -CLEAN_TOLERANCE, 1, join_style=JOIN_STYLE.mitre
    )


def _merge_features(features):
    '''Merge multiple Polygons and MultiPolygons into a single shape'''
    polygons = []
    for feature in features:
        shape = feature.shape
        shape_type = shape.type
        if shape_type == 'Polygon':
            polygons.append(shape)
        elif shape_type == 'MultiPolygon':
            # Merge the individual Polygons contained within this
            # MultiPolygon.
            polygons.extend(shape.geoms)
        else:
            assert False, f'Unknown shape type found: {shape_type}'

    # Correct any invalid polygons by cleaning up their points
    clean_polygons = [p if p.is_valid else _clean_shape(p) for p in polygons]

    # Convert the list of polygons into a single Polygon or MultiPolygon
    return cascaded_union(clean_polygons)


class GeojsonFeature:
    '''Wrapper class around geojson feature shapes.'''

    def __init__(self, shape, properties):
        self.shape = shape
        self.properties = properties

    def clean(self):
        '''Clean the stored shape.

        Cleans up any stray lines, sliver geometries, or invalid polygons.
        '''
        self.shape = _clean_shape(self.shape)
        return self

    def simplify(self, tolerance):
        '''Reduce the number of points of in this shape.

        All points in the simplified shape will be within the tolerance distance
        of the original geometry.

        Choosing a tolerance value depends on the features you are processing. A
        good start point is 0.001. Try to find a good tradeoff between point
        reduction and recognizability at many zoom levels.
        '''
        self.shape = self.shape.simplify(tolerance)
        return self

    def transform_coordinates(self, start_proj, end_proj):
        '''Convert the x,y coordinate projection system of a feature.

        Convert the coordinate system of this feature from the start projection
        to the end projection.

        Args:
            start_proj: A pyproj Proj projection object representing the
                existing coordinate system.
            end_proj: A pyproj Proj projection object representing the desired
                coordinate system.
        '''

        # NOTE: Create a bound transformation function with our
        # properties set. Shapely's transform method doesn't forward arguments
        # (it only deals with coordinates) which makes it difficult to pass
        # the coordinate systems.
        transform_shape_coordinates = partial(
            self._convert_coordinates, start_proj, end_proj
        )

        # Apply the transformation.
        self.shape = shapely_transform(transform_shape_coordinates, self.shape)
        return self

    @staticmethod
    def _convert_coordinates(start_proj, end_proj, *args):
        '''Convert the x,y coordinate projection system of a shape.

        Convert the coordinates from the start projection system to the
        destination projection system.
        '''
        return pyproj_transform(start_proj, end_proj, *args)

    def round_coordinates(self, decimal_degrees):
        '''Round this feature's coordinates  to the input number of decimals.'''

        # NOTE: Create a bound transformation function with our
        # properties set since Shapely's transform method doesn't forward
        # arguments.
        round_shape_coordinates = partial(self._round_coordinates, decimal_degrees)
        self.shape = shapely_transform(round_shape_coordinates, self.shape)
        return self

    @staticmethod
    def _round_coordinates(decimal_degrees, *args):
        # NOTE: Using np.round here since the coordinates can be
        # nested to an arbitrary number of levels. Gate the numpy import until
        # this function is actually called since it is not always needed.
        import numpy as np

        return np.round(args, decimal_degrees)

    @classmethod
    def from_dict(cls, feature_dict):
        '''Convert a geojson feature dict into our GeojsonFeature object.'''
        return cls(Shape(feature_dict['geometry']), feature_dict['properties'])

    def to_dict(self):
        '''Return a feature dict for use inside a geojson FeatureCollection.'''
        return create_geojson_feature_dict(self.properties, Mapping(self.shape))

    def to_json(self):
        return json.dumps(self.to_dict())


class GeojsonBuilder:
    '''GeojsonBuilder is useful when working with Geojson feature collections.

    It supports merging features (based on a common feature ID), and the stored
    GeojsonFeature objects can be used directly. When using the merge feature,
    you should extend this class and override the `get_feature_id` method.
    '''

    def __init__(self):
        self._features = defaultdict(list)

    @property
    def feature_count(self):
        '''Return a count of how many feature records are stored.'''
        return sum([len(f) for f in self._features.values()])

    @property
    def feature_mapping(self):
        return self._features

    def features_iterator(self):
        '''Return an iterator over all features stored.'''
        for feature_list in self._features.values():
            for feature in feature_list:
                yield feature

    # pylint: disable=unused-argument
    def get_feature_id(self, feature):
        '''Return the feature ID for this feature.

        A feature ID is not required, but it if you want to merge features that
        share a common ID, you must override this method.
        '''
        return -1

    def add_feature(self, feature):
        '''Add the feature to the current feature collection.

        Internally, store the feature as a tuple (shapely shape, properties).
        '''
        self._features[self.get_feature_id(feature)].append(feature)

    def delete_feature(self, feature_id):
        '''Delete the given feature id from the current feature collection.'''
        del self._features[feature_id]

    # pylint: disable=unused-argument
    def get_merged_properties(self, feature_id, features):
        '''Return the properties to store when a set of features are merged.

        Override this method if custom properties need to be generated for the
        merged result.
        '''
        return features[0]['properties']

    def merge(self):
        '''Merge all features that have the same ID into a single feature.'''

        # Perform shape merging on multiple threads since each merge operation
        # is independent.
        with futures.ThreadPoolExecutor() as thread_pool:
            task_to_feature_id = {}
            count = 0
            for feature_id, features in self._features.items():
                # Merge the multiple individual features into a single shape.
                task = thread_pool.submit(_merge_features, features)
                task_to_feature_id[task] = feature_id

            for task in futures.as_completed(task_to_feature_id):
                count += 1
                feature_id = task_to_feature_id[task]
                features = self._features[feature_id]
                LOG.info(
                    '%s\tMerged %s shapes for feature ID: %s',
                    count,
                    len(features),
                    feature_id,
                )

                properties = self.get_merged_properties(feature_id, features)
                merged_shape = task.result()

                # Store the newly merged shape as the only feature for this
                # feature ID.
                self._features[feature_id] = [GeojsonFeature(merged_shape, properties)]

    def simplify(self, tolerance):
        '''Simplify all the stored features using the specified tolerance.'''
        for feature in self.features_iterator():
            feature.simplify(tolerance)

    def transform_coordinates(self, start_proj, end_proj):
        '''Transform the coordinate system of all the stored features.'''
        for feature in self.features_iterator():
            feature.transform_coordinates(start_proj, end_proj)

    def write_geojson_file(self, output_filename):
        '''Write a geojson output file containing the stored GeojsonFeatures.

        A FeatureCollection will be built around these features.
        '''
        with open(output_filename, 'w') as output_file:
            # Build a geojson FeatureCollection that can hold the new shapes
            # that were created.
            output_file.write('{"type": "FeatureCollection", "features": [\n')
            add_comma = False
            for feature in self.features_iterator():
                if add_comma:
                    output_file.write(',\n')
                output_file.write(feature.to_json())
                add_comma = True

            # Close the FeatureCollection
            output_file.write('\n]}\n')

    def read_geojson_file(self, input_filename):
        '''Read the geojson file and store the features contained within.'''
        with open(input_filename) as input_file:
            geojson_data = json.load(input_file)

            for raw_feature in geojson_data['features']:
                self.add_feature(GeojsonFeature.from_dict(raw_feature))
