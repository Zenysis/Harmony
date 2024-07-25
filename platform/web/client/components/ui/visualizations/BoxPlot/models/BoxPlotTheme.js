// @flow
import * as Zen from 'lib/Zen';
import I18N from 'lib/I18N';

type RequiredValues = {
  axisLabelColor: string,
  axisLineColor: string,
  backgroundColor: string,
  boxPlotFillColor: string,
  boxPlotLinesColor: string,
  id: string,
  name: string,
  outliersFillColor: string,
  outliersStrokeColor: string,
  violinFillColor: string,
  violinPatternsFillColor: string,
  violinPatternsStrokeColor: string,
  violinPlotStrokeColor: string,
};

class BoxPlotTheme extends Zen.BaseModel<BoxPlotTheme, RequiredValues> {
  static DarkTheme: Zen.Model<BoxPlotTheme> = BoxPlotTheme.create({
    axisLabelColor: 'white',
    axisLineColor: 'white',
    backgroundColor: '#27273f',
    boxPlotFillColor: '#888e91',
    boxPlotLinesColor: 'white',
    id: 'dark',
    name: I18N.text('Dark'),
    outliersFillColor: '#888e91',
    outliersStrokeColor: 'white',
    violinFillColor: '#27273f',
    violinPatternsFillColor: 'rgba(0,0,0,0.5)',
    violinPatternsStrokeColor: '#ced4da',
    violinPlotStrokeColor: '#dee2e6',
  });

  static LightTheme: Zen.Model<BoxPlotTheme> = BoxPlotTheme.create({
    axisLabelColor: 'rgba(0,0,0,0.7)',
    axisLineColor: 'rgba(0,0,0,0.7)',
    backgroundColor: 'white',
    boxPlotFillColor: 'rgba(39,39,63,0.4)',
    boxPlotLinesColor: 'rgba(39,39,63,0.8)',
    id: 'light',
    name: I18N.text('Light'),
    outliersFillColor: 'rgba(39,39,63,0.4)',
    outliersStrokeColor: 'rgba(39,39,63,0.8)',
    violinFillColor: 'white',
    violinPatternsFillColor: 'rgba(72,47,235,0.8)',
    violinPatternsStrokeColor: 'rgba(72,47,235,0.8)',
    violinPlotStrokeColor: 'rgba(72,47,235,0.8)',
  });

  static Themes: { +[string]: Zen.Model<BoxPlotTheme> } = {
    [BoxPlotTheme.DarkTheme.id()]: BoxPlotTheme.DarkTheme,
    [BoxPlotTheme.LightTheme.id()]: BoxPlotTheme.LightTheme,
  };
}

export default ((BoxPlotTheme: $Cast): Class<Zen.Model<BoxPlotTheme>>);
