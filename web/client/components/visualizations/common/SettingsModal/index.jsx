// @flow
import * as React from 'react';

import AxesSettingsTab from 'components/visualizations/common/SettingsModal/AxesSettingsTab';
import GeneralSettingsTab from 'components/visualizations/common/SettingsModal/GeneralSettingsTab';
import LegendSettingsTab from 'components/visualizations/common/SettingsModal/LegendSettingsTab';
import SeriesSettingsTab from 'components/visualizations/common/SettingsModal/SeriesSettingsTab';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import TitleSettings from 'models/core/QueryResultSpec/TitleSettings';
import VisualizationSettings from 'models/core/QueryResultSpec/VisualizationSettings';
import autobind from 'decorators/autobind';
import { getAxesSettingsOptions } from 'components/visualizations/common/SettingsModal/AxesSettingsTab/defaults';
import { getSeriesSettingsOptions } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/defaults';
import { pick } from 'util/util';
import type { AxesSettingsEvents } from 'components/visualizations/common/SettingsModal/AxesSettingsTab';
import type { GeneralSettingsEvents } from 'components/visualizations/common/SettingsModal/GeneralSettingsTab';
import type { LegendSettingsEvents } from 'components/visualizations/common/SettingsModal/LegendSettingsTab';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SeriesSettingsEvents } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab';

const TEXT = t('visualizations.common.SettingsModal');

type SettingsModalEvents = AxesSettingsEvents &
  GeneralSettingsEvents &
  SeriesSettingsEvents &
  LegendSettingsEvents;

type Props = SettingsModalEvents & {
  onRequestClose: (SyntheticEvent<>) => void,
  show: boolean,
  titleSettings: TitleSettings,
  viewType: ResultViewType,
  visualizationSettings: VisualizationSettings,

  displayAdvancedSettings: boolean,
  className: string,
  controlsBlock: React.Element<any>,
  fullScreen: boolean,
};

type State = {
  selectedTabName: string,
};

const TAB_TOOLTIPS = {
  [TEXT.tabs.axes]: TEXT.tabs.axesHelpText,
  [TEXT.tabs.legend]: TEXT.tabs.legendHelpText,
  [TEXT.tabs.general]: TEXT.tabs.generalHelpText,
  [TEXT.tabs.series]: TEXT.tabs.seriesHelpText,
};

export default class SettingsModal extends React.PureComponent<Props, State> {
  // TODO(pablo): remove the need for this by using Context
  static eventNames: Array<$Keys<SettingsModalEvents>> = [
    ...AxesSettingsTab.eventNames,
    ...GeneralSettingsTab.eventNames,
    ...LegendSettingsTab.eventNames,
    ...SeriesSettingsTab.eventNames,
  ];

  static defaultProps = {
    className: '',
    controlsBlock: null,
    fullScreen: false,
    displayAdvancedSettings: false,
  };

  state = {
    selectedTabName: TEXT.tabs.general,
  };

  getTabTooltip() {
    return TAB_TOOLTIPS[this.state.selectedTabName];
  }

  @autobind
  onTabChange(selectedTabName: string) {
    this.setState({ selectedTabName });
  }

  maybeRenderAxesTab() {
    const { visualizationSettings, viewType } = this.props;
    const axesSettings = visualizationSettings.axesSettings();
    const seriesSettings = visualizationSettings.seriesSettings();

    if (!axesSettings) {
      return null;
    }
    const axesSettingsOptions = getAxesSettingsOptions(viewType);
    const events = pick(this.props, AxesSettingsTab.eventNames);
    const { y1AxisSeries, y2AxisSeries } = seriesSettings.getSeriesByAxes();
    return (
      <Tab testId="zen-settings-modal-axes-tab" name={TEXT.tabs.axes}>
        <AxesSettingsTab
          settings={axesSettings}
          y1AxisEnabled={y1AxisSeries.length > 0}
          y2AxisEnabled={y2AxisSeries.length > 0}
          {...events}
          {...axesSettingsOptions}
        />
      </Tab>
    );
  }

  maybeRenderLegendTab() {
    const legendSettings = this.props.visualizationSettings.legendSettings();
    if (!legendSettings) {
      return null;
    }

    const events = pick(this.props, LegendSettingsTab.eventNames);
    return (
      <Tab name={TEXT.tabs.legend}>
        <LegendSettingsTab settings={legendSettings} {...events} />
      </Tab>
    );
  }

  renderGeneralTab() {
    const events = pick(this.props, GeneralSettingsTab.eventNames);
    return (
      <Tab name={TEXT.tabs.general}>
        <GeneralSettingsTab
          controlsBlock={this.props.controlsBlock}
          titleSettings={this.props.titleSettings}
          {...events}
        />
      </Tab>
    );
  }

  renderSeriesTab() {
    const {
      displayAdvancedSettings,
      visualizationSettings,
      viewType,
    } = this.props;
    const seriesSettings = visualizationSettings.seriesSettings();
    const events = pick(this.props, SeriesSettingsTab.eventNames);
    const seriesSettingsOptions = getSeriesSettingsOptions(viewType, {
      displayAdvancedSettings,
    });
    return (
      <Tab name={TEXT.tabs.series}>
        <SeriesSettingsTab
          settings={seriesSettings}
          {...events}
          {...seriesSettingsOptions}
        />
      </Tab>
    );
  }

  render() {
    const { className, fullScreen, show, onRequestClose } = this.props;
    const width = 700;
    return (
      <TabbedModal
        className={`settings-modal ${className}`}
        closeButtonText={TEXT.close}
        fullScreen={fullScreen}
        show={show}
        showPrimaryButton={false}
        onRequestClose={onRequestClose}
        defaultHeight="80%"
        width={width}
        title={TEXT.title}
        titleTooltip={this.getTabTooltip()}
        onTabChange={this.onTabChange}
      >
        {this.renderGeneralTab()}
        {this.maybeRenderAxesTab()}
        {this.renderSeriesTab()}
        {this.maybeRenderLegendTab()}
      </TabbedModal>
    );
  }
}
