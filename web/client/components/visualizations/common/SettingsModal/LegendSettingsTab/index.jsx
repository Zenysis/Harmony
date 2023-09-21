// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import ColorControl from 'components/visualizations/common/controls/ColorControl';
import Control from 'components/visualizations/common/controls/Control';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import RadioGroup from 'components/ui/RadioGroup';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import autobind from 'decorators/autobind';
import { LEGEND_PLACEMENT_RADIO_ITEMS } from 'components/visualizations/common/SettingsModal/LegendSettingsTab/constants';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';

// TODO: remove these boolean toggles as we go enabling them
const ENABLE_OVERLAP_LEGEND = false;
const ENABLE_LEGEND_PLACEMENT = false;

type Props = {
  onLegendSettingsChange: (settingType: string, value: any) => void,
  settings: LegendSettings,
};

export default class LegendSettingsTab extends React.PureComponent<Props> {
  // on either a radio or checkbox click
  @autobind
  onCheckableItemClick(value: any, name: string) {
    this.props.onLegendSettingsChange(name, value);
  }

  renderShowLegendControl(): React.Node {
    const label = I18N.text('Show legend');
    return (
      <Control label={label}>
        <Checkbox
          name="showLegend"
          onChange={this.onCheckableItemClick}
          value={this.props.settings.showLegend()}
        />
      </Control>
    );
  }

  renderConsolidateLegendControl(): React.Node {
    const label = I18N.text('Consolidate legend rules');
    return (
      <Control label={label}>
        <Checkbox
          name="consolidateRules"
          onChange={this.onCheckableItemClick}
          value={this.props.settings.consolidateRules()}
        />
      </Control>
    );
  }

  renderOverlapLegendControl(): React.Node {
    if (!ENABLE_OVERLAP_LEGEND) {
      return null;
    }
    const label = I18N.text(
      'Overlap legend with chart',
      'overlapLegendWithChart',
    );
    return (
      <Control label={label}>
        <Checkbox
          name="overlapLegendWithChart"
          onChange={this.onCheckableItemClick}
          value={this.props.settings.overlapLegendWithChart()}
        />
      </Control>
    );
  }

  renderFontControls(): React.Node {
    return (
      <Group.Vertical spacing="l">
        <FontSizeControl
          buttonMinWidth={115}
          controlKey="legendFontSize"
          label={I18N.text('Legend font size', 'legendFontSize')}
          labelClassName="wrap-label-text"
          maxFontSize={24}
          minFontSize={10}
          onValueChange={this.props.onLegendSettingsChange}
          value={this.props.settings.legendFontSize()}
        />
        <ColorControl
          controlKey="legendFontColor"
          enableNoColor={false}
          label={I18N.text('Legend font color', 'legendFontColor')}
          onValueChange={this.props.onLegendSettingsChange}
          value={this.props.settings.legendFontColor()}
        />
        <FontFamilyControl
          buttonMinWidth={115}
          controlKey="legendFontFamily"
          label={I18N.text('Legend font')}
          onValueChange={this.props.onLegendSettingsChange}
          value={this.props.settings.legendFontFamily()}
        />
      </Group.Vertical>
    );
  }

  renderLegendPlacement(): React.Node {
    if (!ENABLE_LEGEND_PLACEMENT) {
      return null;
    }

    return (
      <Control label={I18N.text('Legend placement')}>
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

  renderControls(): React.Node {
    return (
      <Group.Vertical spacing="l">
        {this.renderShowLegendControl()}
        {this.renderConsolidateLegendControl()}
        {this.renderOverlapLegendControl()}
        {this.renderFontControls()}
        {this.renderLegendPlacement()}
      </Group.Vertical>
    );
  }

  render(): React.Node {
    const title = I18N.text('Legend Settings');
    return (
      <SettingsPage className="legend-settings-tab">
        <SettingsBlock title={title}>{this.renderControls()}</SettingsBlock>
      </SettingsPage>
    );
  }
}
