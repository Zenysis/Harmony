// @flow
import * as React from 'react';
import { Line } from '@vx/shape';
import { Point } from '@vx/point';

import Text from 'components/ui/visualizations/BarGraph/internal/Text';
import { autobind, memoizeOne } from 'decorators';

type TextStyle = {
  fill: string,
  fontSize: string | number,
  fontWeight: string | number,
};

type Props = {
  axisOrientation: 'left' | 'right',
  backgroundColor: string,
  chartWidth: number,
  goalLineID: string,
  lineColor: string,
  onClick: (goalLineID: string) => void,
  static: boolean,
  text: string | number,
  textStyle: TextStyle,
  y: number,
};

export default class GoalLine extends React.PureComponent<Props> {
  static defaultProps = {
    backgroundColor: 'white',
    onClick: () => {},
    static: false,
    textStyle: {
      fill: 'black',
      fontSize: 12,
      fontWeight: 500,
    },
  };

  @memoizeOne
  buildLinePoints(
    chartWidth: number,
    axisOrientation: 'left' | 'right',
  ): [Point, Point] {
    const end = axisOrientation === 'left' ? chartWidth : -chartWidth;
    return [new Point({ x: 0, y: 0 }), new Point({ x: end, y: 0 })];
  }

  getLinePoints(): [Point, Point] {
    const { axisOrientation, chartWidth } = this.props;
    return this.buildLinePoints(chartWidth, axisOrientation);
  }

  @memoizeOne
  buildBackgroundStyle(backgroundColor: string) {
    return {
      fill: backgroundColor,
      padding: {
        bottom: 1,
        left: 5,
        right: 5,
        top: 1,
      },
      rx: 3,
    };
  }

  getBackgroundStyle() {
    return this.buildBackgroundStyle(this.props.backgroundColor);
  }

  @autobind
  onClick() {
    const { goalLineID, onClick } = this.props;
    onClick(goalLineID);
  }

  render() {
    const { axisOrientation, lineColor, text, textStyle, y } = this.props;
    const [startPoint, endPoint] = this.getLinePoints();

    const axisLeft = axisOrientation === 'left';
    const textOffset = axisLeft ? -5 : 5;
    const textAnchor = axisLeft ? 'end' : 'start';
    return (
      <g
        onClick={this.onClick}
        style={{ cursor: 'pointer' }}
        transform={`translate(${startPoint.x}, ${y})`}
      >
        <Line
          from={startPoint}
          stroke={lineColor}
          strokeDasharray="2,2"
          strokeWidth={2}
          to={endPoint}
        />
        <Text
          backgroundStyle={this.getBackgroundStyle()}
          dx={textOffset}
          dy={3}
          textAnchor={textAnchor}
          {...textStyle}
        >
          {text}
        </Text>
      </g>
    );
  }
}
