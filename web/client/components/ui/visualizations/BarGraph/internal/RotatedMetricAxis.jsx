// @flow
import * as React from 'react';

import MetricAxis from 'components/ui/visualizations/common/MetricAxis';

type Props = React.ElementConfig<typeof MetricAxis>;

type MetricAxisProp<T> = $ElementType<Props, T>;

/**
 * When the bar graph is in horizontal bar mode, we need to tweak the properties
 * of the MetricAxis appropriately so that when the main graph is rotated with
 * a transform, the y1/y2 axes look correct.
 *
 * NOTE(stephen): This component is highly specific to the first implementation
 * of the horizontal bar chart, which uses a transform `rotate` to convert its
 * normal column chart style into a horizontal style with minimal code changes.
 */
function RotatedMetricAxis(props: Props) {
  const isY1Axis = props.axisOrientation === 'left';

  // By flipping the axis orientation, we can get the MetricAxis to draw the
  // tick marks and labels on the correct side. The Y1 axis will be placed on
  // the bottom of the rotated chart with its axis ticks below the line. The Y2
  // axis will be placed on the top of the rotated chart with its ticks above
  // the line.
  const axisOrientation = isY1Axis ? 'right' : 'left';
  const tickLabelProps = React.useMemo<MetricAxisProp<'tickLabelProps'>>(
    () => ({
      ...props.tickLabelProps,
      angle: -90,
      dx: isY1Axis ? '1em' : '-0.25em',
      dy: 0,
      textAnchor: 'middle',
    }),
    [isY1Axis, props.tickLabelProps],
  );
  const titleLabelProps = React.useMemo<MetricAxisProp<'titleLabelProps'>>(
    () => ({
      ...props.titleLabelProps,
      transform: isY1Axis
        ? `rotate(-90) translate(-${props.height}, 80)`
        : 'rotate(-90)',
    }),
    [isY1Axis, props.height, props.titleLabelProps],
  );

  const goalLineThemes = React.useMemo<MetricAxisProp<'goalLineThemes'>>(() => {
    // Need to rotate the text of the goal line's value label.
    const { hover, placed } =
      props.goalLineThemes || MetricAxis.defaultProps.goalLineThemes;
    const textStyle = {
      angle: -90,
      dx: isY1Axis ? 13 : -5,
      dy: 5,
      textAnchor: 'middle',
    };
    return {
      hover: {
        ...hover,
        textStyle: { ...hover.textStyle, ...textStyle },
      },
      placed: {
        ...placed,
        textStyle: { ...placed.textStyle, ...textStyle },
      },
    };
  }, [isY1Axis, props.goalLineThemes]);

  return (
    <MetricAxis
      {...props}
      axisOrientation={axisOrientation}
      goalLineThemes={goalLineThemes}
      tickLabelProps={tickLabelProps}
      titleLabelProps={titleLabelProps}
      titleOffset={30}
    />
  );
}

export default (React.memo(RotatedMetricAxis): React.AbstractComponent<Props>);
