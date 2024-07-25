// @flow
import { DEFAULT_THEME as DEFAULT_PIE_THEME } from 'components/ui/visualizations/PieChart/defaults';
import type { PieChartDrilldownTheme } from 'components/ui/visualizations/PieChart/PieChartDrilldown/types';

export const DEFAULT_THEME: PieChartDrilldownTheme = {
  legendPieSize: 100,
  maxColumns: 3,
  piePadding: 0,
  pieTheme: DEFAULT_PIE_THEME,
};
