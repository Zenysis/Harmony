// @flow
import DEFAULT_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/DefaultTheme';
import Default from 'assets/images/tableThemes/Default.png';
import I18N from 'lib/I18N';
import KPTracker from 'assets/images/tableThemes/KPTracker.png';
import KP_TRACKER_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/KPTracker';
import LEAF_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/LeafTheme';
import LINED_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/LinedTheme';
import Leaf from 'assets/images/tableThemes/Leaf.png';
import Lined from 'assets/images/tableThemes/Lined.png';
import MINIMAL_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/MinimalTheme';
import Minimal from 'assets/images/tableThemes/Minimal.png';
import NIGHT_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/NightTheme';
import Night from 'assets/images/tableThemes/Night.png';
import OCEAN_THEME from 'models/visualizations/Table/TableSettings/TableTheme/DefaultThemes/OceanTheme';
import Ocean from 'assets/images/tableThemes/Ocean.png';

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
  'KP Tracker': KP_TRACKER_THEME,
  Leaf: LEAF_THEME,
  Lined: LINED_THEME,
  Minimal: MINIMAL_THEME,
  Night: NIGHT_THEME,
  Ocean: OCEAN_THEME,
};

const DEFAULT_THEMES: Array<DefaultTheme> = [
  {
    displayName: I18N.textById('Default'),
    imageUrl: Default,
    themeId: 'Default',
  },
  {
    displayName: I18N.text('Leaf'),
    imageUrl: Leaf,
    themeId: 'Leaf',
  },
  {
    displayName: I18N.text('Lined'),
    imageUrl: Lined,
    themeId: 'Lined',
  },
  {
    displayName: I18N.text('Minimal'),
    imageUrl: Minimal,
    themeId: 'Minimal',
  },
  {
    displayName: I18N.text('Night'),
    imageUrl: Night,
    themeId: 'Night',
  },
  {
    displayName: I18N.text('Ocean'),
    imageUrl: Ocean,
    themeId: 'Ocean',
  },
];

export { DEFAULT_THEMES };
