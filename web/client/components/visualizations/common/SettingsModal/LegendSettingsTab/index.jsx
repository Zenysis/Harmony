// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Control from 'components/visualizations/common/controls/Control';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import FontColorControl from 'components/visualizations/common/controls/FontColorControl';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import RadioGroup from 'components/common/RadioGroup';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import autobind from 'decorators/autobind';
import { LEGEND_PLACEMENT_RADIO_ITEMS } from 'components/visualizations/common/SettingsModal/LegendSettingsTab/constants';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';

const TEXT = t('visualizations.common.SettingsModal.LegendSettingsTab');

// TODO(pablo, kyle): remove these boolean toggles as we go enabling them
const ENABLE_OVERLAP_LEGEND = false;
const ENABLE_LEGEND_PLACEMENT = false;

export type LegendSettingsEvents = {
  onLegendSettingsChange: (settingType: string, value: any) => void,
};

type Props = LegendSettingsEvents & {
  settings: LegendSettings,
};

export default class LegendSettingsTab extends React.PureComponent<Props> {
  static eventNames: Array<$Keys<LegendSettingsEvents>> = [
    'onLegendSettingsChange',
  ];

  // on either a radio or checkbox click
  @autobind
  onCheckableItemClick(value: any, name: string) {
    this.props.onLegendSettingsChange(name, value);
  }

  renderShowLegendControl() {
    const label = TEXT.showLegend;
    return (
      <Control label={label} colsWrapper={12} colsLabel={3} colsControl={9}>
        <Checkbox
          name="showLegend"
          onChange={this.onCheckableItemClick}
          value={this.props.settings.showLegend()}
        />
      </Control>
    );
  }

  renderOverlapLegendControl() {
    if (!ENABLE_OVERLAP_LEGEND) {
      return null;
    }
    const label = TEXT.overlapLegendWithChart;
    return (
      <Control label={label} colsWrapper={5} colsLabel={9} colsControl={3}>
        <Checkbox
          name="overlapLegendWithChart"
          onChange={this.onCheckableItemClick}
          value={this.props.settings.overlapLegendWithChart()}
        />
      </Control>
    );
  }

  renderFontControls() {
    return (
      <span>
        <FontSizeControl
          controlKey="legendFontSize"
          onValueChange={this.props.onLegendSettingsChange}
          value={this.props.settings.legendFontSize()}
          label={TEXT.legendFontSize}
          minFontSize={10}
          maxFontSize={24}
          colsLabel={3}
          colsControl={9}
          buttonMinWidth={115}
        />
        <FontColorControl
          controlKey="legendFontColor"
          value={this.props.settings.legendFontColor()}
          onValueChange={this.props.onLegendSettingsChange}
          label={TEXT.legendFontSize}
          buttonMinWidth={115}
        />
        <FontFamilyControl
          controlKey="legendFontFamily"
          value={this.props.settings.legendFontFamily()}
          onValueChange={this.props.onLegendSettingsChange}
          label={TEXT.legendFontSize}
          buttonMinWidth={115}
        />
      </span>
    );
  }

  renderLegendPlacement() {
    if (!ENABLE_LEGEND_PLACEMENT) {
      return null;
    }

    return (
      <Control label={TEXT.legendPlacement} colsLabel={3} colsControl={9}>
        <RadioGroup
          name="legendPlacement"
          onChange={this.onCheckableItemClick}
          value={this.props.settings.legendPlacement()}
        >
          {LEGEND_PLACEMENT_RADIO_ITEMS}
        </RadioGroup>
      </Control>
    );
  }

  renderControls() {
    return (
      <React.Fragment>
        <ControlsGroup>
          {this.renderShowLegendControl()}
          {this.renderOverlapLegendControl()}
        </ControlsGroup>
        <ControlsGroup>{this.renderFontControls()}</ControlsGroup>
        <ControlsGroup>{this.renderLegendPlacement()}</ControlsGroup>
      </React.Fragment>
    );
  }

  render() {
    const { title } = TEXT;
    return (
      <SettingsPage className="legend-settings-tab">
        <SettingsBlock title={title}>{this.renderControls()}</SettingsBlock>
      </SettingsPage>
    );
  }
}
