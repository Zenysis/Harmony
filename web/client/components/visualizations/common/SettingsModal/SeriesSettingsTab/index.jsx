// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import DataActionRulesDispatch, {
  dataActionRulesReducer,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import DataActionsContainer from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/DataActionsContainer';
import DragHandle from 'components/ui/DraggableItem/DragHandle';
import DraggableItemList from 'components/ui/DraggableItemList';
import Group from 'components/ui/Group';
import SeriesRow from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/SeriesRow';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import { SERIES_SETTINGS_CONFIG } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/constants';
import {
  dataActionRulesToColorRuleTemplateHolder,
  colorRuleTemplateHoldersToDataActionRules,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/util/util';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { ColorRuleTemplateHolder } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/types';
import type { DataRuleDispatchAction } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/ColorRulesContainer/DataActionRulesDispatch';
import type { EnabledSeriesSettingsConfig } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/defaults';
import type { SeriesRowEvents } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/SeriesRow';

type Props = {
  ...SeriesRowEvents,
  enabledSettings: EnabledSeriesSettingsConfig,
  onSeriesOrderChange: (seriesOrder: Zen.Array<string>) => void,
  onDataActionsChange: (dataActions: Zen.Array<DataActionRule>) => void,
  settings: SeriesSettings,

  // HACK(yitian): This is for allowing hide series toggle for map viz. The
  // series settings tab needs to know which field is currently selected so we
  // can disable the hide series toggle for that series row.
  selectedMapField?: string | void,
};

function SeriesSettingsTab({
  onDataActionsChange,
  onSeriesOrderChange,
  onSeriesSettingsGlobalChange,
  onSeriesSettingsLocalChange,
  enabledSettings,
  settings,
  selectedMapField = undefined,
}: Props) {
  // Get only the settings types that are enabled
  const enabledSettingConfigs = React.useMemo(
    () => SERIES_SETTINGS_CONFIG.filter(config => enabledSettings[config.type]),
    [enabledSettings],
  );

  const [ruleTemplates, setRuleTemplates] = React.useState<
    Zen.Array<ColorRuleTemplateHolder>,
  >(dataActionRulesToColorRuleTemplateHolder(settings.dataActionRules()));

  React.useEffect(() => {
    const newActionRules = colorRuleTemplateHoldersToDataActionRules(
      ruleTemplates,
    );
    onDataActionsChange(newActionRules);
  }, [ruleTemplates, onDataActionsChange]);

  const onDataActionRulesDispatch = (action: DataRuleDispatchAction) => {
    setRuleTemplates(dataActionRulesReducer(ruleTemplates, action));
  };

  const enabledSettingTypes = enabledSettingConfigs.map(s => s.type);
  const {
    seriesOrder,
    seriesObjects,
    dataActionRules,
  } = settings.modelValues();
  const numVisibleSeries = Object.keys(seriesObjects).reduce(
    (acc, key) => (seriesObjects[key].isVisible() ? acc + 1 : acc),
    0,
  );

  function renderSeriesRow(seriesId: string) {
    // Don't let users toggle visibility if it would make everything invisible
    const visibilityToggle = numVisibleSeries !== 1;
    // HACK(yitian): If we are on the map viz, make sure the current series id
    // doesn't match the currently selected field from the general settings tab
    const mapVisibilityToggle =
      selectedMapField !== undefined
        ? seriesId !== selectedMapField
        : undefined;
    const allowVisibilityToggle =
      mapVisibilityToggle !== undefined
        ? visibilityToggle && mapVisibilityToggle
        : visibilityToggle;

    return (
      <SeriesRow
        dataActionRules={dataActionRules}
        series={seriesObjects[seriesId]}
        headers={enabledSettingTypes}
        isLastRow={seriesId === seriesOrder[seriesOrder.length - 1]}
        allowVisibilityToggle={allowVisibilityToggle}
        onSeriesSettingsLocalChange={onSeriesSettingsLocalChange}
        onSeriesSettingsGlobalChange={onSeriesSettingsGlobalChange}
        onDataActionsChange={onDataActionsChange}
      />
    );
  }

  function renderHeaderRow() {
    const classNames = enabledSettingConfigs.map(
      setting =>
        `series-settings-tab-header-row__cell series-settings-tab-header-row__${setting.type}`,
    );

    const headerNames = enabledSettingConfigs.map((setting, i) => (
      <Group.Item key={setting.type} className={classNames[i]}>
        {setting.headerName}
      </Group.Item>
    ));
    return (
      <Group.Horizontal
        flex
        alignItems="center"
        className="series-settings-tab-header-row"
        spacing="xs"
      >
        {headerNames}
      </Group.Horizontal>
    );
  }

  const settingsBlock = (
    <div className="series-settings-tab__settings-table-container">
      {renderHeaderRow()}
      <DraggableItemList
        dragRestrictionSelector={DragHandle.DEFAULT_SELECTOR}
        items={Zen.Array.create<string>(seriesOrder)}
        onItemOrderChanged={onSeriesOrderChange}
        renderItem={renderSeriesRow}
      />
    </div>
  );

  return (
    <DataActionRulesDispatch.Provider value={onDataActionRulesDispatch}>
      <SettingsPage className="series-settings-tab">
        <Group.Vertical spacing="m">{settingsBlock}</Group.Vertical>
        {enabledSettings.colorActions && (
          <DataActionsContainer ruleTemplates={ruleTemplates} />
        )}
      </SettingsPage>
    </DataActionRulesDispatch.Provider>
  );
}

export default (React.memo(SeriesSettingsTab): React.AbstractComponent<Props>);
