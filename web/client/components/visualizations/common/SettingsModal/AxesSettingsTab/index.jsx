// @flow
import * as React from 'react';

import ColorControl from 'components/visualizations/common/controls/ColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputControl from 'components/visualizations/common/controls/InputControl';
import LabelWrapper from 'components/ui/LabelWrapper';
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

type AxisFunctions = {
  xAxis: (controlKey: string, val: string) => void,
  y1Axis: (controlKey: string, val: string) => void,
  y2Axis: (controlKey: string, val: string) => void,
};

const LABEL_TEXT = {
  labelsFontColor: I18N.text('Labels font color'),
  labelsFontFamily: I18N.text('Labels font'),
  labelsFontSize: I18N.text('Labels font size'),
  titleFontColor: I18N.text('Title font color'),
  titleFontFamily: I18N.text('Title font'),
  titleFontSize: I18N.text('Title font size'),
};

export default class AxesSettingsTab extends React.PureComponent<Props> {
  static defaultProps: AxesSettingsOptions = {
    hasAxisRangeSupport: true,
  };

  // NOTE: Build axis change callbacks bound to a specific axis so we
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
    // $CycloneIdaiHack
    // TODO: enable this for all deployments when we've gone
    // through a full design process for these settings.
    return null;
  }

  maybeRenderAxisFontFamilyControlGroup(axisType: AxisType): React.Node {
    // $CycloneIdaiHack
    // TODO: enable this for all deployments when we've gone
    // through a full design process for these settings.
    return null;
  }

  maybeRenderXAxisTitleDistanceControlGroup(axisType: XAxisType): React.Node {
    // $CycloneIdaiHack
    // TODO: enable this for all deployments when we've gone
    // through a full design process for these settings.
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
        label={I18N.text('Range')}
        labelClassName="settings-modal__control-label"
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
            {I18N.text('to')}
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
        label={I18N.textById('Title')}
        onValueChange={this.onValueChange[axisType]}
      />
    );
  }

  renderAxisFontSizeControlGroup(axisType: AxisType): React.Node {
    const controlsMetadata = [
      { className: 'title-font-size', controlKey: 'titleFontSize' },
      { className: 'labels-font-size', controlKey: 'labelsFontSize' },
    ];

    const fontSizeControls = controlsMetadata.map(
      ({ className, controlKey }) => {
        const value = this.props.settings.get(axisType)[controlKey]();
        return (
          <FontSizeControl
            key={controlKey}
            buttonMinWidth={115}
            className={className}
            controlKey={controlKey}
            label={LABEL_TEXT[controlKey]}
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
      <SettingsBlock title={I18N.text('X-Axis')}>
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
    const titleText =
      yAxis === 'y1Axis' ? I18N.text('Y1-Axis') : I18N.text('Y2-Axis');
    return (
      <SettingsBlock className="y-axis-sub-section" title={titleText}>
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
