// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import AxesSettingsTab from 'components/visualizations/common/SettingsModal/AxesSettingsTab';
import ControlsBlock from 'components/visualizations/common/SettingsModal/ControlsBlock';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import GeneralSettingsTab from 'components/visualizations/common/SettingsModal/GeneralSettingsTab';
import LegendSettingsTab from 'components/visualizations/common/SettingsModal/LegendSettingsTab';
import QuerySelections from 'models/core/wip/QuerySelections';
import SeriesSettingsTab from 'components/visualizations/common/SettingsModal/SeriesSettingsTab';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import TableThemesSettingsTab from 'components/visualizations/Table/TableThemesSettingsTab';
import VisualizationSettings from 'models/core/QueryResultSpec/VisualizationSettings';
import { CUSTOM_THEME_ID } from 'components/visualizations/Table/TableThemesSettingsTab/constants';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/viewTypes';
import { autobind } from 'decorators';
import { getGeneralSettingsOptions } from 'components/visualizations/common/SettingsModal/GeneralSettingsTab/defaults';
import { getSeriesSettingsOptions } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/defaults';
import type MapSettings from 'models/visualizations/MapViz/MapSettings';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type TableTheme from 'models/visualizations/Table/TableSettings/TableTheme';
import type { AxisType } from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

const TEXT = t('visualizations.common.SettingsModal');

type DefaultProps = {
  className: string,
};

type Props = {
  ...DefaultProps,
  onQueryResultSpecChange: QueryResultSpec => void,
  onRequestClose: (SyntheticEvent<>) => void,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  show: boolean,
  viewType: ResultViewType,
};

type State = {
  fullScreen: boolean,
  selectedTabName: string,
};

const TAB_TOOLTIPS = {
  [TEXT.tabs.axes]: TEXT.tabs.axesHelpText,
  [TEXT.tabs.legend]: TEXT.tabs.legendHelpText,
  [TEXT.tabs.general]: TEXT.tabs.generalHelpText,
  [TEXT.tabs.series]: TEXT.tabs.seriesHelpText,
};

// TODO(stephen): This logic is duplicated inside QueryResult. Refactor how
// mobile detection is performed across the platform. Seems like a React context
// would be useful.
const MOBILE_WIDTH_THRESHOLD = 800;

export default class SettingsModal extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    className: '',
  };

  state: State = {
    fullScreen: window.innerWidth < MOBILE_WIDTH_THRESHOLD,
    selectedTabName: TEXT.tabs.general,
  };

  getTabTooltip(): string {
    // TODO(david): Add a tooltip for the themes tab.
    return TAB_TOOLTIPS[this.state.selectedTabName];
  }

  getVisualizationSettings(): VisualizationSettings {
    const { queryResultSpec, viewType } = this.props;
    return queryResultSpec.visualizationSettings()[viewType];
  }

  @autobind
  onTabChange(selectedTabName: string) {
    this.setState({ selectedTabName });
  }

  // Changing global settings: title/subtitle and their font sizes
  @autobind
  onTitleSettingsChange(settingType: string, value: any) {
    const { queryResultSpec } = this.props;
    const newSpec = queryResultSpec.updateTitleSettingValue(settingType, value);
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'title',
      settingType,
      value,
    });
  }

  // Handle change in axis settings from the AxesSettingsTab in SettingsModal
  @autobind
  onAxisSettingsChange(axisType: AxisType, settingType: string, value: any) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateAxisValue(
      viewType,
      axisType,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'axis',
      axisType,
      settingType,
      value,
    });
  }

  // Handle change from the SeriesSettingsTab in SettingsModal
  // This change should affect all visualizations globally
  @autobind
  onSeriesSettingsGlobalChange<K: Zen.SettableValueKeys<QueryResultSeries>>(
    seriesId: string,
    settingType: K,
    value: Zen.SettableValueType<QueryResultSeries, K>,
  ) {
    const { queryResultSpec } = this.props;
    const newSpec = queryResultSpec.updateGlobalSeriesObjectValue(
      seriesId,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'seriesGlobal',
      seriesId,
      settingType,
    });
  }

  // Handle change from the SeriesSettingsTab in SettingsModal
  // This event handler is visualization-specific, so it will only change
  // settings (like color, data label font sizes, etc.) for the current viewType
  @autobind
  onSeriesSettingsLocalChange<K: Zen.SettableValueKeys<QueryResultSeries>>(
    seriesId: string,
    settingType: K,
    value: Zen.SettableValueType<QueryResultSeries, K>,
  ) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateSeriesObjectValue(
      viewType,
      seriesId,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'seriesLocal',
      seriesId,
      settingType,
    });
  }

  // Handle change from the SeriesSettingsTab in SettingsModal
  // This event handler is visualization-specific, so it will only change the
  // order of the series objects for the current viewType
  @autobind
  onSeriesOrderChange(newSeriesOrder: Zen.Array<string>) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateSeriesOrder(
      viewType,
      newSeriesOrder.arrayView(),
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'seriesOrder',
      type: 'order',
    });
  }

  // Handle change from the SeriesSettingsTab in SettingsModal
  // This event handler is visualization-specific, so it will only change the
  // data actions objects for the current viewType
  @autobind
  onDataActionsChange(dataActionRules: Zen.Array<DataActionRule>) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateDataActionRules(
      viewType,
      dataActionRules,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'seriesLocal',
      type: 'dataActions',
    });
  }

  @autobind
  onLegendSettingsChange(settingType: string, value: any) {
    const { queryResultSpec, viewType } = this.props;
    const newSpec = queryResultSpec.updateLegendSettingValue(
      viewType,
      settingType,
      value,
    );
    this.props.onQueryResultSpecChange(newSpec);

    analytics.track('Chart setting change', {
      panel: 'legend',
      type: settingType,
      value,
    });
  }

  @autobind
  onActiveTableThemeChange(themeId: string) {
    const { queryResultSpec } = this.props;

    const newQueryResultSpec = queryResultSpec.updateVisualizationControlValue(
      RESULT_VIEW_TYPES.TABLE,
      'activeTheme',
      themeId,
    );

    this.props.onQueryResultSpecChange(newQueryResultSpec);

    // TODO(david): Add analytics tracking here for table theme changes.
  }

  @autobind
  onCustomTableThemeSelectAndUpdate(theme: TableTheme) {
    const { queryResultSpec } = this.props;

    const newQueryResultSpec = queryResultSpec
      .updateVisualizationControlValue(
        RESULT_VIEW_TYPES.TABLE,
        'customTheme',
        theme,
      )
      .updateVisualizationControlValue(
        RESULT_VIEW_TYPES.TABLE,
        'activeTheme',
        CUSTOM_THEME_ID,
      );

    this.props.onQueryResultSpecChange(newQueryResultSpec);

    // TODO(david): Add analytics tracking here for table theme changes.
  }

  maybeRenderAxesTab(): React.Element<typeof Tab> | null {
    const visualizationSettings = this.getVisualizationSettings();
    const axesSettings = visualizationSettings.axesSettings();
    const seriesSettings = visualizationSettings.seriesSettings();

    if (!axesSettings) {
      return null;
    }
    const { y1AxisSeries, y2AxisSeries } = seriesSettings.getSeriesByAxes();
    return (
      <Tab testId="zen-settings-modal-axes-tab" name={TEXT.tabs.axes}>
        <AxesSettingsTab
          onAxisSettingsChange={this.onAxisSettingsChange}
          settings={axesSettings}
          y1AxisEnabled={y1AxisSeries.length > 0}
          y2AxisEnabled={y2AxisSeries.length > 0}
        />
      </Tab>
    );
  }

  maybeRenderLegendTab(): React.Element<typeof Tab> | null {
    // TODO(david): Migrate legend settings into new themes tab for table viz
    // only.
    const legendSettings = this.getVisualizationSettings().legendSettings();
    if (!legendSettings) {
      return null;
    }

    return (
      <Tab name={TEXT.tabs.legend}>
        <LegendSettingsTab
          onLegendSettingsChange={this.onLegendSettingsChange}
          settings={legendSettings}
        />
      </Tab>
    );
  }

  maybeRenderTableThemesSettingsTab(): React.Element<typeof Tab> | null {
    const { queryResultSpec, viewType, querySelections } = this.props;
    const showTotalThemeControls = querySelections.isRequestingTotalRow();

    if (viewType !== RESULT_VIEW_TYPES.TABLE) {
      return null;
    }

    // TODO(david): Work out if there is a way to make sure that this is the
    // same order as in the table
    const groupByColumns = queryResultSpec
      .groupBySettings()
      .groupings()
      .values()
      // HACK(david): 'nation' is not real grouping dimension so cannot have any
      // grouping specific settings applied to it.
      .filter(grouping => grouping.id() !== 'nation')
      .map(grouping => ({
        id: grouping.id(),
        displayName: grouping.displayLabel(),
      }));

    const seriesSettings = this.getVisualizationSettings().seriesSettings();

    const seriesColumns = seriesSettings.seriesOrder().map(seriesId => ({
      id: seriesId,
      displayName: seriesSettings.seriesObjects()[seriesId].label(),
    }));

    const vizControls = queryResultSpec.getVisualizationControls(
      RESULT_VIEW_TYPES.TABLE,
    );

    const activeTheme = vizControls.activeTheme();
    const customTheme = vizControls.customTheme();

    return (
      <Tab
        className="table-themes-settings-tab"
        containerType="no padding"
        name={TEXT.TableThemesSettingsTab.title}
      >
        <TableThemesSettingsTab
          groupByColumns={groupByColumns}
          activeThemeId={activeTheme}
          onActiveThemeChange={this.onActiveTableThemeChange}
          onCustomThemeSelectAndUpdate={this.onCustomTableThemeSelectAndUpdate}
          seriesColumns={seriesColumns}
          customTheme={customTheme}
          showTotalThemeControls={showTotalThemeControls}
        />
      </Tab>
    );
  }

  renderGeneralTab(): React.Element<typeof Tab> {
    const {
      queryResultSpec,
      querySelections,
      viewType,
      onQueryResultSpecChange,
    } = this.props;

    const controlsBlock = (
      <ControlsBlock
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        viewType={viewType}
        onQueryResultSpecChange={onQueryResultSpecChange}
      />
    );

    return (
      <Tab name={TEXT.tabs.general}>
        <GeneralSettingsTab
          controlsBlock={controlsBlock}
          enabledSettings={getGeneralSettingsOptions(viewType)}
          onTitleSettingsChange={this.onTitleSettingsChange}
          titleSettings={this.props.queryResultSpec.titleSettings()}
        />
      </Tab>
    );
  }

  renderSeriesTab(): React.Element<typeof Tab> {
    const { queryResultSpec, viewType } = this.props;
    const seriesSettings = this.getVisualizationSettings().seriesSettings();
    const seriesSettingsOptions = getSeriesSettingsOptions(viewType);
    // HACK(yitian): This is for allowing hide series toggle for map viz. The
    // series settings tab needs to know which field is currently selected so we
    // can disable the hide series toggle for that series row.
    const selectedMapField =
      viewType === RESULT_VIEW_TYPES.MAP
        ? ((queryResultSpec.getVisualizationControls(
            'MAP',
          ): $Cast): MapSettings).selectedField()
        : undefined;
    return (
      <Tab name={TEXT.tabs.series}>
        <SeriesSettingsTab
          settings={seriesSettings}
          onSeriesOrderChange={this.onSeriesOrderChange}
          onSeriesSettingsGlobalChange={this.onSeriesSettingsGlobalChange}
          onSeriesSettingsLocalChange={this.onSeriesSettingsLocalChange}
          onDataActionsChange={this.onDataActionsChange}
          enabledSettings={seriesSettingsOptions}
          selectedMapField={selectedMapField}
        />
      </Tab>
    );
  }

  render(): React.Node {
    const { className, show, onRequestClose } = this.props;
    return (
      <TabbedModal
        className={`settings-modal ${className}`}
        closeButtonText={TEXT.close}
        fullScreen={this.state.fullScreen}
        show={show}
        showPrimaryButton={false}
        onRequestClose={onRequestClose}
        title={TEXT.title}
        titleTooltip={this.getTabTooltip()}
        onTabChange={this.onTabChange}
        maxWidth={790}
      >
        {this.renderGeneralTab()}
        {this.maybeRenderTableThemesSettingsTab()}
        {this.maybeRenderAxesTab()}
        {this.renderSeriesTab()}
        {this.maybeRenderLegendTab()}
      </TabbedModal>
    );
  }
}
