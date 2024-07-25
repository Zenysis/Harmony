// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Alert from 'components/ui/Alert';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import DataActionRulesDispatch, {
  dataActionRulesReducer,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import DataActionsContainer from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/DataActionsContainer';
import DragHandle from 'components/ui/DraggableItem/DragHandle';
import DraggableItemList from 'components/ui/DraggableItemList';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import SeriesRow from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/SeriesRow';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import { SERIES_SETTINGS_CONFIG } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/constants';
import {
  dataActionRulesToColorRuleTemplateHolder,
  colorRuleTemplateHoldersToDataActionRules,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { ColorRuleTemplateHolder } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';
import type { DataRuleDispatchAction } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import type { EnabledSeriesSettingsConfig } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/defaults';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SeriesRowEvents } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/SeriesRow';

const UNPIVOT_BARGRAPH_DISABLED_HEADERS = [
  'order',
  'color',
  'isVisible',
  'seriesLabel',
];
type Props = {
  ...SeriesRowEvents,
  enabledSettings: EnabledSeriesSettingsConfig,
  onDataActionsChange: (dataActions: Zen.Array<DataActionRule>) => void,
  onSeriesOrderChange: (seriesOrder: Zen.Array<string>) => void,
  queryResultSpec: QueryResultSpec,
  // NOTE: This is for allowing hide series toggle for map viz. The
  // series settings tab needs to know which field is currently selected so we
  // can disable the hide series toggle for that series row.
  selectedMapField?: string | void,

  settings: SeriesSettings,
  viewType: ResultViewType,
};

function SeriesSettingsTab({
  onDataActionsChange,
  onSeriesOrderChange,
  onSeriesSettingsGlobalChange,
  onSeriesSettingsLocalChange,
  enabledSettings,
  settings,
  selectedMapField = undefined,
  queryResultSpec,
  viewType,
}: Props) {
  // Get only the settings types that are enabled
  const enabledSettingConfigs = React.useMemo(
    () => SERIES_SETTINGS_CONFIG.filter(config => enabledSettings[config.type]),
    [enabledSettings],
  );

  const unPivotBarChart =
    viewType === 'BAR_GRAPH'
      ? queryResultSpec.getVisualizationControls(viewType).unPivot()
      : false;

  // NOTE: Create the initial rule templates when the component first
  // renders instead of creating it every time in the useState call.
  const initialRuleTemplates = React.useMemo(
    () => dataActionRulesToColorRuleTemplateHolder(settings.dataActionRules()),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [ruleTemplates, setRuleTemplates] = React.useState<
    Zen.Array<ColorRuleTemplateHolder>,
  >(initialRuleTemplates);

  const onDataActionRulesDispatch = React.useCallback(
    (action: DataRuleDispatchAction) => {
      const newRuleTemplates = dataActionRulesReducer(ruleTemplates, action);
      const newActionRules = colorRuleTemplateHoldersToDataActionRules(
        newRuleTemplates,
      );
      onDataActionsChange(newActionRules);
      setRuleTemplates(newRuleTemplates);
    },
    [onDataActionsChange, ruleTemplates],
  );

  const enabledSettingTypes = enabledSettingConfigs.map(s => s.type);
  const {
    dataActionRules,
    seriesObjects,
    seriesOrder,
  } = settings.modelValues();
  const numVisibleSeries = Object.keys(seriesObjects).reduce(
    (acc, key) => (seriesObjects[key].isVisible() ? acc + 1 : acc),
    0,
  );

  function renderSeriesRow(seriesId: string) {
    // Don't let users toggle visibility if it would make everything invisible
    const visibilityToggle = numVisibleSeries !== 1;
    // NOTE: If we are on the map viz, make sure the current series id
    // doesn't match the currently selected field from the general settings tab
    const mapVisibilityToggle =
      selectedMapField !== undefined
        ? seriesId !== selectedMapField
        : undefined;
    const allowVisibilityToggle =
      mapVisibilityToggle !== undefined
        ? visibilityToggle && mapVisibilityToggle
        : visibilityToggle;

    const headers = unPivotBarChart
      ? enabledSettingTypes.filter(
          type => !UNPIVOT_BARGRAPH_DISABLED_HEADERS.includes(type),
        )
      : enabledSettingTypes;

    return (
      <SeriesRow
        allowVisibilityToggle={allowVisibilityToggle}
        dataActionRules={dataActionRules}
        headers={headers}
        isLastRow={seriesId === seriesOrder[seriesOrder.length - 1]}
        onDataActionsChange={onDataActionsChange}
        onSeriesSettingsGlobalChange={onSeriesSettingsGlobalChange}
        onSeriesSettingsLocalChange={onSeriesSettingsLocalChange}
        series={seriesObjects[seriesId]}
      />
    );
  }

  function renderHeaderRow() {
    const newEnabledSettingConfigs = unPivotBarChart
      ? enabledSettingConfigs.filter(
          config => !UNPIVOT_BARGRAPH_DISABLED_HEADERS.includes(config.type),
        )
      : enabledSettingConfigs;
    const classNames = newEnabledSettingConfigs.map(
      setting =>
        `series-settings-tab-header-row__cell series-settings-tab-header-row__${setting.type}`,
    );

    const headerNames = newEnabledSettingConfigs.map((setting, i) => (
      <Group.Item key={setting.type} className={classNames[i]}>
        {setting.headerName}
      </Group.Item>
    ));
    return (
      <Group.Horizontal
        alignItems="center"
        className="series-settings-tab-header-row"
        flex
        spacing="xs"
      >
        {headerNames}
      </Group.Horizontal>
    );
  }

  function renderSettingsBlock() {
    const order =
      seriesOrder.length > 1 && unPivotBarChart
        ? [seriesOrder[0]]
        : seriesOrder;

    return (
      <div className="series-settings-tab__settings-table-container">
        {renderHeaderRow()}
        <DraggableItemList
          dragRestrictionSelector={DragHandle.DEFAULT_SELECTOR}
          items={Zen.Array.create<string>(order)}
          onItemOrderChanged={onSeriesOrderChange}
          renderItem={renderSeriesRow}
        />
      </div>
    );
  }

  return (
    <DataActionRulesDispatch.Provider value={onDataActionRulesDispatch}>
      <SettingsPage className="series-settings-tab">
        <Group.Vertical spacing="m">{renderSettingsBlock()}</Group.Vertical>
        {unPivotBarChart && (
          <Group.Vertical marginTop="l">
            <Alert
              intent="warning"
              title={I18N.text(
                'Note: Settings applied when bar chart is unpivoted are applied to all series',
              )}
            />
          </Group.Vertical>
        )}
        {enabledSettings.colorActions && (
          <DataActionsContainer ruleTemplates={ruleTemplates} />
        )}
      </SettingsPage>
    </DataActionRulesDispatch.Provider>
  );
}

export default (React.memo(SeriesSettingsTab): React.AbstractComponent<Props>);
