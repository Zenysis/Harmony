// @flow
import * as React from 'react';

import Text from 'components/ui/visualizations/common/Text';

export type TextStyle = {
  fill: string,
  fontSize: string | number,
  fontWeight: string | number,

  // Properties that can override the placement and formatting of the
  // goal line value text.
  angle?: number,
  dx?: number,
  dy?: number,
  textAnchor?: string,
};

type Props = {
  axisOrientation: 'left' | 'right',
  valueText: string | number,
  y: number,
  backgroundColor?: string,
  goalLineID?: string,
  onClick?: ((goalLineID: string) => void) | void,
  textStyle?: TextStyle,
};

function GoalLineTag({
  axisOrientation,
  valueText,
  y,
  backgroundColor = 'white',
  goalLineID = 'goal-line-xxx',
  onClick = undefined,
  textStyle = {
    fill: 'black',
    fontSize: 12,
    fontWeight: 500,
  },
}: Props) {
  // If an onClick listener is defined, we want to make this tag appear
  // clickable.
  const [containerStyle, onTagClick] = React.useMemo(
    () => [
      onClick !== undefined ? { cursor: 'pointer' } : undefined,
      onClick !== undefined ? () => onClick(goalLineID) : undefined,
    ],
    [goalLineID, onClick],
  );

  const backgroundStyle = React.useMemo(
    () => ({
      fill: backgroundColor,
      padding: { bottom: 1, left: 5, right: 5, top: 1 },
      rx: 3,
    }),
    [backgroundColor],
  );

  const axisLeft = axisOrientation === 'left';
  return (
    <g
      onClick={onTagClick}
      style={containerStyle}
      transform={`translate(0, ${y})`}
    >
      <Text
        backgroundStyle={backgroundStyle}
        dx={axisLeft ? -5 : 5}
        dy={3}
        pointerEvents="none"
        textAnchor={axisLeft ? 'end' : 'start'}
        {...textStyle}
      >
        {valueText}
      </Text>
    </g>
  );
}

export default (React.memo(GoalLineTag): React.AbstractComponent<Props>);
