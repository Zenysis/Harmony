// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Checkbox from 'components/ui/Checkbox';
import type {
  PerColumnTheme,
  Theme,
} from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type { TableColumn } from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props<T: Theme> = {
  columns: $ReadOnlyArray<TableColumn>,
  label: string,
  onThemeChange: (PerColumnTheme<T>) => void,
  theme: PerColumnTheme<T>,
};

function convertThemeToBePerColumn<T: Theme>(
  theme: T,
  columns: $ReadOnlyArray<TableColumn>,
): Zen.Map<T> {
  const objMap = {};

  columns.forEach(column => {
    objMap[column.id] = theme.clone();
  });

  return Zen.Map.create(objMap);
}

export default function ApplyToAllCheckbox<T: Theme>({
  columns,
  label,
  onThemeChange,
  theme,
}: Props<T>): React.Node {
  const onApplyToAllCheckBoxToggle = (isChecked: boolean) => {
    if (isChecked && theme.isPerColumn) {
      return onThemeChange({
        isPerColumn: false,
        value: theme.map.forceGet(columns[0].id),
      });
    }

    if (!isChecked && !theme.isPerColumn) {
      return onThemeChange({
        isPerColumn: true,
        map: convertThemeToBePerColumn(theme.value, columns),
      });
    }

    const themeType = theme instanceof Zen.Map ? 'ZenMap' : typeof theme;
    throw new Error(
      `Unreachable code. 'isChecked' cannot be ${String(
        isChecked,
      )} when theme is of type ${themeType}`,
    );
  };

  const applyToAll = !theme.isPerColumn;

  return (
    <Checkbox
      label={label}
      onChange={onApplyToAllCheckBoxToggle}
      value={applyToAll}
    />
  );
}
