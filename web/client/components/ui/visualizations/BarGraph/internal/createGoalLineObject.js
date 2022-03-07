// @flow
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';

const DEFAULT_GOAL_LINE_SETTINGS = {
  axis: 'y1Axis',
  fontColor: 'black',
  fontSize: 12,
  label: '',
  lineStyle: 'dashed',
  lineThickness: 2,
  value: 0,
};

function createGoalLineId(): string {
  return `goal-line-id-${Date.now()}`;
}

export function createGoalLineObject(
  goalLineObject: $Shape<GoalLineData>,
): GoalLineData {
  const id =
    goalLineObject.id !== undefined ? goalLineObject.id : createGoalLineId();
  return { ...DEFAULT_GOAL_LINE_SETTINGS, ...goalLineObject, id };
}
