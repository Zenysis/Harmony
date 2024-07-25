// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';

type Values = {
  axisTextColor: string,
  backgroundColor: string,
  heatTilesColorRange: Zen.Array<string>,
  hoverColor: string,
  id: string,
  name: string,
  selectedLineColors: Zen.Array<string>,
  strokeColor: string,
};

class BumpChartTheme extends Zen.BaseModel<BumpChartTheme, Values> {}

export const DARK_THEME: Zen.Model<BumpChartTheme> = BumpChartTheme.create({
  axisTextColor: 'white',
  backgroundColor: '#272b4d',
  heatTilesColorRange: Zen.Array.create(['#272b4d', '#21d4fd']),
  hoverColor: '#ddf163',
  id: 'dark',
  name: I18N.textById('Dark'),
  selectedLineColors: Zen.Array.create(['#fd6d7e', '#ffb01e', '#01ff6f']),
  strokeColor: '#f7f7f3',
});

export const LIGHT_THEME: Zen.Model<BumpChartTheme> = BumpChartTheme.create({
  axisTextColor: 'black',
  backgroundColor: '#faf7e9',
  heatTilesColorRange: Zen.Array.create(['#272b4d', '#21d4fd']),
  hoverColor: '#a44afe',
  id: 'light',
  name: I18N.textById('Light'),
  selectedLineColors: Zen.Array.create(['#fd6d7e', '#ffb01e', '#01ff6f']),
  strokeColor: '#c4c3cb',
});

export const THEMES: { [string]: Zen.Model<BumpChartTheme>, ... } = {
  [DARK_THEME.id()]: DARK_THEME,
  [LIGHT_THEME.id()]: LIGHT_THEME,
};

export default ((BumpChartTheme: $Cast): Class<Zen.Model<BumpChartTheme>>);
