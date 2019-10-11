// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import ColorBlock from 'components/ui/ColorBlock';
import Dropdown from 'components/ui/Dropdown';
import Icon from 'components/ui/Icon';
import InputText from 'components/ui/InputText';
import SeriesOrderCarets from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/SeriesOrderCarets';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import {
  COLOR,
  DATA_LABEL_FORMAT,
  DATA_LABEL_FONT_SIZE,
  IS_VISIBLE,
  ORDER,
  SERIES_LABEL,
  SHOW_CONSTITUENTS,
  SHOW_VALUE,
  Y_AXIS,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/constants';
import { IndicatorLookup } from 'indicator_fields';
import {
  Y1_AXIS,
  Y2_AXIS,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { getFontDropdownOptions } from 'components/visualizations/util/settingsUtil';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type { ColorResult } from 'components/ui/ColorBlock';

export type SeriesRowEvents = {
  onSeriesOrderChange: (seriesId: string, newIndex: number) => void,
  onSeriesSettingsGlobalChange: (
    seriesId: string,
    settingType: string,
    value: any,
  ) => void,
  onSeriesSettingsLocalChange: (
    seriesId: string,
    settingType: string,
    value: any,
  ) => void,
};

type Props = SeriesRowEvents & {
  headers: Array<string>,
  index: number,
  series: QueryResultSeries,

  allowVisibilityToggle: boolean,
  isFirstRow: boolean,
  isLastRow: boolean,
};

const DATA_LABEL_OPTIONS = [
  <Dropdown.Option key="none" value="none">
    Default
  </Dropdown.Option>,
  <Dropdown.Option key="s0" value="0,0">
    0 decimals with separator
  </Dropdown.Option>,
  <Dropdown.Option key="0" value="0">
    0 decimals
  </Dropdown.Option>,
  <Dropdown.Option key="1" value="0.0">
    1 decimals
  </Dropdown.Option>,
  <Dropdown.Option key="2" value="0.00">
    2 decimals
  </Dropdown.Option>,
  <Dropdown.Option key="3" value="0.000">
    3 decimals
  </Dropdown.Option>,
  <Dropdown.Option key="p0" value="0%">
    Percentage (0 decimals)
  </Dropdown.Option>,
  <Dropdown.Option key="p1" value="0.0%">
    Percentage (1 decimals)
  </Dropdown.Option>,
  <Dropdown.Option key="p2" value="0.00%">
    Percentage (2 decimals)
  </Dropdown.Option>,
  <Dropdown.Option key="p3" value="0.000%">
    Percentage (3 decimals)
  </Dropdown.Option>,
];

const DATA_LABEL_FONT_SIZES = getFontDropdownOptions(10, 28);

const Y_AXIS_OPTIONS = [
  <Dropdown.Option key={Y1_AXIS} value={Y1_AXIS}>
    Y1
  </Dropdown.Option>,
  <Dropdown.Option key={Y2_AXIS} value={Y2_AXIS}>
    Y2
  </Dropdown.Option>,
];

export default class SeriesRow extends React.PureComponent<Props> {
  static eventNames: Array<$Keys<SeriesRowEvents>> = [
    'onSeriesOrderChange',
    'onSeriesSettingsGlobalChange',
    'onSeriesSettingsLocalChange',
  ];

  static defaultProps = {
    allowVisibilityToggle: false,
    isFirstRow: false,
    isLastRow: false,
  };

  getId() {
    return this.props.series.id();
  }

  @autobind
  onSeriesLabelChange(value: string) {
    this.props.onSeriesSettingsGlobalChange(this.getId(), 'label', value);
  }

  @autobind
  onOrderChange(newIndex: number) {
    this.props.onSeriesOrderChange(this.getId(), newIndex);
  }

  @autobind
  onColorChange(color: ColorResult) {
    this.props.onSeriesSettingsLocalChange(this.getId(), COLOR, color.hex);
  }

  @autobind
  onYAxisChange(yAxisNum: string) {
    this.props.onSeriesSettingsLocalChange(this.getId(), Y_AXIS, yAxisNum);
  }

  @autobind
  onDataLabelFontChange(option: string) {
    this.props.onSeriesSettingsLocalChange(
      this.getId(),
      DATA_LABEL_FONT_SIZE,
      option,
    );
  }

  @autobind
  onDataLabelFormatChange(option: string) {
    this.props.onSeriesSettingsLocalChange(
      this.getId(),
      DATA_LABEL_FORMAT,
      option,
    );
  }

  @autobind
  onShowConstituentsChange(value: boolean) {
    this.props.onSeriesSettingsLocalChange(
      this.getId(),
      SHOW_CONSTITUENTS,
      value,
    );
  }

  @autobind
  onShowValueChange(value: boolean) {
    this.props.onSeriesSettingsLocalChange(this.getId(), SHOW_VALUE, value);
  }

  @autobind
  onVisibilityChange(value: boolean) {
    this.props.onSeriesSettingsGlobalChange(this.getId(), IS_VISIBLE, value);
  }

  renderSeriesLabelCol() {
    return (
      <InputText.Uncontrolled
        debounce
        initialValue={this.props.series.label()}
        onChange={this.onSeriesLabelChange}
      />
    );
  }

  renderDataLabelFormatCol() {
    return (
      <Dropdown
        buttonWidth="100%"
        onSelectionChange={this.onDataLabelFormatChange}
        value={this.props.series.dataLabelFormat()}
        menuAlignment="right"
      >
        {DATA_LABEL_OPTIONS}
      </Dropdown>
    );
  }

  renderDataLabelFontSizeCol() {
    return (
      <Dropdown
        buttonWidth="100%"
        onSelectionChange={this.onDataLabelFontChange}
        value={this.props.series.dataLabelFontSize()}
      >
        {DATA_LABEL_FONT_SIZES}
      </Dropdown>
    );
  }

  renderYAxisCol() {
    return (
      <Dropdown
        onSelectionChange={this.onYAxisChange}
        value={this.props.series.yAxis()}
      >
        {Y_AXIS_OPTIONS}
      </Dropdown>
    );
  }

  renderColorCol() {
    return (
      <ColorBlock
        enableColorPicker
        color={this.props.series.color()}
        onColorChange={this.onColorChange}
      />
    );
  }

  renderOrderCol() {
    return (
      <SeriesOrderCarets
        index={this.props.index}
        onClick={this.onOrderChange}
        disableUp={this.props.isFirstRow}
        disableDown={this.props.isLastRow}
      />
    );
  }

  renderShowConstituentsCol() {
    const indicatorInfo = IndicatorLookup[this.getId()] || {};
    const constituents = indicatorInfo.children || indicatorInfo.constituents;
    const disabled = !constituents || !constituents.length;
    return (
      <Checkbox
        disabled={disabled}
        onChange={this.onShowConstituentsChange}
        value={this.props.series.showConstituents()}
      />
    );
  }

  renderShowValueCol() {
    return (
      <Checkbox
        onChange={this.onShowValueChange}
        value={this.props.series.showSeriesValue()}
      />
    );
  }

  renderVisibilityCol() {
    const { allowVisibilityToggle, series } = this.props;
    const isVisible = series.isVisible();
    const iconType = isVisible ? 'eye-open' : 'eye-close';
    const disabled = !allowVisibilityToggle && isVisible;
    return (
      <Checkbox
        disabled={disabled}
        onChange={this.onVisibilityChange}
        value={isVisible}
      >
        <Icon type={iconType} />
      </Checkbox>
    );
  }

  renderEditableContent(header: string) {
    switch (header) {
      case SERIES_LABEL:
        return this.renderSeriesLabelCol();
      case DATA_LABEL_FORMAT:
        return this.renderDataLabelFormatCol();
      case DATA_LABEL_FONT_SIZE:
        return this.renderDataLabelFontSizeCol();
      case Y_AXIS:
        return this.renderYAxisCol();
      case COLOR:
        return this.renderColorCol();
      case ORDER:
        return this.renderOrderCol();
      case SHOW_CONSTITUENTS:
        return this.renderShowConstituentsCol();
      case SHOW_VALUE:
        return this.renderShowValueCol();
      case IS_VISIBLE:
        return this.renderVisibilityCol();
      default:
        throw new Error(`[SeriesRow] Invalid header type specified: ${header}`);
    }
  }

  render(): Array<React.Element<typeof Table.Cell>> {
    return this.props.headers.map(header => (
      <Table.Cell key={header} className={header}>
        {this.renderEditableContent(header)}
      </Table.Cell>
    ));
  }
}
