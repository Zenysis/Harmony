// @flow
import * as React from 'react';
import numeral from 'numeral';

import ColorBlock from 'components/ui/ColorBlock';
import autobind from 'decorators/autobind';
import {
  COLOR_BLOCK_SIZE,
  PRESET_COLOR_ORDER,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/constants';

type Props = {
  onRangeLabelChange: (value: string, rowIdx: number) => void,
  onMinRangeChange: (value: string, rowIdx: number) => void,
  onMaxRangeChange: (value: string, rowIdx: number) => void,
  onRangeColorChange: (hexColor: string, rowIdx: number) => void,
  onRemoveColorRow: () => void,
  onAddColorRow: () => void,
  rangeType: 'preset_ranges' | 'custom_ranges',
  rowIdx: number,
  totalNumRows: number,

  // TODO(pablo): these should always be expected to exist, but there are
  // several dashboard specs where the rangeColor arrays do not match in
  // length. For example, where fieldsMaxRange has length of 4, but
  // rangeColor has length of 3. So we might expect ColorRangeContainer
  // to pass down some undefined values here, which we need to handle.
  // We need to fix this in the backend with a dashboard spec upgrade
  // script to enforce that the arrays in fieldColorSelections are always
  // the same length.
  maxRange?: string,
  minRange?: string,
  rangeColor?: string,
  rangeLabel?: string,
  isMaxInputs?: boolean,
};

const TEXT = t('query_form.filters');

// format a number to two decimal places only if necessary
function twoDecimalPlaces(num: number): string {
  return numeral(num).format('0,0.[00]');
}

export default class ColorRangeRow extends React.PureComponent<Props> {
  static defaultProps = {
    maxRange: '',
    minRange: '',
    rangeColor: undefined,
    rangeLabel: '',
    isMaxInputs: false,
  };

  getColorRange() {
    const { rangeColor, rowIdx } = this.props;
    return rangeColor || PRESET_COLOR_ORDER[rowIdx];
  }

  @autobind
  onRangeLabelChange(event: SyntheticEvent<HTMLInputElement>) {
    this.props.onRangeLabelChange(event.currentTarget.value, this.props.rowIdx);
  }

  @autobind
  onMinRangeChange(event: SyntheticEvent<HTMLInputElement>) {
    this.props.onMinRangeChange(event.currentTarget.value, this.props.rowIdx);
  }

  @autobind
  onMaxRangeChange(event: SyntheticEvent<HTMLInputElement>) {
    this.props.onMaxRangeChange(event.currentTarget.value, this.props.rowIdx);
  }

  @autobind
  onRangeColorChange(colorObj: { hex: string }) {
    this.props.onRangeColorChange(colorObj.hex, this.props.rowIdx);
  }

  maybeRenderAddButton() {
    const { onAddColorRow, rangeType, isMaxInputs } = this.props;
    if (rangeType === 'custom_ranges' && !isMaxInputs) {
      return (
        <span className="filter-glyphicons">
          <button
            type="button"
            className="btn btn-link"
            onClick={onAddColorRow}
          >
            <i className="glyphicon glyphicon-plus" />
          </button>
        </span>
      );
    }
    return null;
  }

  maybeRenderRemoveButton() {
    const { onRemoveColorRow, rangeType } = this.props;
    if (rangeType === 'custom_ranges') {
      return (
        <span className="filter-glyphicons">
          <button
            type="button"
            className="btn btn-link"
            onClick={onRemoveColorRow}
          >
            <i className="glyphicon glyphicon-remove" />
          </button>
        </span>
      );
    }
    return null;
  }

  renderRangeInputs() {
    const { rangeType, rowIdx, totalNumRows, maxRange, minRange } = this.props;
    const basePercentile = 1 / totalNumRows;
    const minRangeVal =
      rangeType === 'custom_ranges'
        ? minRange
        : `${twoDecimalPlaces(basePercentile * rowIdx * 100)}%`;
    const maxRangeVal =
      rangeType === 'custom_ranges'
        ? maxRange
        : `${twoDecimalPlaces(basePercentile * (rowIdx + 1) * 100)}%`;

    const inputStep = rangeType === 'custom_ranges' ? 'any' : undefined;
    const inputType = rangeType === 'custom_ranges' ? 'number' : undefined;

    // preset ranges cannot be modified, these are auto-generated
    return (
      <React.Fragment>
        <div className="col-xs-2">
          <input
            disabled={rangeType === 'preset_ranges'}
            className="form-control"
            placeholder={TEXT.placeholder_range_min}
            value={minRangeVal}
            step={inputStep}
            type={inputType}
            onChange={this.onMinRangeChange}
          />
        </div>
        <div className="col-xs-2">
          <input
            disabled={rangeType === 'preset_ranges'}
            className="form-control"
            placeholder={TEXT.placeholder_range_max}
            step={inputStep}
            type={inputType}
            value={maxRangeVal}
            onChange={this.onMaxRangeChange}
          />
        </div>
      </React.Fragment>
    );
  }

  render() {
    const { rangeLabel } = this.props;
    return (
      <div className="form-group col-xs-12 filter-color-ranges">
        <span className="filter-glyphicons">
          <i className="glyphicon glyphicon-chevron-right filter-arrow" />
        </span>
        <div className="col-xs-3">
          <input
            type="text"
            onChange={this.onRangeLabelChange}
            placeholder={TEXT.placeholder_range_label}
            value={rangeLabel}
            className="form-control"
          />
        </div>
        {this.renderRangeInputs()}
        <div className="col-xs-3">
          <ColorBlock
            enableColorPicker
            size={COLOR_BLOCK_SIZE}
            color={this.getColorRange()}
            // eslint-disable-next-line react/jsx-no-bind
            onColorChange={this.onRangeColorChange}
          />
        </div>
        {this.maybeRenderRemoveButton()}
        {this.maybeRenderAddButton()}
      </div>
    );
  }
}
