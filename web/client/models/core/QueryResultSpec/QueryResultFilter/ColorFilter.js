// @flow
import * as Zen from 'lib/Zen';
import ColorAction from 'models/core/QueryResultSpec/ValueAction/ColorAction';
import { range } from 'util/util';
import type { FieldFilterSelections } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type Values = {
  fieldId: string,
  filters: Zen.Array<ColorAction>,
};

/**
 * This represents a filter to be applied on query result data on the frontend.
 */
class ColorFilter extends Zen.BaseModel<ColorFilter, Values> {
  static createFromFilterModalSelections(
    filterModalSelections: FieldFilterSelections,
    fieldId: string,
  ): Zen.Model<ColorFilter> {
    const { numRangeOptionsInputs } = filterModalSelections;

    const filters: Array<ColorAction> = [];
    range(numRangeOptionsInputs).forEach(idx => {
      const filterRule = filterModalSelections[idx];
      if (filterRule !== undefined) {
        const { actionOption } = filterRule;

        // some legacy actions are applied to multiple ranges, so they have to
        // be split up into multiple actions
        // TODO(pablo): all of this can be removed when the filter/color modal
        // is refactored to generate these models directly
        if (
          actionOption === 'preset_ranges' ||
          actionOption === 'custom_ranges'
        ) {
          const {
            numRangeColorInputs,
            rangeLabel,
            fieldRangeColor,
            fieldsMaxRange,
            fieldsMinRange,
          } = filterModalSelections;
          if (
            numRangeColorInputs !== undefined &&
            fieldRangeColor !== undefined &&
            fieldsMaxRange !== undefined &&
            fieldsMinRange !== undefined
          ) {
            range(numRangeColorInputs).forEach(colorIdx => {
              const actionValue =
                actionOption === 'preset_ranges'
                  ? `${1 / numRangeColorInputs},${colorIdx + 1}`
                  : `${fieldsMinRange[colorIdx]},${fieldsMaxRange[colorIdx]}`;

              const filterAction = ColorAction.createFromFilterModalSelections({
                ...filterRule,
                actionValue,
                actionColor: fieldRangeColor[colorIdx],
                actionLabel: rangeLabel ? rangeLabel[colorIdx] : undefined,
              });

              if (filterAction !== undefined) {
                filters.push(filterAction);
              }
            });
          }
        } else {
          const filterAction = ColorAction.createFromFilterModalSelections(
            filterRule,
          );

          if (filterAction !== undefined) {
            filters.push(filterAction);
          }
        }
      }
    });

    return ColorFilter.create({
      fieldId,
      filters: Zen.Array.create(filters),
    });
  }

  /**
   * Apply the filters to this value and determine what final color is assigned
   * to this value. Return undefined if this value does not pass any color rule.
   */
  getValueColor(
    value: ?number,
    allValues: $ReadOnlyArray<?number>,
    defaultColor?: string,
  ): string | void {
    return this._.filters().reduce((currColor, colorAction) => {
      const { rule, color } = colorAction.modelValues();
      return rule.testValue(value, allValues) ? color : currColor;
    }, defaultColor);
  }
}

export default ((ColorFilter: any): Class<Zen.Model<ColorFilter>>);
