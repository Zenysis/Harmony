// @flow
import * as React from 'react';
import { quantile } from 'd3-array';

import ColorBlock from 'components/ui/ColorBlock';
import InputText from 'components/ui/InputText';
import autobind from 'decorators/autobind';
import {
  COLOR_BLOCK_SIZE,
  PRESET_COLOR_ORDER,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/constants';
import {
  PRIMARY_COLORS,
  LIGHT_PRIMARY_COLORS,
} from 'components/QueryResult/graphUtil';
import { range } from 'util/util';
import type {
  ActionOption,
  FieldFilterSelections,
  FilterRule,
} from 'components/QueryResult/QueryResultActionButtons/FilterColorModal/types';

type Props = {
  actionType: 'remove' | 'color',
  actionOption: ActionOption,
  fieldFilterSelections: FieldFilterSelections,
  fieldValues: $ReadOnlyArray<number>,
  rule: FilterRule,
  ruleIdx: number,
  onFieldFilterSelectionsChange: (
    newFieldSelections: FieldFilterSelections,
  ) => void,
};

type PresetRangeInfo = {
  numRangeColorInputs: number,
  fieldsMinRange: Array<string>,
  fieldsMaxRange: Array<string>,
  fieldRangeColor: Array<string>,
  rangeLabel: Array<string>,
};

export default class ActionValueInput extends React.PureComponent<Props> {
  /**
   * Only used by ET deployment
   */
  getMalariaAPIRangeInfo(): PresetRangeInfo {
    const { fieldValues } = this.props;
    const maxVal = fieldValues[fieldValues.length - 1].toFixed(2);
    return {
      numRangeColorInputs: 4,
      fieldsMinRange: [0, 1.0, 5.0, 100.0].map(String),
      fieldsMaxRange: [0.99, 4.99, 99.99, maxVal].map(String),
      fieldRangeColor: [
        PRIMARY_COLORS.GREEN,
        LIGHT_PRIMARY_COLORS.GREEN,
        '#ffff00', // NOTHING BUT YELLOW
        PRIMARY_COLORS.RED,
      ],
      rangeLabel: ['Free', 'Low', 'Moderate', 'High'],
    };
  }

  // TODO(pablo): a lot of duplicate code between onActionValueChange and
  // onActionValueColorChange. Merge this logic together.
  @autobind
  onActionValueChange(value: string) {
    const { rule, ruleIdx, fieldFilterSelections } = this.props;
    const newRule = {
      ...rule,
      actionValue: value,
    };
    const newFieldSelections = {
      ...fieldFilterSelections,
      [ruleIdx]: newRule,
    };
    this.props.onFieldFilterSelectionsChange(newFieldSelections);
  }

  @autobind
  onActionValueColorChange(color: { hex: string }) {
    const { rule, ruleIdx, fieldFilterSelections } = this.props;
    const newRule = {
      ...rule,
      actionColor: color.hex,
    };
    const newFieldSelections = {
      ...fieldFilterSelections,
      [ruleIdx]: newRule,
    };
    this.props.onFieldFilterSelectionsChange(newFieldSelections);
  }

  @autobind
  onPresetRangeChange(event: SyntheticEvent<HTMLSelectElement>) {
    const {
      fieldValues,
      fieldFilterSelections,
      onFieldFilterSelectionsChange,
      ruleIdx,
    } = this.props;
    const presetFilterSelection = event.currentTarget.value;
    if (presetFilterSelection === 'MALARIA_API') {
      const newFieldSelections = {
        ...fieldFilterSelections,
        ...this.getMalariaAPIRangeInfo(),
        [ruleIdx]: {
          ...fieldFilterSelections[ruleIdx],
          actionOption: 'custom_ranges',
        },
      };
      onFieldFilterSelectionsChange(newFieldSelections);
      return;
    }

    const fieldsMinRange = [];
    const fieldsMaxRange = [];
    const fieldRangeColor = [];
    const rangeLabel = [];

    const prevRangeLabels = fieldFilterSelections.rangeLabel || [];
    const numRangeColorInputs = Number(presetFilterSelection);
    const quantileIncrement = 1.0 / numRangeColorInputs;
    const offset = 0.0001;

    const quantileIncrements = range(numRangeColorInputs).map(
      i => i * quantileIncrement,
    );

    quantileIncrements.forEach((q, i) => {
      // ignore quantile calculations if we have no field values
      // TODO(pablo): eventually this can be removed altogether. we are only
      // keeping this here to support legacy queries. Once everything has
      // finished moving to the new Filter/Color rule models we do not need
      // these calculations here.
      if (fieldValues.length !== 0) {
        const quantileValue = quantile(fieldValues, q);
        const nextQuantileValue = quantile(
          fieldValues,
          i === quantileIncrements.length - 1 ? 1 : quantileIncrements[i + 1],
        );

        // set the min and max bounds for this quantile
        const minValue = i === 0 ? quantileValue : quantileValue + offset;
        fieldsMinRange.push(minValue.toFixed(4));
        fieldsMaxRange.push(nextQuantileValue.toFixed(4));
      }

      // set the default color
      fieldRangeColor.push(PRESET_COLOR_ORDER[i]);

      // copy over the previous range label names
      rangeLabel.push(prevRangeLabels[i] || '');
    });

    const rangeInfo: PresetRangeInfo = {
      numRangeColorInputs,
      fieldsMinRange,
      fieldsMaxRange,
      fieldRangeColor,
      rangeLabel,
    };

    const newFieldSelections = {
      ...fieldFilterSelections,
      ...rangeInfo,
    };
    onFieldFilterSelectionsChange(newFieldSelections);
  }

  renderColorBlock() {
    const { rule, ruleIdx } = this.props;
    return (
      <ColorBlock
        enableColorPicker
        size={COLOR_BLOCK_SIZE}
        color={rule.actionColor || PRESET_COLOR_ORDER[ruleIdx]}
        onColorChange={this.onActionValueColorChange}
      />
    );
  }

  renderSingleValueInput() {
    const { actionType, rule } = this.props;
    return (
      <span>
        <div className="col-xs-7">
          <InputText
            type="number"
            className="form-control input-sm"
            placeholder={t('query_form.filters.placeholder_enter_value')}
            onChange={this.onActionValueChange}
            value={rule.actionValue || ''}
          />
        </div>
        <div className="col-xs-5">
          {actionType === 'color' ? this.renderColorBlock() : null}
        </div>
      </span>
    );
  }

  renderPresetSlicingOptions() {
    const { fieldValues } = this.props;

    // only support the Malaria API preset if we are on ET deployment and
    // if we have query result values available (which only happens on AQT)
    // TODO(pablo): eventually we need to figure out how to support this on
    // AQT where we will not have query result values available
    const maybeMalariaApiOption =
      window.__JSON_FROM_BACKEND.deploymentName === 'et' &&
      fieldValues.length !== 0 ? (
        <option value="MALARIA_API">Malaria API</option>
      ) : null;

    // TODO(pablo): extract these options to a constants file
    return (
      <div className="col-xs-12">
        <span className="col-xs-9 preset-dropdown">
          <select
            className="form-control input-sm"
            onChange={this.onPresetRangeChange}
          >
            <option value="1">
              {t('query_form.filters.select_preset_filter_title')}
            </option>
            <option value="2">{t('query_form.filters.preset_median')}</option>
            <option value="3">{t('query_form.filters.preset_tertiles')}</option>
            <option value="4">
              {t('query_form.filters.preset_quartiles')}
            </option>
            <option value="5">
              {t('query_form.filters.preset_quintiles')}
            </option>
            <option value="10">{t('query_form.filters.preset_deciles')}</option>
            {maybeMalariaApiOption}
          </select>
        </span>
      </div>
    );
  }

  render() {
    const { actionOption } = this.props;
    switch (actionOption) {
      case 'color_above':
      case 'remove_above':
      case 'color_below':
      case 'remove_below':
      case 'color_top':
      case 'remove_top':
      case 'color_bottom':
      case 'remove_bottom':
        return this.renderSingleValueInput();
      case 'preset_ranges':
        return <div className="row">{this.renderPresetSlicingOptions()}</div>;
      case 'color_above_average':
      case 'color_below_average':
      case 'true':
      case 'false':
      case 'values_equal_to_null':
        return <div className="col-xs-5">{this.renderColorBlock()}</div>;
      default:
        return null;
    }
  }
}
