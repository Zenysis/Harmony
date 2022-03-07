// @flow
import * as React from 'react';

import ApplyToAllCheckbox from 'components/visualizations/Table/TableThemesSettingsTab/ThemeCustomizer/PerColumnThemeSection/PerColumnThemeControlsBlock/ApplyToAllCheckbox';
import ControlsGroup from 'components/visualizations/common/controls/ControlsGroup';
import Group from 'components/ui/Group';
import LabelWrapper from 'components/ui/LabelWrapper';
import type {
  PerColumnTheme,
  Theme,
} from 'models/visualizations/Table/TableSettings/TableTheme/types';
import type {
  TableColumn,
  ThemeControlsProps,
} from 'components/visualizations/Table/TableThemesSettingsTab/types';

type Props<T: Theme> = {
  checkboxLabel: string,
  columns: $ReadOnlyArray<TableColumn>,
  label: string,
  onThemeChange: (PerColumnTheme<T>) => void,
  theme: PerColumnTheme<T>,
  ThemeControlsComponent: React.ComponentType<ThemeControlsProps<T>>,
};

export default function PerColumnThemeControlsBlock<T: Theme>({
  checkboxLabel,
  columns,
  label,
  onThemeChange,
  theme,
  ThemeControlsComponent,
}: Props<T>): React.Node {
  const renderControls = () => {
    if (!theme.isPerColumn) {
      return (
        <ThemeControlsComponent
          onThemeChange={(newTheme: T) =>
            onThemeChange({
              isPerColumn: false,
              value: newTheme,
            })
          }
          theme={theme.value}
        />
      );
    }

    return columns.map(column => (
      <ThemeControlsComponent
        key={column.id}
        header={column.displayName}
        onThemeChange={(newTheme: T) =>
          onThemeChange({
            isPerColumn: true,
            map: theme.map.set(column.id, newTheme),
          })
        }
        theme={theme.map.forceGet(column.id)}
      />
    ));
  };

  return (
    <LabelWrapper
      labelClassName="table-themes-settings-tab__controls-block-label"
      label={label}
    >
      <ControlsGroup>
        <Group.Vertical spacing="l">
          <ApplyToAllCheckbox
            columns={columns}
            label={checkboxLabel}
            onThemeChange={onThemeChange}
            theme={theme}
          />
          {renderControls()}
        </Group.Vertical>
      </ControlsGroup>
    </LabelWrapper>
  );
}
