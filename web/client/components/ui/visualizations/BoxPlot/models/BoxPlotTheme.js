// @flow
import * as Zen from 'lib/Zen';

type Values = {
  id: Zen.ReadOnly<string>,
  axisLabelColor: string,
  axisLineColor: string,
  backgroundColor: string,
  boxPlotLinesColor: string,
  boxPlotFillColor: string,
  outliersFillColor: string,
  outliersStrokeColor: string,
  violinPatternsFillColor: string,
  violinPatternsStrokeColor: string,
  violinPlotStrokeColor: string,
  violinFillColor: string,
};

class BoxPlotTheme extends Zen.BaseModel<BoxPlotTheme, Values> {
  static DarkTheme = BoxPlotTheme.create({
    id: 'dark',
    axisLabelColor: 'white',
    axisLineColor: 'white',
    backgroundColor: '#27273f',
    boxPlotLinesColor: 'white',
    boxPlotFillColor: '#888e91',
    outliersFillColor: '#888e91',
    outliersStrokeColor: 'white',
    violinPatternsFillColor: 'rgba(0,0,0,0.5)',
    violinPatternsStrokeColor: '#ced4da',
    violinPlotStrokeColor: '#dee2e6',
    violinFillColor: '#27273f',
  });

  static LightTheme = BoxPlotTheme.create({
    id: 'light',
    axisLabelColor: 'rgb(72,47,235)',
    axisLineColor: 'rgb(72,47,235)',
    backgroundColor: '#fbfbfc',
    boxPlotLinesColor: 'rgb(72,47,235,0.8)',
    boxPlotFillColor: 'rgb(72,47,235,0.4)',
    outliersFillColor: 'rgb(72,47,235,0.4)',
    outliersStrokeColor: 'rgb(72,47,235,0.8)',
    violinPatternsFillColor: 'rgb(72,47,235,0.8)',
    violinPatternsStrokeColor: 'rgb(72,47,235,0.8)',
    violinPlotStrokeColor: 'rgb(72,47,235,0.8)',
    violinFillColor: '#fbfbfc',
  });

  static THEMES = {
    // $ZenModelReadOnlyIssue
    [BoxPlotTheme.DarkTheme.id()]: BoxPlotTheme.DarkTheme,

    // $ZenModelReadOnlyIssue
    [BoxPlotTheme.LightTheme.id()]: BoxPlotTheme.LightTheme,
  };
}

export default ((BoxPlotTheme: any): Class<Zen.Model<BoxPlotTheme>>);
