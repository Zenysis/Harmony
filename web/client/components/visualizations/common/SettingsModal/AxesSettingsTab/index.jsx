// @flow
import * as React from 'react';

import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import FontColorControl from 'components/visualizations/common/controls/FontColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import InputControl from 'components/visualizations/common/controls/InputControl';
import LineStyleDropdownControl from 'components/visualizations/common/controls/LineStyleDropdownControl';
import NumericDropdownControl from 'components/visualizations/common/controls/NumericDropdownControl';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import { AXIS_TYPES } from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { convertToNumberOrUndefined } from 'util/stringUtil';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type {
  AxisType,
  XAxisType,
  YAxisType,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';

export type AxesSettingsEvents = {
  onAxisSettingsChange: (
    axisType: AxisType,
    settingType: string,
    value: any,
  ) => void,
};

export type AxesSettingsOptions = {
  hasAxisRangeSupport: boolean,
  hasGoalLine: boolean,
};

type Props = $Merge<
  $Merge<AxesSettingsEvents, AxesSettingsOptions>,
  {
    settings: AxesSettings,
    y1AxisEnabled: boolean,
    y2AxisEnabled: boolean,
  },
>;

const TEXT = t('visualizations.common.SettingsModal.AxesSettingsTab');

const GOAL_LINE_STYLE_OPTIONS = [
  TEXT.goalLineStyleSolid,
  TEXT.goalLineStyleDashed,
];

export default class AxesSettingsTab extends React.PureComponent<Props> {
  static eventNames: Array<$Keys<AxesSettingsEvents>> = [
    'onAxisSettingsChange',
  ];

  static defaultProps = {
    hasAxisRangeSupport: true,
    hasGoalLine: false,
  };

  // NOTE(david): Build axis change callbacks bound to a specific axis so we
  // can re-use existing control components without redefining the
  // onValueChange callback each time.
  onValueChange = {
    [AXIS_TYPES.X_AXIS]: this.buildOnValueChange(AXIS_TYPES.X_AXIS),
    [AXIS_TYPES.Y1_AXIS]: this.buildOnValueChange(AXIS_TYPES.Y1_AXIS),
    [AXIS_TYPES.Y2_AXIS]: this.buildOnValueChange(AXIS_TYPES.Y2_AXIS),
  };

  onAxisRangeChange = {
    [AXIS_TYPES.X_AXIS]: this.buildOnAxisRangeChange(AXIS_TYPES.X_AXIS),
    [AXIS_TYPES.Y1_AXIS]: this.buildOnAxisRangeChange(AXIS_TYPES.Y1_AXIS),
    [AXIS_TYPES.Y2_AXIS]: this.buildOnAxisRangeChange(AXIS_TYPES.Y2_AXIS),
  };

  buildOnValueChange(axisType: AxisType) {
    return (controlKey: string, val: string) =>
      this.props.onAxisSettingsChange(axisType, controlKey, val);
  }

  buildOnAxisRangeChange(axisType: AxisType) {
    return (controlKey: string, val: string) => {
      const newVal = convertToNumberOrUndefined(val);
      this.props.onAxisSettingsChange(axisType, controlKey, newVal);
    };
  }

  maybeRenderAxisGoalLineControlGroup(axisType: AxisType) {
    if (this.props.hasGoalLine) {
      const {
        goalLine,
        goalLineLabel,
        goalLineFontSize,
        goalLineColor,
        goalLineThickness,
        goalLineStyle,
      } = this.props.settings.get(axisType).modelValues();
      return (
        <ControlsGroup>
          <span zen-test-id={`goalLine-${axisType}`}>
            <InputControl
              colsControl={9}
              colsLabel={3}
              controlKey="goalLine"
              initialValue={goalLine}
              onValueChange={this.onValueChange[axisType]}
              label={TEXT.goalLineValue}
            />
          </span>
          <InputControl
            colsControl={9}
            colsLabel={3}
            controlKey="goalLineLabel"
            initialValue={goalLineLabel}
            onValueChange={this.onValueChange[axisType]}
            label={TEXT.goalLineLabel}
          />
          <FontSizeControl
            colsControl={9}
            colsLabel={3}
            colsWrapper={12}
            controlKey="goalLineFontSize"
            value={goalLineFontSize}
            onValueChange={this.onValueChange[axisType]}
            label={TEXT.goalLineFontSize}
            buttonMinWidth={100}
            maxFontSize={28}
            minFontSize={10}
          />
          <NumericDropdownControl
            colsControl={9}
            colsLabel={3}
            colsWrapper={12}
            controlKey="goalLineThickness"
            value={goalLineThickness}
            onValueChange={this.onValueChange[axisType]}
            label={TEXT.goalLineThickness}
            buttonMinWidth={100}
          />
          <LineStyleDropdownControl
            axisType={axisType}
            colsControl={9}
            colsLabel={3}
            colsWrapper={12}
            controlKey="goalLineStyle"
            value={goalLineStyle}
            onValueChange={this.onValueChange[axisType]}
            label={TEXT.goalLineStyle}
            optionValues={GOAL_LINE_STYLE_OPTIONS}
            buttonMinWidth={100}
          />
          <FontColorControl
            axisType={axisType}
            controlKey="goalLineColor"
            value={goalLineColor}
            onValueChange={this.onValueChange[axisType]}
            label={TEXT.goalLineColor}
            buttonMinWidth={115}
          />
        </ControlsGroup>
      );
    }
    return null;
  }

  maybeRenderYAxisSubSection(yAxis: YAxisType) {
    const isAxisEnabled = this.props[`${yAxis}Enabled`];
    if (!isAxisEnabled) {
      return null;
    }

    return (
      <SettingsBlock className="y-axis-sub-section" title={TEXT[yAxis].title}>
        {this.renderAxisTitleControlGroup(yAxis)}
        {this.renderAxisFontSizeControlGroup(yAxis)}
        {this.maybeRenderAxisFontColorControlGroup(yAxis)}
        {this.maybeRenderAxisFontFamilyControlGroup(yAxis)}
        {this.maybeRenderAxisRangeControlGroup(yAxis)}
        {this.maybeRenderAxisGoalLineControlGroup(yAxis)}
      </SettingsBlock>
    );
  }

  maybeRenderAxisFontColorControlGroup(axisType: AxisType) {
    // $CycloneIdaiHack
    // TODO(pablo, moriah): enable this for all deployments when we've gone
    // through a full design process for these settings.
    if (window.__JSON_FROM_BACKEND.deploymentName !== 'mz') {
      return null;
    }

    const controlsMetadata = [
      { controlKey: 'titleFontColor', className: 'title-font-color' },
      { controlKey: 'labelsFontColor', className: 'labels-font-color' },
    ];

    const fontColorControls = controlsMetadata.map(
      ({ controlKey, className }) => {
        const value = this.props.settings.get(axisType)[controlKey]();
        return (
          <ControlsGroup key={controlKey}>
            <FontColorControl
              axisType={axisType}
              controlKey={controlKey}
              value={value}
              onValueChange={this.onValueChange[axisType]}
              label={TEXT[axisType].labels[controlKey]}
              className={className}
              buttonMinWidth={115}
            />
          </ControlsGroup>
        );
      },
    );
    return <React.Fragment>{fontColorControls}</React.Fragment>;
  }

  maybeRenderAxisFontFamilyControlGroup(axisType: AxisType) {
    // $CycloneIdaiHack
    // TODO(pablo, moriah): enable this for all deployments when we've gone
    // through a full design process for these settings.
    if (window.__JSON_FROM_BACKEND.deploymentName !== 'mz') {
      return null;
    }

    const controlsMetadata = [
      { controlKey: 'titleFontFamily', className: 'title-font-family' },
      { controlKey: 'labelsFontFamily', className: 'labels-font-family' },
    ];

    const fontFamilyControls = controlsMetadata.map(
      ({ controlKey, className }) => {
        const value = this.props.settings.get(axisType)[controlKey]();
        return (
          <ControlsGroup key={controlKey}>
            <FontFamilyControl
              controlKey={controlKey}
              value={value}
              onValueChange={this.onValueChange[axisType]}
              label={TEXT[axisType].labels[controlKey]}
              className={className}
              buttonMinWidth={115}
            />
          </ControlsGroup>
        );
      },
    );
    return <React.Fragment>{fontFamilyControls}</React.Fragment>;
  }

  maybeRenderXAxisTitleDistanceControlGroup(axisType: XAxisType) {
    // $CycloneIdaiHack
    // TODO(pablo, moriah): enable this for all deployments when we've gone
    // through a full design process for these settings.
    if (window.__JSON_FROM_BACKEND.deploymentName !== 'mz') {
      return null;
    }

    const { settings } = this.props;
    const value = settings.get(AXIS_TYPES.X_AXIS).additionalAxisTitleDistance();
    const controlKey = 'additionalAxisTitleDistance';
    return (
      <ControlsGroup key={controlKey}>
        <InputControl
          key={controlKey}
          controlKey={controlKey}
          initialValue={value}
          onValueChange={this.onValueChange[axisType]}
          label={TEXT[axisType].labels[controlKey]}
        />
      </ControlsGroup>
    );
  }

  maybeRenderAxisRangeControlGroup(axisType: YAxisType) {
    if (!this.props.hasAxisRangeSupport) {
      return null;
    }

    const controlsMetadata = [
      {
        controlKey: 'rangeFrom',
        className: 'range-from',
        columns: { colsWrapper: 6, colsLabel: 6, colsControl: 6 },
      },
      {
        controlKey: 'rangeTo',
        className: 'range-to',
        columns: { colsWrapper: 4, colsLabel: 1, colsControl: 9 },
      },
    ];
    const rangeControls = controlsMetadata.map(
      ({ controlKey, className, columns }) => {
        const value = this.props.settings.get(axisType)[controlKey]();
        return (
          <InputControl
            key={controlKey}
            axisType={axisType}
            controlKey={controlKey}
            initialValue={
              value === undefined || value === null ? '' : value.toString()
            }
            onValueChange={this.onAxisRangeChange[axisType]}
            label={TEXT[axisType].labels[controlKey]}
            className={className}
            {...columns}
          />
        );
      },
    );
    return <ControlsGroup>{rangeControls}</ControlsGroup>;
  }

  renderAxisTitleControlGroup(axisType: AxisType) {
    const initialValue = this.props.settings.get(axisType).get('title');

    return (
      <ControlsGroup>
        <InputControl
          controlKey="title"
          initialValue={initialValue}
          onValueChange={this.onValueChange[axisType]}
          label={TEXT[axisType].labels.title}
          colsLabel={3}
          colsControl={9}
        />
      </ControlsGroup>
    );
  }

  renderAxisFontSizeControlGroup(axisType: AxisType) {
    const controlsMetadata = [
      { controlKey: 'titleFontSize', className: 'title-font-size' },
      { controlKey: 'labelsFontSize', className: 'labels-font-size' },
    ];

    const fontSizeControls = controlsMetadata.map(
      ({ controlKey, className }) => {
        const value = this.props.settings.get(axisType)[controlKey]();
        return (
          <ControlsGroup key={controlKey}>
            <FontSizeControl
              controlKey={controlKey}
              value={value}
              onValueChange={this.onValueChange[axisType]}
              label={TEXT[axisType].labels[controlKey]}
              className={className}
              buttonMinWidth={115}
              maxFontSize={28}
              minFontSize={10}
            />
          </ControlsGroup>
        );
      },
    );
    return <React.Fragment>{fontSizeControls}</React.Fragment>;
  }

  renderXAxisSection() {
    const axisType = AXIS_TYPES.X_AXIS;
    return (
      <SettingsBlock title={TEXT[axisType].title}>
        {this.renderAxisTitleControlGroup(axisType)}
        {this.renderAxisFontSizeControlGroup(axisType)}
        {this.maybeRenderAxisFontColorControlGroup(axisType)}
        {this.maybeRenderAxisFontFamilyControlGroup(axisType)}
        {this.maybeRenderXAxisTitleDistanceControlGroup(axisType)}
      </SettingsBlock>
    );
  }

  renderYAxisSection() {
    return (
      <React.Fragment>
        {this.maybeRenderYAxisSubSection(AXIS_TYPES.Y1_AXIS)}
        {this.maybeRenderYAxisSubSection(AXIS_TYPES.Y2_AXIS)}
      </React.Fragment>
    );
  }

  render() {
    return (
      <SettingsPage className="axes-settings-tab">
        {this.renderXAxisSection()}
        {this.renderYAxisSection()}
      </SettingsPage>
    );
  }
}
