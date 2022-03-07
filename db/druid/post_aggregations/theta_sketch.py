# This file contains all post aggregations that can be performed on results from the
# Datasketches extension (like ThetaSketch, Quantiles sketch).
# NOTE(stephen): Pydruid's implementation of these post aggregators is frustrating,
# incomplete, and bug prone.


def bound_sketch_size(size):
    '''ThetaSketch operations must have a size >= 16 and <= 67108864.'''
    if size is None:
        return None
    return min(max(size, 16), 67108864)


def build_theta_sketch_post_aggregation(post_agg):
    '''Convert the post aggregation into a query compatible dict.'''

    def _recursive_build_post_agg(inner_post_agg):
        # If the post aggregator is already in dict form, return it directly.
        if isinstance(inner_post_agg, dict):
            return inner_post_agg

        output = dict(inner_post_agg.post_aggregator)
        if isinstance(inner_post_agg, ThetaSketchOperation):
            output['fields'] = [
                _recursive_build_post_agg(field) for field in output['fields']
            ]
        elif isinstance(inner_post_agg, TupleSketchFilterExpressionPostAggregation):
            output['field'] = _recursive_build_post_agg(output['field'])
        return output

    return _recursive_build_post_agg(post_agg)


class ThetaSketchOperation:
    '''Perform a set operation across multiple ThetaSketch post aggregators. This set
    operation can be either UNION, INTERSECT, or NOT.
    '''

    def __init__(self, set_operation, fields, name, size=None):
        self.post_aggregator = {
            'fields': [build_theta_sketch_post_aggregation(f) for f in fields],
            'func': set_operation,
            'name': name,
            'size': bound_sketch_size(size),
            'type': 'thetaSketchSetOp',
        }


class ThetaSketchPostAggregation:
    '''Access a ThetaSketch aggregation from within a post aggregation.'''

    def __init__(self, name):
        self.post_aggregator = {'fieldName': name, 'type': 'fieldAccess'}


class ThetaSketchEstimatePostAggregation:
    '''Convert the intermediate ThetaSketch object into a final estimate value that
    will be returned by the query.
    '''

    def __init__(self, field):
        self.post_aggregator = {
            'field': build_theta_sketch_post_aggregation(field),
            'name': 'thetasketchestimate',
            'type': 'thetaSketchEstimate',
        }


class TupleSketchPostAggregation:
    '''Access a TupleSketch aggregation from within a post aggregation.'''

    def __init__(self, name):
        self.post_aggregator = {'fieldName': name, 'type': 'fieldAccess'}


class TupleSketchFilterExpressionPostAggregation:
    '''Filter unique values out of the TupleSketch by applying the filter expression
    across every row in the sketch.
    '''

    def __init__(self, name, field, expression, sketch_size):
        self.post_aggregator = {
            'expression': expression,
            'field': build_theta_sketch_post_aggregation(field),
            'name': name,
            'nominalEntries': sketch_size,
            'type': 'arrayOfDoublesFilterExpression',
        }


class TupleSketchEstimatePostAggregation:
    '''Convert the intermediate TupleSketch object into a final estimate value that
    will be returned by the query.
    '''

    def __init__(self, field):
        self.post_aggregator = {
            'field': build_theta_sketch_post_aggregation(field),
            'name': 'tuplesketchestimate',
            'type': 'arrayOfDoublesSketchToEstimate',
        }
