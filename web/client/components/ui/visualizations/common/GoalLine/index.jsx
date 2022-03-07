// @flow
import * as React from 'react';

import GoalLinePath from 'components/ui/visualizations/common/GoalLine/GoalLinePath';
import GoalLineTag from 'components/ui/visualizations/common/GoalLine/GoalLineTag';

type Props = {
  ...React.ElementConfig<typeof GoalLinePath>,
  ...React.ElementConfig<typeof GoalLineTag>,
};

function GoalLine({
  axisOrientation,
  backgroundColor,
  chartWidth,
  goalLineID,
  label,
  lineColor,
  onClick,
  textStyle,
  valueText,
  y,
}: Props) {
  return (
    <React.Fragment>
      <GoalLinePath
        axisOrientation={axisOrientation}
        chartWidth={chartWidth}
        label={label}
        lineColor={lineColor}
        y={y}
      />
      <GoalLineTag
        axisOrientation={axisOrientation}
        backgroundColor={backgroundColor}
        goalLineID={goalLineID}
        onClick={onClick}
        textStyle={textStyle}
        valueText={valueText}
        y={y}
      />
    </React.Fragment>
  );
}

export default (React.memo(GoalLine): React.AbstractComponent<Props>);
