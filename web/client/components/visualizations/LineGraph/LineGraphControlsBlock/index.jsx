// @flow
import * as React from 'react';

import BandSettingsControl from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl';
import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
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

const TXT_CONTROLS = t('query_result.controls');
const TXT_ROTATE_LABELS = t('query_result.time.rotate_labels');
const RESULT_LIMIT_OPTIONS = [1, 5, 10, 20, 50, 100];

const TEXT = {
  addBandTooltip: 'Click to add colored bands',
  bandSettingsTitle: 'Colored Bands',
  editBandTooltip: 'Click to edit your colored bands',
};

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
        value={this.props.controls.useEthiopianDates()}
        onValueChange={this.props.onControlsSettingsChange}
        label={TXT_CONTROLS.et_checkbox}
      />
    );
  }

  maybeRenderResultLimitDropdown(): React.Node {
    const { controls, onControlsSettingsChange, groupBySettings } = this.props;
    
    if (groupBySettings.hasOnlyDateGrouping()) {
      return null
    }
    
    return (
      <ResultLimitControl
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        value={controls.resultLimit()}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        buttonMinWidth={115}
      />
    );
    
  }

  renderLogScalingControl(): React.Node {
    return (
      <CheckboxControl
        controlKey="logScaling"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.logScaling()}
        label={TXT_CONTROLS.log_checkbox}
      />
    );
  }

  renderSortOn(): React.Node {
    return (
      <SingleFieldSelectionControl
        controlKey="sortOn"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOn()}
        label={TXT_CONTROLS.sort_on}
        fields={this.props.fields}
      />
    );
  }

  renderSortOrder(): React.Node {
    return (
      <SortOrderControl
        controlKey="sortOrder"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.sortOrder()}
        includeAlphabetical={false}
        buttonMinWidth={115}
      />
    );
  }

  renderRotateLabels(): React.Node {
    return (
      <CheckboxControl
        controlKey="rotateLabels"
        onValueChange={this.props.onControlsSettingsChange}
        value={this.props.controls.rotateLabels()}
        label={TXT_ROTATE_LABELS}
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
            {TEXT.bandSettingsTitle}
          </Heading>
          <div
            className="line-graph-controls-block__band-settings-button"
            onClick={inAddMode ? this.onAddBand : this.onExpandBandSection}
            role="button"
          >
            {inAddMode && (
              <InfoTooltip
                iconType="plus-sign"
                text={TEXT.addBandTooltip}
                tooltipPlacement="top"
              />
            )}
            {!inAddMode && (
              <InfoTooltip
                iconType="edit"
                text={TEXT.editBandTooltip}
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
