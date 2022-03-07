// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import PerColumnThemeControlsBlock from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/PerColumnThemeSection/PerColumnThemeControlsBlock';
import type {
  PerColumnTheme,
  Theme,
} from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type {
  TableColumn,
  ThemeControlsProps,
} from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props<T: Theme> = {
  fieldsTheme: PerColumnTheme<T>,
  groupByColumns: $ReadOnlyArray<TableColumn>,
  groupingsTheme: PerColumnTheme<T>,
  onFieldsThemeChange: (PerColumnTheme<T>) => void,
  onGroupingsThemeChange: (PerColumnTheme<T>) => void,
  seriesColumns: $ReadOnlyArray<TableColumn>,
  ThemeControlsComponent: React.ComponentType<ThemeControlsProps<T>>,
};

export default function PerColumnThemeSection<T: Theme>({
  fieldsTheme,
  groupByColumns,
  groupingsTheme,
  onFieldsThemeChange,
  onGroupingsThemeChange,
  seriesColumns,
  ThemeControlsComponent,
}: Props<T>): React.Node {
  const hasGroupings = groupByColumns.length > 0;

  return (
    <Group.Vertical spacing="xl">
      {hasGroupings && (
        <PerColumnThemeControlsBlock
          checkboxLabel={I18N.text('Apply to all group bys')}
          label={I18N.text('Group bys')}
          columns={groupByColumns}
          onThemeChange={onGroupingsThemeChange}
          theme={groupingsTheme}
          ThemeControlsComponent={ThemeControlsComponent}
        />
      )}
      <PerColumnThemeControlsBlock
        checkboxLabel={I18N.text('Apply to all indicators')}
        label={I18N.text('Indicators')}
        columns={seriesColumns}
        onThemeChange={onFieldsThemeChange}
        theme={fieldsTheme}
        ThemeControlsComponent={ThemeControlsComponent}
      />
    </Group.Vertical>
  );
}
