// @flow
import * as React from 'react';
import classNames from 'classnames';

import * as Zen from 'lib/Zen';
import Checkbox from 'components/ui/Checkbox';
import ColorBlock from 'components/ui/ColorBlock';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import DataActionRulesSelector from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesSelector';
import DragHandle from 'components/ui/DraggableItem/DragHandle';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import InputText from 'components/ui/InputText';
import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import Toaster from 'components/ui/Toaster';
import Tooltip from 'components/ui/Tooltip';
import autobind from 'decorators/autobind';
import {
  BAR_LABEL_POSITION,
  COLOR,
  DATA_LABEL_FORMAT,
  DATA_LABEL_FONT_SIZE,
  IS_VISIBLE,
  SHOW_VALUE,
  VISUAL_DISPLAY_SHAPE,
  Y_AXIS,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/constants';
import {
  Y1_AXIS,
  Y2_AXIS,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { getFontDropdownOptions } from 'components/visualizations/util/settingsUtil';
import type { ColorResult } from 'components/ui/ColorBlock';
import type { SeriesSettingsType } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/constants';
import type {
  ValuePosition,
  VisualDisplayShape,
} from 'models/core/QueryResultSpec/QueryResultSeries';

export type SeriesRowEvents = {
  onDataActionsChange: (dataActions: Zen.Array<DataActionRule>) => void,
  onSeriesSettingsGlobalChange: <K: Zen.SettableValueKeys<QueryResultSeries>>(
    seriesId: string,
    settingType: K,
    value: Zen.SettableValueType<QueryResultSeries, K>,
  ) => void,
  onSeriesSettingsLocalChange: <K: Zen.SettableValueKeys<QueryResultSeries>>(
    seriesId: string,
    settingType: K,
    value: Zen.SettableValueType<QueryResultSeries, K>,
  ) => void,
};

type DefaultProps = {
  allowVisibilityToggle: boolean,
  isLastRow: boolean,
};

type Props = {
  ...DefaultProps,
  ...SeriesRowEvents,
  dataActionRules: Zen.Array<DataActionRule>,
  headers: Array<SeriesSettingsType>,
  series: QueryResultSeries,
};

const TEXT = t(
  'visualizations.common.SettingsModal.SeriesSettingsTab.SeriesRow',
);

const TABLE_HEADERS = t(
  'visualizations.common.SettingsModal.SeriesSettingsTab.tableHeaders',
);

const DATA_LABEL_OPTIONS = [
  <Dropdown.Option key="none" value="none">
    Default
  </Dropdown.Option>,
  <Dropdown.Option key="s0" value="0,0">
    <I18N>0 decimals with separator</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="s2" value="0,0.00">
    <I18N>2 decimals with separator</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="0" value="0">
    <I18N>0 decimals</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="1" value="0.0">
    <I18N>1 decimals</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="2" value="0.00">
    <I18N>2 decimals</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="3" value="0.000">
    <I18N>3 decimals</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="p0" value="0%">
    <I18N>Percentage (0 decimals)</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="p1" value="0.0%">
    <I18N>Percentage (1 decimals)</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="p2" value="0.00%">
    <I18N>Percentage (2 decimals)</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="p3" value="0.000%">
    <I18N>Percentage (3 decimals)</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="a0" value="0a">
    <I18N>Abbreviated (K/M/B) (0 decimals)</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="a1" value="0.0a">
    <I18N>Abbreviated (K/M/B) (1 decimals)</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="a2" value="0.00a">
    <I18N>Abbreviated (K/M/B) (2 decimals)</I18N>
  </Dropdown.Option>,
  <Dropdown.Option key="a3" value="0.000a">
    <I18N>Abbreviated (K/M/B) (3 decimals)</I18N>
  </Dropdown.Option>,
];

const DATA_LABEL_FONT_SIZES = getFontDropdownOptions(10, 28);

const LABEL_POSITIONS = [
  <Dropdown.Option key="top" value="top">
    {TEXT.top}
  </Dropdown.Option>,
  <Dropdown.Option key="center" value="center">
    {TEXT.center}
  </Dropdown.Option>,
  <Dropdown.Option key="bottom" value="bottom">
    {TEXT.bottom}
  </Dropdown.Option>,
];

const Y_AXIS_OPTIONS = [
  <Dropdown.Option key={Y1_AXIS} value={Y1_AXIS}>
    Y1
  </Dropdown.Option>,
  <Dropdown.Option key={Y2_AXIS} value={Y2_AXIS}>
    Y2
  </Dropdown.Option>,
];

const VISUAL_DISPLAY_SHAPE_OPTIONS = [
  <Dropdown.Option key="bar" value="bar">
    <Group.Horizontal flex>
      <Icon
        className="series-settings-tab-series-row__visual-display-shape-icon"
        type="svg-bar"
      />
      {TEXT.bar}
    </Group.Horizontal>
  </Dropdown.Option>,
  <Dropdown.Option key="line" value="line">
    <Group.Horizontal flex>
      <Icon
        className="series-settings-tab-series-row__visual-display-shape-icon"
        type="svg-line"
      />
      {TEXT.line}
    </Group.Horizontal>
  </Dropdown.Option>,
  <Dropdown.Option key="dotted" value="dotted">
    <Group.Horizontal flex>
      <Icon
        className="series-settings-tab-series-row__visual-display-shape-icon"
        type="svg-dots"
      />
      {TEXT.dotted}
    </Group.Horizontal>
  </Dropdown.Option>,
];

export default class SeriesRow extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    allowVisibilityToggle: false,
    isLastRow: false,
  };

  getId(): string {
    return this.props.series.id();
  }

  @autobind
  onSeriesLabelChange(value: string) {
    if (value !== '') {
      this.props.onSeriesSettingsGlobalChange(this.getId(), 'label', value);
    } else {
      Toaster.error(TEXT.noEmpty);
    }
  }

  @autobind
  onSeriesColorChange(color: ColorResult) {
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
  onShowValueChange(value: boolean) {
    this.props.onSeriesSettingsLocalChange(this.getId(), SHOW_VALUE, value);
  }

  @autobind
  onBarLabelPositionChange(position: ValuePosition) {
    this.props.onSeriesSettingsLocalChange(
      this.getId(),
      BAR_LABEL_POSITION,
      position,
    );
  }

  @autobind
  onVisibilityChange(value: boolean) {
    this.props.onSeriesSettingsGlobalChange(this.getId(), IS_VISIBLE, value);
  }

  @autobind
  onVisualDisplayShapeChange(display: VisualDisplayShape) {
    this.props.onSeriesSettingsLocalChange(
      this.getId(),
      VISUAL_DISPLAY_SHAPE,
      display,
    );
  }

  @autobind
  renderDataActionRulesDropdown(): React.Node {
    const { dataActionRules, onDataActionsChange } = this.props;

    return (
      <DataActionRulesSelector
        dataActionRules={dataActionRules}
        fieldId={this.getId()}
        onDataActionsChange={onDataActionsChange}
      />
    );
  }

  renderSeriesLabelCol(): React.Node {
    return (
      <InputText.Uncontrolled
        ariaName={TABLE_HEADERS.seriesLabel}
        debounce
        initialValue={this.props.series.label()}
        onChange={this.onSeriesLabelChange}
      />
    );
  }

  renderDataLabelFormatCol(): React.Node {
    return (
      <Dropdown
        buttonWidth="100%"
        menuAlignment="right"
        onSelectionChange={this.onDataLabelFormatChange}
        value={this.props.series.dataLabelFormat()}
      >
        {DATA_LABEL_OPTIONS}
      </Dropdown>
    );
  }

  renderDataLabelFontSizeCol(): React.Node {
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

  renderYAxisCol(): React.Node {
    return (
      <Dropdown
        onSelectionChange={this.onYAxisChange}
        value={this.props.series.yAxis()}
      >
        {Y_AXIS_OPTIONS}
      </Dropdown>
    );
  }

  renderSeriesColorCol(): React.Node {
    return (
      <ColorBlock
        color={this.props.series.color()}
        enableColorPicker
        onColorChange={this.onSeriesColorChange}
      />
    );
  }

  renderShowValueCol(): React.Node {
    return (
      <Checkbox
        onChange={this.onShowValueChange}
        value={this.props.series.showSeriesValue()}
      />
    );
  }

  renderBarLabelPosition(): React.Node {
    return (
      <Dropdown
        buttonWidth="100%"
        onSelectionChange={this.onBarLabelPositionChange}
        value={this.props.series.barLabelPosition()}
      >
        {LABEL_POSITIONS}
      </Dropdown>
    );
  }

  renderVisibilityCol(): React.Node {
    const { allowVisibilityToggle, series } = this.props;
    const isVisible = series.isVisible();
    const iconType = isVisible ? 'eye-open' : 'eye-close';
    const toolTipText = isVisible ? TEXT.hide : TEXT.show;
    const disabled = !allowVisibilityToggle && isVisible;
    return (
      <Checkbox
        ariaName={toolTipText}
        disabled={disabled}
        onChange={this.onVisibilityChange}
        value={isVisible}
      >
        <Tooltip content={toolTipText}>
          <Icon type={iconType} />
        </Tooltip>
      </Checkbox>
    );
  }

  renderVisualDisplayShape(): React.Node {
    return (
      <Dropdown
        buttonWidth="80%"
        onSelectionChange={this.onVisualDisplayShapeChange}
        value={this.props.series.visualDisplayShape()}
      >
        {VISUAL_DISPLAY_SHAPE_OPTIONS}
      </Dropdown>
    );
  }

  renderEditableContent(header: SeriesSettingsType): React.Node {
    switch (header) {
      case 'seriesLabel':
        return this.renderSeriesLabelCol();
      case 'dataLabelFormat':
        return this.renderDataLabelFormatCol();
      case 'dataLabelFontSize':
        return this.renderDataLabelFontSizeCol();
      case 'yAxis':
        return this.renderYAxisCol();
      case 'color':
        return this.renderSeriesColorCol();
      case 'order':
        return <DragHandle />;
      case 'showSeriesValue':
        return this.renderShowValueCol();
      case 'isVisible':
        return this.renderVisibilityCol();
      case 'barLabelPosition':
        return this.renderBarLabelPosition();
      case 'visualDisplayShape':
        return this.renderVisualDisplayShape();
      case 'colorActions':
        return this.renderDataActionRulesDropdown();
      default:
        throw new Error(`[SeriesRow] Invalid header type specified: ${header}`);
    }
  }

  render(): React.Node {
    const { headers, isLastRow } = this.props;
    const rowClassName = classNames('series-settings-tab-series-row', {
      'series-settings-tab-series-row--last-row': isLastRow,
    });
    const colClassNames = headers.map(
      setting =>
        `series-settings-tab-series-row__cell series-settings-tab-series-row__${setting}`,
    );
    const columnCells = headers.map((header, i) => (
      <Group.Item key={header} className={colClassNames[i]}>
        {this.renderEditableContent(header)}
      </Group.Item>
    ));

    return (
      <Group.Horizontal
        alignItems="center"
        className={rowClassName}
        flex
        spacing="xs"
      >
        {columnCells}
      </Group.Horizontal>
    );
  }
}
