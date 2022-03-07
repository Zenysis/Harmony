// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import ColorControl from 'components/visualizations/common/controls/ColorControl';
import Control from 'components/visualizations/common/controls/Control';
import FontFamilyControl from 'components/visualizations/common/controls/FontFamilyControl';
import FontSizeControl from 'components/visualizations/common/controls/FontSizeControl';
import Group from 'components/ui/Group';
import RadioGroup from 'components/ui/RadioGroup';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import autobind from 'decorators/autobind';
import { LEGEND_PLACEMENT_RADIO_ITEMS } from 'components/visualizations/common/SettingsModal/LegendSettingsTab/constants';
import type LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';

const TEXT = t('visualizations.common.SettingsModal.LegendSettingsTab');

// TODO(pablo, kyle): remove these boolean toggles as we go enabling them
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
    const label = TEXT.showLegend;
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

  renderOverlapLegendControl(): React.Node {
    if (!ENABLE_OVERLAP_LEGEND) {
      return null;
    }
    const label = TEXT.overlapLegendWithChart;
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
          controlKey="legendFontSize"
          onValueChange={this.props.onLegendSettingsChange}
          value={this.props.settings.legendFontSize()}
          label={TEXT.legendFontSize}
          minFontSize={10}
          maxFontSize={24}
          buttonMinWidth={115}
          labelClassName="wrap-label-text"
        />
        <ColorControl
          controlKey="legendFontColor"
          enableNoColor={false}
          value={this.props.settings.legendFontColor()}
          onValueChange={this.props.onLegendSettingsChange}
          label={TEXT.legendFontColor}
        />
        <FontFamilyControl
          controlKey="legendFontFamily"
          value={this.props.settings.legendFontFamily()}
          onValueChange={this.props.onLegendSettingsChange}
          label={TEXT.legendFont}
          buttonMinWidth={115}
        />
      </Group.Vertical>
    );
  }

  renderLegendPlacement(): React.Node {
    if (!ENABLE_LEGEND_PLACEMENT) {
      return null;
    }

    return (
      <Control label={TEXT.legendPlacement}>
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
        {this.renderOverlapLegendControl()}
        {this.renderFontControls()}
        {this.renderLegendPlacement()}
      </Group.Vertical>
    );
  }

  render(): React.Node {
    const { title } = TEXT;
    return (
      <SettingsPage className="legend-settings-tab">
        <SettingsBlock title={title}>{this.renderControls()}</SettingsBlock>
      </SettingsPage>
    );
  }
}
