from typing import Dict, Any
import related

from data.query.models.calculation.calculation import Calculation
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation


@related.immutable
class CountDistinctCalculation(Calculation):
    # Dimension id
    dimension = related.StringField(required=False)
    type = related.StringField('COUNT_DISTINCT')

    # HACK(stephen): Inject runtime information into this calculation so that
    # we can more efficiently run thetaSketch queries.
    # Mapping from user dimension (like RegionName) to an ID specific column
    # that is more accurate for thetaSketches (like RegionID)
    # NOTE(stephen): These injection methods are not required to use the class.
    # If they are not used, the thetaSketch will default to a reasonable sketch
    # size and potentially an approximate count will be returned.
    DIMENSION_ID_MAP: Dict[str, str] = {}

    # Mapping from dimension to the thetaSketch size that should be queried for
    # that dimension.
    # TODO(david): Fix type
    DIMENSION_SIZE_MAP: Dict[str, Any] = {}

    # Store the sketch size that is needed to ensure a count distinct query
    # will produce an exact value instead of an approximate.
    @classmethod
    def inject_theta_sketch_size_hint(cls, dimension_sketch_sizes):
        if not dimension_sketch_sizes:
            return
        cls.DIMENSION_SIZE_MAP.update(dimension_sketch_sizes)

    # Certain dimensions have a corresponding ID column that should be used when
    # counting uniqueness. Inject that mapping into the class so we can produce
    # more accurate results.
    @classmethod
    def inject_theta_sketch_dimension_id_map(cls, dimension_id_map):
        if not dimension_id_map:
            return
        cls.DIMENSION_ID_MAP.update(dimension_id_map)

    # pylint: disable=arguments-differ
    def to_druid(self, result_id, dimension_size=None):
        calculation_filter = self.filter.to_druid() if self.filter else None
        dimension_id = self.DIMENSION_ID_MAP.get(self.dimension, self.dimension)
        sketch_size = dimension_size or self.DIMENSION_SIZE_MAP.get(dimension_id)
        output = ThetaSketchUniqueCountCalculation(
            name=result_id,
            theta_sketch_field=dimension_id,
            size=sketch_size,
            count_filter=calculation_filter,
            is_input_theta_sketch=False,
        )
        output.set_strict_null_fields([result_id])
        return output


Calculation.register_subtype(CountDistinctCalculation)
