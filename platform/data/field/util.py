# mypy: disallow_untyped_defs=True
import ast
from typing import Dict, List, Optional

from data.calculated_indicator.util import get_constituent_fields
from data.query.models.calculation import (
    AverageCalculation,
    AverageOverTimeCalculation,
    CountCalculation,
    CountDistinctCalculation,
    FormulaCalculation,
    LastValueCalculation,
    MaxCalculation,
    MinCalculation,
    WindowCalculation,
    SumCalculation,
)
from data.query.models.calculation.formula_calculation import Constituent
from data.query.models.calculation.last_value_calculation import AggregationOperation
from data.query.models.calculation.synthetic_calculation.window_calculation import (
    DEFAULT_WINDOW_SIZE,
    WindowOperation,
)
from data.query.models.query_filter import FieldFilter, FieldInFilter, QueryFilter


def get_filter(field: Optional[str], fields: Optional[List[str]]) -> QueryFilter:
    assert (field is not None) ^ (
        fields is not None
    ), 'Only one of field or fields can be defined'

    if field is not None:
        return FieldFilter(field_id=field)
    return FieldInFilter(field_ids=fields)


def build_sum_calculation(
    field: Optional[str] = None, fields: Optional[List[str]] = None
) -> SumCalculation:
    return SumCalculation(filter=get_filter(field, fields))


def build_min_calculation(
    field: Optional[str] = None, fields: Optional[List[str]] = None
) -> MinCalculation:
    return MinCalculation(filter=get_filter(field, fields))


def build_max_calculation(
    field: Optional[str] = None, fields: Optional[List[str]] = None
) -> MaxCalculation:
    return MaxCalculation(filter=get_filter(field, fields))


def build_count_calculation(
    field: Optional[str] = None, fields: Optional[List[str]] = None
) -> CountCalculation:
    return CountCalculation(filter=get_filter(field, fields))


def build_average_calculation(
    field: Optional[str] = None, fields: Optional[List[str]] = None
) -> AverageCalculation:
    return AverageCalculation(filter=get_filter(field, fields))


def build_average_over_time_calculation(
    field: Optional[str] = None, fields: Optional[List[str]] = None
) -> AverageOverTimeCalculation:
    return AverageOverTimeCalculation(filter=get_filter(field, fields))


def build_count_distinct_calculation(
    dimension: str,
    field: Optional[str] = None,
    fields: Optional[List[str]] = None,
) -> CountDistinctCalculation:
    return CountDistinctCalculation(
        filter=get_filter(field, fields), dimension=dimension
    )


def build_last_value_calculation(
    field: Optional[str] = None,
    fields: Optional[List[str]] = None,
    operation: AggregationOperation = AggregationOperation.SUM,
) -> LastValueCalculation:
    return LastValueCalculation(filter=get_filter(field, fields), operation=operation)


def formula_is_valid(formula: str) -> bool:
    '''Check if a calculated field formula is valid and can be computed'''
    try:
        ast.parse(formula)
    except SyntaxError:
        return False

    return True


def build_formula_calculation(
    formula: str,
    constituent_to_calculation: Optional[Dict[str, Constituent]] = None,
) -> Optional[FormulaCalculation]:
    '''Formula calculations require more validation. If a calculation cannot be build because
    the field is not valid or a constituent was missing from constituent_to_calculation,
    then None will be returned.'''
    formula = formula.strip()
    if not formula_is_valid(formula):
        return None

    constituent_ids = get_constituent_fields(formula)
    constituents = []
    for constituent_id in constituent_ids:
        if constituent_to_calculation is None:
            # mypy-related-issue
            constituent = Constituent(  # type: ignore[call-arg]
                id=constituent_id,
                calculation=build_sum_calculation(field=constituent_id),
            )
        elif constituent_id in constituent_to_calculation:
            constituent = constituent_to_calculation[constituent_id]
        else:
            return None
        constituents.append(constituent)

    return FormulaCalculation(expression=formula, constituents=constituents)


def build_window_calculation(
    field: Optional[str] = None,
    fields: Optional[List[str]] = None,
    operation: WindowOperation = WindowOperation.SUM,
    size: int = DEFAULT_WINDOW_SIZE,
) -> WindowCalculation:
    return WindowCalculation(
        filter=get_filter(field, fields), operation=operation, size=size
    )
