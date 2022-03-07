// @flow
import type { Theme } from 'models/visualizations/Table/TableSettings/TableTheme/types';

export type ThemeControlsProps<T: Theme> = {
  onThemeChange: T => void,
  theme: T,
  header?: string,
};

export type TableColumn = {
  id: string,
  displayName: string,
};
