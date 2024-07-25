// @flow
import type { Theme } from 'models/visualizations/Table/TableSettings/TableTheme/types';

export type ThemeControlsProps<T: Theme> = {
  header?: string,
  onThemeChange: T => void,
  theme: T,
};

export type TableColumn = {
  displayName: string,
  id: string,
};
