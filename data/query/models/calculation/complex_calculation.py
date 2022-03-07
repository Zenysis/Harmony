import related

from data.query.models.calculation.calculation import Calculation
from db.druid.calculations.base_calculation import BaseCalculation
from db.druid.calculations.complex_calculation import (
    ComplexCalculation as DruidComplexCalculation,
)


@related.immutable
class ComplexCalculation(Calculation):
    '''A ComplexCalculation requires more than a single filter to be calculated.

    NOTE(stephen): Placeholder type to use before formula calculations, last
    value calculations, and time bucket calculations are created.
    '''

    # HACK(stephen): Store the true field ID that this complex calculation is
    # calculating since the result ID might not match the field ID we want to
    # calculate. This is different than all other calculations since they are
    # able to encapsulate the calculation to build based on the filter and
    # the calculation type.
    # HACK(stephen): Set a default calculation ID here even though it is
    # actually required. This is a temporary workaround for related being
    # unable to have mandatory fields located after non-mandatory fields (in
    # this case, defined in the parent class).
    calculation_id = related.StringField('')
    type = related.StringField('COMPLEX')

    def get_druid_calculation(self) -> BaseCalculation:
        '''Find the original Druid calculation definition defined in a deployment's config.'''
        fields = [self.calculation_id]
        # When in a Flask app context, we must access config using the Flask `current_app`.
        # pylint: disable=import-outside-toplevel
        try:
            # $ConfigImportHack
            from flask import current_app, has_app_context

            if has_app_context():
                return (
                    current_app.zen_config.aggregation_rules.get_calculation_for_fields(
                        fields
                    )
                )
        except ModuleNotFoundError:
            # We're likely running from the pipeline.
            pass
        # Fallback to importing directly from config if we are not in a flask context.
        from config.aggregation_rules import get_calculation_for_fields

        return get_calculation_for_fields(fields)

    def to_druid(self, result_id):
        calculation = self.get_druid_calculation()

        query_filter = self.filter.to_druid() if self.filter else None
        output = DruidComplexCalculation.create_from_calculation(
            calculation,
            new_id=result_id,
            original_id=self.calculation_id,
            query_filter=query_filter,
        )
        output.set_strict_null_fields([result_id])
        return output


Calculation.register_subtype(ComplexCalculation)
