// @flow
import * as React from 'react';

import PerColumnThemeSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/PerColumnThemeSection';
import WorksheetThemeControls from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/WorksheetSection/WorksheetThemeControls';
import type WorksheetTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/WorksheetTheme';
import type { PerColumnTheme } from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type { TableColumn } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = {
  fieldsWorksheetTheme: PerColumnTheme<WorksheetTheme>,
  groupByColumns: $ReadOnlyArray<TableColumn>,
  groupingsWorksheetTheme: PerColumnTheme<WorksheetTheme>,
  onFieldsWorksheetThemeChange: (PerColumnTheme<WorksheetTheme>) => void,
  onGroupingsWorksheetThemeChange: (PerColumnTheme<WorksheetTheme>) => void,
  seriesColumns: $ReadOnlyArray<TableColumn>,
};

function WorksheetSection({
  fieldsWorksheetTheme,
  groupByColumns,
  groupingsWorksheetTheme,
  onFieldsWorksheetThemeChange,
  onGroupingsWorksheetThemeChange,
  seriesColumns,
}: Props): React.Node {
  return (
    <PerColumnThemeSection
      fieldsTheme={fieldsWorksheetTheme}
      groupByColumns={groupByColumns}
      groupingsTheme={groupingsWorksheetTheme}
      onFieldsThemeChange={onFieldsWorksheetThemeChange}
      onGroupingsThemeChange={onGroupingsWorksheetThemeChange}
      seriesColumns={seriesColumns}
      ThemeControlsComponent={WorksheetThemeControls}
    />
  );
}

export default (React.memo<Props>(
  WorksheetSection,
): React.AbstractComponent<Props>);
