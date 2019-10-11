// @flow
import * as React from 'react';

import ColorRangeRow from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/RuleContainer/ColorRangeRow';
import autobind from 'decorators/autobind';
import { PRESET_COLOR_ORDER } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/constants';
import { range } from 'util/util';
import type { FieldFilterSelections } from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type Props = {
  fieldFilterSelections: FieldFilterSelections,
  onFieldFilterSelectionsChange: (
    newFieldSelections: FieldFilterSelections,
  ) => void,
  rangeType: 'preset_ranges' | 'custom_ranges',
};

export default class ColorRangeContainer extends React.PureComponent<Props> {
  // TODO(pablo): a lot of duplicate code between onRangeLabelChange,
  // onMinRangeChange, and onMaxRangeChange. Refactor into a more reusable
  // function.
  @autobind
  onRangeLabelChange(value: string, rowIdx: number) {
    const { fieldFilterSelections, onFieldFilterSelectionsChange } = this.props;
    const { rangeLabel } = fieldFilterSelections;
    const newRangeLabels = [...(rangeLabel || [])];
    newRangeLabels[rowIdx] = value;
    const newFieldSelections = {
      ...fieldFilterSelections,
      rangeLabel: newRangeLabels,
    };
    onFieldFilterSelectionsChange(newFieldSelections);
  }

  @autobind
  onMinRangeChange(value: string, rowIdx: number) {
    const { fieldFilterSelections, onFieldFilterSelectionsChange } = this.props;
    const { fieldsMinRange } = fieldFilterSelections;
    const newMinRangeArr = [...(fieldsMinRange || [])];
    newMinRangeArr[rowIdx] = value;
    const newFieldSelections = {
      ...fieldFilterSelections,
      fieldsMinRange: newMinRangeArr,
    };
    onFieldFilterSelectionsChange(newFieldSelections);
  }

  @autobind
  onMaxRangeChange(value: string, rowIdx: number) {
    const { fieldFilterSelections, onFieldFilterSelectionsChange } = this.props;
    const { fieldsMaxRange } = fieldFilterSelections;
    const newMaxRangeArr = [...(fieldsMaxRange || [])];
    newMaxRangeArr[rowIdx] = value;
    const newFieldSelections = {
      ...fieldFilterSelections,
      fieldsMaxRange: newMaxRangeArr,
    };
    onFieldFilterSelectionsChange(newFieldSelections);
  }

  @autobind
  onRangeColorChange(hexColor: string, rowIdx: number) {
    const { fieldFilterSelections, onFieldFilterSelectionsChange } = this.props;
    const { fieldRangeColor } = fieldFilterSelections;
    const newRangeColorArr = [...(fieldRangeColor || [])];
    newRangeColorArr[rowIdx] = hexColor;
    const newFieldSelections = {
      ...fieldFilterSelections,
      fieldRangeColor: newRangeColorArr,
    };
    onFieldFilterSelectionsChange(newFieldSelections);
  }

  @autobind
  onRemoveColorRow() {
    const { fieldFilterSelections, onFieldFilterSelectionsChange } = this.props;
    const { numRangeColorInputs } = fieldFilterSelections;

    // Only allow user to remove if there is more than one color range
    if (numRangeColorInputs !== undefined && numRangeColorInputs > 1) {
      const newFieldSelections = {
        ...fieldFilterSelections,
        numRangeColorInputs: numRangeColorInputs - 1,
      };
      onFieldFilterSelectionsChange(newFieldSelections);
    }
  }

  @autobind
  onAddColorRow() {
    const { fieldFilterSelections, onFieldFilterSelectionsChange } = this.props;
    const {
      numRangeColorInputs,
      fieldRangeColor,
      fieldsMaxRange,
      fieldsMinRange,
      rangeLabel,
    } = fieldFilterSelections;

    if (
      numRangeColorInputs !== undefined &&
      fieldRangeColor !== undefined &&
      fieldsMaxRange !== undefined &&
      fieldsMinRange !== undefined &&
      rangeLabel
    ) {
      const newColorCount = numRangeColorInputs + 1;

      // get the new default color
      const newColor = PRESET_COLOR_ORDER[newColorCount - 1];

      // update the color count and the colorRange arrays to account for
      // the new row
      const newFieldSelections = {
        ...fieldFilterSelections,
        numRangeColorInputs: newColorCount,
        fieldRangeColor: fieldRangeColor.concat(newColor),
        fieldsMaxRange: fieldsMaxRange.concat(''),
        fieldsMinRange: fieldsMinRange.concat(''),
        rangeLabel: rangeLabel.concat(''),
      };
      onFieldFilterSelectionsChange(newFieldSelections);
    }
  }

  render() {
    const { rangeType, fieldFilterSelections } = this.props;
    const {
      numRangeColorInputs,
      rangeLabel,
      fieldsMinRange,
      fieldsMaxRange,
      fieldRangeColor,
    } = fieldFilterSelections;

    if (
      numRangeColorInputs !== undefined &&
      fieldsMinRange &&
      fieldsMaxRange &&
      fieldRangeColor &&
      rangeLabel
    ) {
      const isMaxInputs = numRangeColorInputs >= PRESET_COLOR_ORDER.length;
      const rangeColorRows = range(numRangeColorInputs).map(idx => (
        <ColorRangeRow
          key={idx}
          rangeType={rangeType}
          totalNumRows={numRangeColorInputs}
          rowIdx={idx}
          maxRange={fieldsMaxRange[idx]}
          minRange={fieldsMinRange[idx]}
          rangeLabel={rangeLabel[idx]}
          rangeColor={fieldRangeColor[idx]}
          onRangeLabelChange={this.onRangeLabelChange}
          onMinRangeChange={this.onMinRangeChange}
          onMaxRangeChange={this.onMaxRangeChange}
          onRangeColorChange={this.onRangeColorChange}
          onRemoveColorRow={this.onRemoveColorRow}
          onAddColorRow={this.onAddColorRow}
          isMaxInputs={isMaxInputs}
        />
      ));

      return <div className="row">{rangeColorRows}</div>;
    }
    throw new Error(
      '[ColorRangeContainer] fieldsMinRange, fieldsMaxRange, fieldRangeColor, or rangeLabel are undefined when an array is expected.',
    );
  }
}
