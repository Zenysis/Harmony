// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Group from 'components/ui/Group';
import InputControl from 'components/visualizations/common/controls/InputControl';
import LabelWrapper from 'components/ui/LabelWrapper';
import NumericDropdownControl from 'components/visualizations/common/controls/NumericDropdownControl';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import { AXIS_TYPES } from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { convertToNumberOrUndefined } from 'util/stringUtil';
import type AxesSettings from 'models/core/QueryResultSpec/VisualizationSettings/AxesSettings';
import type XAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/XAxisSettings';
import type YAxisSettings from 'models/core/QueryResultSpec/VisualizationSettings/YAxisSettings';
import type {
  AxisType,
  XAxisType,
  YAxisType,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';

export type AxesSettingsOptions = {
  hasAxisRangeSupport: boolean,
};

type Props = {
  ...AxesSettingsOptions,
  onAxisSettingsChange: (
    axisType: AxisType,
    settingType: string,
    value: any,
  ) => void,
  settings: AxesSettings,
  y1AxisEnabled: boolean,
  y2AxisEnabled: boolean,
};

const TEXT = t('visualizations.common.SettingsModal.AxesSettingsTab');

const GOAL_LINE_STYLE_OPTIONS: Array<string> = [
  TEXT.goalLineStyleSolid,
  TEXT.goalLineStyleDashed,
];

type AxisFunctions = {
  xAxis: (controlKey: string, val: string) => void,
  y1Axis: (controlKey: string, val: string) => void,
  y2Axis: (controlKey: string, val: string) => void,
};

export default class AxesSettingsTab extends React.PureComponent<Props> {
  static defaultProps: AxesSettingsOptions = {
    hasAxisRangeSupport: true,
  };

  // NOTE(david): Build axis change callbacks bound to a specific axis so we
  // can re-use existing control components without redefining the
  // onValueChange callback each time.
  onValueChange: AxisFunctions = {
    [AXIS_TYPES.X_AXIS]: this.buildOnValueChange(AXIS_TYPES.X_AXIS),
    [AXIS_TYPES.Y1_AXIS]: this.buildOnValueChange(AXIS_TYPES.Y1_AXIS),
    [AXIS_TYPES.Y2_AXIS]: this.buildOnValueChange(AXIS_TYPES.Y2_AXIS),
  };

  onAxisRangeChange: AxisFunctions = {
    [AXIS_TYPES.X_AXIS]: this.buildOnAxisRangeChange(AXIS_TYPES.X_AXIS),
    [AXIS_TYPES.Y1_AXIS]: this.buildOnAxisRangeChange(AXIS_TYPES.Y1_AXIS),
    [AXIS_TYPES.Y2_AXIS]: this.buildOnAxisRangeChange(AXIS_TYPES.Y2_AXIS),
  };

  buildOnValueChange(axisType: AxisType): (string, string) => void {
    return (controlKey: string, val: string) =>
      this.props.onAxisSettingsChange(axisType, controlKey, val);
  }

  buildOnAxisRangeChange(axisType: AxisType): (string, string) => void {
    return (controlKey: string, val: string) => {
      const newVal = convertToNumberOrUndefined(val);
      this.props.onAxisSettingsChange(axisType, controlKey, newVal);
    };
  }

  maybeRenderAxisFontColorControlGroup(axisType: AxisType): React.Node {
    return null;
  }

  maybeRenderAxisFontFamilyControlGroup(axisType: AxisType): React.Node {
    return null;
  }

  maybeRenderXAxisTitleDistanceControlGroup(axisType: XAxisType): React.Node {
    return null;
  }

  maybeRenderAxisRangeControlGroup(axisType: YAxisType): React.Node {
    if (!this.props.hasAxisRangeSupport) {
      return null;
    }

    const axisSettings = this.props.settings.get(axisType);
    const rangeFromValue = axisSettings.rangeFrom();
    const rangeToValue = axisSettings.rangeTo();
    const onValueChange = this.onAxisRangeChange[axisType];

    return (
      <LabelWrapper
        labelClassName="settings-modal__control-label"
        label={TEXT[axisType].labels.rangeFrom}
      >
        <Group alignItems="center" flex itemFlexValue="1" spacing="m">
          <InputControl
            key="rangeFrom"
            controlKey="rangeFrom"
            initialValue={
              rangeFromValue === undefined || rangeFromValue === null
                ? ''
                : rangeFromValue.toString()
            }
            onValueChange={onValueChange}
          />
          <Group.Item className="settings-modal__control-label" flexValue="0">
            {TEXT[axisType].labels.rangeTo}
          </Group.Item>
          <InputControl
            key="rangeTo"
            controlKey="rangeTo"
            initialValue={
              rangeToValue === undefined || rangeToValue === null
                ? ''
                : rangeToValue.toString()
            }
            onValueChange={onValueChange}
          />
        </Group>
      </LabelWrapper>
    );
  }

  renderAxisTitleControlGroup(axisType: AxisType): React.Node {
    const initialValue = this.props.settings.get(axisType).get('title');

    return (
      <InputControl
        controlKey="title"
        initialValue={initialValue}
        onValueChange={this.onValueChange[axisType]}
        label={TEXT[axisType].labels.title}
      />
    );
  }

  renderAxisFontSizeControlGroup(axisType: AxisType): React.Node {
    const controlsMetadata = [
      { controlKey: 'titleFontSize', className: 'title-font-size' },
      { controlKey: 'labelsFontSize', className: 'labels-font-size' },
    ];

    const fontSizeControls = controlsMetadata.map(
      ({ controlKey, className }) => {
        const value = this.props.settings.get(axisType)[controlKey]();
        return (
          <FontSizeControl
            buttonMinWidth={115}
            className={className}
            controlKey={controlKey}
            key={controlKey}
            label={TEXT[axisType].labels[controlKey]}
            maxFontSize={17}
            minFontSize={12}
            onValueChange={this.onValueChange[axisType]}
            value={value}
          />
        );
      },
    );
    return <Group.Vertical spacing="l">{fontSizeControls}</Group.Vertical>;
  }

  renderXAxisSection(): React.Node {
    const axisType = AXIS_TYPES.X_AXIS;
    return (
      <SettingsBlock title={TEXT[axisType].title}>
        <Group.Vertical spacing="l">
          {this.renderAxisTitleControlGroup(axisType)}
          {this.renderAxisFontSizeControlGroup(axisType)}
          {this.maybeRenderAxisFontColorControlGroup(axisType)}
          {this.maybeRenderAxisFontFamilyControlGroup(axisType)}
          {this.maybeRenderXAxisTitleDistanceControlGroup(axisType)}
        </Group.Vertical>
      </SettingsBlock>
    );
  }

  renderYAxisSubSection(yAxis: YAxisType): React.Node {
    return (
      <SettingsBlock className="y-axis-sub-section" title={TEXT[yAxis].title}>
        <Group.Vertical spacing="l">
          {this.renderAxisTitleControlGroup(yAxis)}
          {this.renderAxisFontSizeControlGroup(yAxis)}
          {this.maybeRenderAxisFontColorControlGroup(yAxis)}
          {this.maybeRenderAxisFontFamilyControlGroup(yAxis)}
          {this.maybeRenderAxisRangeControlGroup(yAxis)}
        </Group.Vertical>
      </SettingsBlock>
    );
  }

  renderYAxisSection(): React.Node {
    const { y1AxisEnabled, y2AxisEnabled } = this.props;

    return (
      <React.Fragment>
        {y1AxisEnabled && this.renderYAxisSubSection(AXIS_TYPES.Y1_AXIS)}
        {y2AxisEnabled && this.renderYAxisSubSection(AXIS_TYPES.Y2_AXIS)}
      </React.Fragment>
    );
  }

  render(): React.Node {
    return (
      <SettingsPage className="axes-settings-tab">
        {this.renderXAxisSection()}
        {this.renderYAxisSection()}
      </SettingsPage>
    );
  }
}
