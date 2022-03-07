from typing import Optional

import related

from data.query.models.calculation.calculation import Calculation
from data.query.models.calculation.sum_calculation import SumCalculation
from data.query.models.query_filter import AndFilter, FieldFilter, QueryFilter
from db.druid.calculations.calculation_merger import CalculationMerger
from db.druid.post_aggregation_builder import (
    add_suffix_to_expression,
    test_expression_formula_valid,
)


@related.immutable
class Constituent:
    '''The Constituent is a calculable value that is needed by the mathematical formula
    evaluated by FormulaCalculation.

    NOTE(stephen): Once a Constituent is created, it is standalone. If the true
    calculation or field name that it is based off changes, the Constituent calculation
    *will not change*. It is up to the user to make sure the Constituent is in-sync with
    what they expect.
    '''

    calculation = Calculation.child_field()
    id = related.StringField()
    name = related.StringField('')

    def to_druid(
        self, suffix: str, parent_query_filter: Optional[QueryFilter] = None
    ) -> str:
        result_id = f'{self.id}{suffix}'
        calculation = self.calculation

        # If a parent query filter is supplied, we will need to wrap the supplied
        # calculation in that filter. This will ensure the values calculated match
        # both the original calculation's filter requirements AND the parent filter
        # restrictions.
        if parent_query_filter:
            # NOTE(stephen): Serializing the calculation to mutate it since the model
            # itself is immutable.
            calculation_dict = related.to_dict(calculation)
            calculation_dict['filter'] = (
                AndFilter(fields=[parent_query_filter, calculation.filter])
                if calculation.filter
                else parent_query_filter
            )
            calculation = related.to_model(type(calculation), calculation_dict)

        return calculation.to_druid(result_id)


@related.immutable
class FormulaCalculation(Calculation):
    '''The FormulaCalculation represents a calculation over a mathematical formula. This
    formula can use constituent field calculations in the evaluation of the final value.

    NOTE(stephen): Each constituent calculation is supplied directly to the
    FormulaCalculation, and no lookups are needed. This is the first attempt at
    migrating calculated indicators into a directly AQT-queryable state.
    '''

    constituents = related.SequenceField(Constituent, {})
    expression = related.StringField('')
    type = related.StringField('FORMULA')

    def to_druid(self, result_id):
        # If the formula expression is invalid, then the calculation cannot be built.
        # Return a substitute calculation that will always be `null`
        if not test_expression_formula_valid(self.expression):
            calculation = SumCalculation(
                filter=FieldFilter('NON_EXISTANT_FIELD')
            ).to_druid(result_id)
            return calculation

        # Since there are no constraints around the uniqueness of constituent IDs
        # relative to other calculations that might appear in a query, we need to ensure
        # the constituent calculations try to have a unique id. Update append a suffix
        # to each constituent that is computed. The formula expression must also be
        # updated to add a suffix to each field that is referenced.
        constituent_id_suffix = f'__{result_id}'
        full_expression = add_suffix_to_expression(
            self.expression, constituent_id_suffix
        )

        # Build the constituent calculations. If there is a filter applied to this
        # FormulaCalculation, make sure it is applied to every constituent calculation
        # as well. This will ensure that the filter requirements are satisfied.
        constituent_calculations = [
            constituent.to_druid(constituent_id_suffix, self.filter)
            for constituent in self.constituents
        ]

        output = CalculationMerger(constituent_calculations)
        output.add_post_aggregation_from_formula(result_id, full_expression)
        output.set_strict_null_fields([result_id])
        return output


Calculation.register_subtype(FormulaCalculation)
