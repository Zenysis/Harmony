// @flow
import * as React from 'react';

import BandSettingsControl from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl';
import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import SortOrderControl from 'components/visualizations/common/controls/SortOrderControl';
import autobind from 'decorators/autobind';
import type { BandSetting } from 'models/visualizations/LineGraph/LineGraphSettings';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'TIME'>;
type State = {
  bandSectionCollapsed: boolean,
};

const RESULT_LIMIT_OPTIONS = [1, 5, 10, 20, 50, 100];

export default class LineGraphControlsBlock extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    bandSectionCollapsed: true,
  };

  @autobind
  onAddBand() {
    const bands = this.props.controls.bands();
    const newBand = {
      areaColor: undefined,
      areaLabel: '',
      lower: undefined,
      upper: undefined,
    };
    this.onBandSettingsChange([...bands, newBand]);
    this.onExpandBandSection();
  }

  @autobind
  onExpandBandSection() {
    this.setState({ bandSectionCollapsed: false });
  }

  @autobind
  onBandSettingsChange(bands: $ReadOnlyArray<BandSetting>) {
    this.props.onControlsSettingsChange('bands', bands);
  }

  maybeRenderEthiopianDatesControl(): React.Node {
    if (!window.__JSON_FROM_BACKEND.timeseriesUseEtDates) {
      return null;
    }

    return (
      <CheckboxControl
        controlKey="useEthiopianDates"
        label={I18N.textById('showEthiopianDates')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.useEthiopianDates()}
      />
    );
  }

  maybeRenderResultLimitDropdown(): React.Node {
    const { controls, groupBySettings, onControlsSettingsChange } = this.props;

    if (groupBySettings.hasOnlyDateGrouping()) {
      return null;
    }

    return (
      <ResultLimitControl
        buttonMinWidth={115}
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        value={controls.resultLimit()}
      />
    );
  }

  renderLogScalingControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="logScaling"
        label={I18N.textById('Logarithmic Scaling')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.logScaling()}
      />
    );
  }

  renderSortOn(): React.Node {
    return (
      <SingleFieldSelectionControl
        controlKey="sortOn"
        fields={this.props.fields}
        label={I18N.textById('Sort by')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOn()}
      />
    );
  }

  renderSortOrder(): React.Node {
    return (
      <SortOrderControl
        buttonMinWidth={115}
        controlKey="sortOrder"
        includeAlphabetical={false}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder()}
      />
    );
  }

  renderRotateLabels(): React.Node {
    return (
      <CheckboxControl
        controlKey="rotateLabels"
        label={I18N.text('Rotate labels')}
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.rotateLabels()}
      />
    );
  }

  renderBandSettings(): React.Node {
    const { controls, seriesSettings } = this.props;
    const bands = controls.bands();
    const inAddMode = bands.length === 0 || !this.state.bandSectionCollapsed;
    return (
      <div className="line-graph-controls-block__band-settings-section">
        <div className="line-graph-controls-block__band-settings-title-block">
          <Heading
            className="line-graph-controls-block__band-settings-title"
            size={Heading.Sizes.SMALL}
          >
            {I18N.text('Colored Bands')}
          </Heading>
          <div
            className="line-graph-controls-block__band-settings-button"
            onClick={inAddMode ? this.onAddBand : this.onExpandBandSection}
            role="button"
          >
            {inAddMode && (
              <InfoTooltip
                iconType="plus-sign"
                text={I18N.text('Click to add colored bands')}
                tooltipPlacement="top"
              />
            )}
            {!inAddMode && (
              <InfoTooltip
                iconType="edit"
                text={I18N.text('Click to edit your colored bands')}
                tooltipPlacement="top"
              />
            )}
          </div>
        </div>
        {inAddMode && (
          <BandSettingsControl
            bands={bands}
            onBandSettingsChange={this.onBandSettingsChange}
            seriesSettings={seriesSettings}
          />
        )}
      </div>
    );
  }

  render(): React.Node {
    return (
      <React.Fragment>
        <Group.Vertical spacing="l">
          {this.renderSortOn()}
          {this.renderSortOrder()}
          {this.maybeRenderResultLimitDropdown()}
          {this.renderLogScalingControl()}
          {this.maybeRenderEthiopianDatesControl()}
          {this.renderRotateLabels()}
        </Group.Vertical>
        {this.renderBandSettings()}
      </React.Fragment>
    );
  }
}
