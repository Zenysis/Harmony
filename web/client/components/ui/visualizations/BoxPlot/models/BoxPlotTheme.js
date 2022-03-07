// @flow
import * as Zen from 'lib/Zen';

const TEXT = t('ui.visualizations.BoxPlot.models.BoxPlotTheme');

type RequiredValues = {
  id: string,
  axisLabelColor: string,
  axisLineColor: string,
  backgroundColor: string,
  boxPlotLinesColor: string,
  boxPlotFillColor: string,
  name: string,
  outliersFillColor: string,
  outliersStrokeColor: string,
  violinPatternsFillColor: string,
  violinPatternsStrokeColor: string,
  violinPlotStrokeColor: string,
  violinFillColor: string,
};

class BoxPlotTheme extends Zen.BaseModel<BoxPlotTheme, RequiredValues> {
  static DarkTheme: Zen.Model<BoxPlotTheme> = BoxPlotTheme.create({
    id: 'dark',
    axisLabelColor: 'white',
    axisLineColor: 'white',
    backgroundColor: '#27273f',
    boxPlotLinesColor: 'white',
    boxPlotFillColor: '#888e91',
    name: TEXT.dark,
    outliersFillColor: '#888e91',
    outliersStrokeColor: 'white',
    violinPatternsFillColor: 'rgba(0,0,0,0.5)',
    violinPatternsStrokeColor: '#ced4da',
    violinPlotStrokeColor: '#dee2e6',
    violinFillColor: '#27273f',
  });

  static LightTheme: Zen.Model<BoxPlotTheme> = BoxPlotTheme.create({
    id: 'light',
    axisLabelColor: 'rgba(0,0,0,0.7)',
    axisLineColor: 'rgba(0,0,0,0.7)',
    backgroundColor: 'white',
    boxPlotLinesColor: 'rgba(39,39,63,0.8)',
    boxPlotFillColor: 'rgba(39,39,63,0.4)',
    name: TEXT.light,
    outliersFillColor: 'rgba(39,39,63,0.4)',
    outliersStrokeColor: 'rgba(39,39,63,0.8)',
    violinPatternsFillColor: 'rgba(72,47,235,0.8)',
    violinPatternsStrokeColor: 'rgba(72,47,235,0.8)',
    violinPlotStrokeColor: 'rgba(72,47,235,0.8)',
    violinFillColor: 'white',
  });

  static Themes: { +[string]: Zen.Model<BoxPlotTheme> } = {
    [BoxPlotTheme.DarkTheme.id()]: BoxPlotTheme.DarkTheme,
    [BoxPlotTheme.LightTheme.id()]: BoxPlotTheme.LightTheme,
  };
}

export default ((BoxPlotTheme: $Cast): Class<Zen.Model<BoxPlotTheme>>);
