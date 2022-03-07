// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import HeaderColumnwiseThemeControls from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/HeaderSection/HeaderColumnwiseThemeControls';
import HeaderGeneralThemeControls from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/HeaderSection/HeaderGeneralThemeControls';
import PerColumnThemeSection from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/PerColumnThemeSection';
import type HeaderColumnwiseTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderColumnwiseTheme';
import type HeaderGeneralTheme from 'models/visualizations/Table/TableSettings/TableTheme/subThemes/HeaderGeneralTheme';
import type { PerColumnTheme } from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type { TableColumn } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props = {
  fieldsHeaderTheme: PerColumnTheme<HeaderColumnwiseTheme>,
  groupByColumns: $ReadOnlyArray<TableColumn>,
  groupingsHeaderTheme: PerColumnTheme<HeaderColumnwiseTheme>,
  onFieldsHeaderThemeChange: (PerColumnTheme<HeaderColumnwiseTheme>) => void,
  onGroupingsHeaderThemeChange: (PerColumnTheme<HeaderColumnwiseTheme>) => void,
  seriesColumns: $ReadOnlyArray<TableColumn>,
  onHeaderGeneralThemeChange: HeaderGeneralTheme => void,
  headerGeneralTheme: HeaderGeneralTheme,
};

function HeaderSection({
  fieldsHeaderTheme,
  groupByColumns,
  groupingsHeaderTheme,
  headerGeneralTheme,
  onFieldsHeaderThemeChange,
  onGroupingsHeaderThemeChange,
  onHeaderGeneralThemeChange,
  seriesColumns,
}: Props): React.Node {
  return (
    <Group.Vertical spacing="xl">
      <PerColumnThemeSection
        fieldsTheme={fieldsHeaderTheme}
        groupByColumns={groupByColumns}
        groupingsTheme={groupingsHeaderTheme}
        onFieldsThemeChange={onFieldsHeaderThemeChange}
        onGroupingsThemeChange={onGroupingsHeaderThemeChange}
        seriesColumns={seriesColumns}
        ThemeControlsComponent={HeaderColumnwiseThemeControls}
      />
      <HeaderGeneralThemeControls
        theme={headerGeneralTheme}
        onThemeChange={onHeaderGeneralThemeChange}
      />
    </Group.Vertical>
  );
}

export default (React.memo<Props>(
  HeaderSection,
): React.AbstractComponent<Props>);
