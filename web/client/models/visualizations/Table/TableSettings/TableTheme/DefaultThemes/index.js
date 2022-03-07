// @flow
import DEFAULT_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/DefaultTheme';
import I18N from 'lib/I18N';
import KP_TRACKER_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/KPTracker';
import LEAF_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/LeafTheme';
import LINED_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/LinedTheme';
import MINIMAL_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/MinimalTheme';
import NIGHT_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/NightTheme';
import OCEAN_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/OceanTheme';

export type DefaultThemeId =
  | 'Default'
  | 'Leaf'
  | 'Lined'
  | 'KP Tracker'
  | 'Minimal'
  | 'Night'
  | 'Ocean';

export type ThemeId = DefaultThemeId | 'Custom';

type DefaultTheme = {
  displayName: string,
  imageUrl: string,
  themeId: DefaultThemeId,
};

export const DEFAULT_THEME_MAP = {
  Default: DEFAULT_THEME,
  Leaf: LEAF_THEME,
  Lined: LINED_THEME,
  'KP Tracker': KP_TRACKER_THEME,
  Minimal: MINIMAL_THEME,
  Night: NIGHT_THEME,
  Ocean: OCEAN_THEME,
};

const DEFAULT_THEMES: Array<DefaultTheme> = [
  {
    displayName: I18N.textById('Default'),
    imageUrl: '/images/tableThemes/Default.png',
    themeId: 'Default',
  },
  {
    displayName: I18N.text('Leaf'),
    imageUrl: '/images/tableThemes/Leaf.png',
    themeId: 'Leaf',
  },
  {
    displayName: I18N.text('Lined'),
    imageUrl: '/images/tableThemes/Lined.png',
    themeId: 'Lined',
  },
  {
    displayName: I18N.text('Minimal'),
    imageUrl: '/images/tableThemes/Minimal.png',
    themeId: 'Minimal',
  },
  {
    displayName: I18N.text('Night'),
    imageUrl: '/images/tableThemes/Night.png',
    themeId: 'Night',
  },
  {
    displayName: I18N.text('Ocean'),
    imageUrl: '/images/tableThemes/Ocean.png',
    themeId: 'Ocean',
  },
];

export { DEFAULT_THEMES };
