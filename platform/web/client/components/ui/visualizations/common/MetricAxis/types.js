// @flow
import type { TextStyle } from 'components/ui/visualizations/common/GoalLine/GoalLineTag';

export type GoalLineStyle = 'solid' | 'dashed';

export type YAxisID = 'y1Axis' | 'y2Axis';

export type GoalLineData = {
  axis: YAxisID,
  fontColor: string,
  fontSize: number,
  id: string,
  label: string,
  lineStyle: GoalLineStyle,
  lineThickness: number,
  value: number,
};

export type GoalLineTheme = {
  backgroundColor: string,
  lineColor: string,
  textStyle: TextStyle,
};
