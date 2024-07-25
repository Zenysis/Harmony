from flask import current_app
import related

from data.query.models.calculation.calculation import Calculation
from db.druid.calculations.unique_calculations import ThetaSketchUniqueCountCalculation


@Calculation.register_subtype
@related.immutable
class CountDistinctCalculation(Calculation):
    # Dimension id
    dimension = related.StringField(required=False)
    type = related.StringField('COUNT_DISTINCT')

    # pylint: disable=arguments-differ
    def to_druid(self, result_id, dimension_size=None):
        calculation_filter = self.filter.to_druid() if self.filter else None
        dimension_id = current_app.zen_config.aggregation.DIMENSION_ID_MAP.get(
            self.dimension, self.dimension
        )
        sketch_size = dimension_size or (
            current_app.druid_context.dimension_metadata.sketch_sizes.get(dimension_id)
        )
        output = ThetaSketchUniqueCountCalculation(
            name=result_id,
            theta_sketch_field=dimension_id,
            size=sketch_size,
            count_filter=calculation_filter,
            is_input_theta_sketch=False,
        )
        output.set_strict_null_fields([result_id])
        return output
