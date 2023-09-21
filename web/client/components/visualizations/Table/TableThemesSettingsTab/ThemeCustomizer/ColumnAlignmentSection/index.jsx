// @flow
import * as React from 'react';

import ColumnAlignmentControls from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/ColumnAlignmentSection/ColumnAlignmentControls';
import PerColumnThemeSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/PerColumnThemeSection';
import type ColumnTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/ColumnTheme';
import type { PerColumnTheme } from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type { TableColumn } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = {
  fieldsColumnTheme: PerColumnTheme<ColumnTheme>,
  groupByColumns: $ReadOnlyArray<TableColumn>,
  groupingsColumnTheme: PerColumnTheme<ColumnTheme>,
  onFieldsColumnThemeChange: (PerColumnTheme<ColumnTheme>) => void,
  onGroupingsColumnThemeChange: (PerColumnTheme<ColumnTheme>) => void,
  seriesColumns: $ReadOnlyArray<TableColumn>,
};

function ColumnAlignmentSection({
  fieldsColumnTheme,
  groupByColumns,
  groupingsColumnTheme,
  onFieldsColumnThemeChange,
  onGroupingsColumnThemeChange,
  seriesColumns,
}: Props): React.Node {
  return (
    <PerColumnThemeSection
      fieldsTheme={fieldsColumnTheme}
      groupByColumns={groupByColumns}
      groupingsTheme={groupingsColumnTheme}
      onFieldsThemeChange={onFieldsColumnThemeChange}
      onGroupingsThemeChange={onGroupingsColumnThemeChange}
      seriesColumns={seriesColumns}
      ThemeControlsComponent={ColumnAlignmentControls}
    />
  );
}

export default (React.memo<Props>(
  ColumnAlignmentSection,
): React.AbstractComponent<Props>);
