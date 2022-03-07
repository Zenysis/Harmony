// @flow
import * as React from 'react';

import SliderThumb from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/SliderThumb';
import {
  CIRCLE_DIAMETER,
  TIMELINE_WIDTH,
} from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/registry';
import { DRAG_SIGNAL } from 'components/ui/DraggableItem';
import type { DragEventSignal } from 'components/ui/DraggableItem';

type Props = {
  currentIndex: number,
  maxDateIndex: number,
  onCurrentIndexChange: number => void,

  /** An array of possible range values */
  values: $ReadOnlyArray<string>,

  /** Width of the slider in pixels */
  width: number,
};

/**
 * A slider component that can select the start value for a range of dates,
 * and autostep through each date.
 *
 * NOTE(nina): This is repurposed from the RangeSlider UI component
 */
function InputSlider({
  currentIndex,
  maxDateIndex,
  onCurrentIndexChange,
  values,
  width,
}: Props): React.Element<'div'> {
  const startValue = values[currentIndex];

  // Given a value from our data (EX: a particular date), find the
  // corresponding pixel position on the timeline
  function getPositionOfValue(value: string): number {
    const index = values.indexOf(value);
    return width * (index / (values.length - 1));
  }

  // Given a pixel position on the timeline, find the value from our data
  // that represents it. We round the index calculation, as we need to be
  // able to index into our list of values. This ensures that, visually,
  // a user can drag the thumb between two different ticks, but ultimately
  // the thumb must end on one of those ticks.
  function getValueOfPosition(position: number): string {
    const index = Math.round((position * (values.length - 1)) / width);
    return values[index];
  }

  // Given our last recorded value, we find its position on the timeline
  // (represented by a tick), and calculate the distance the thumb has
  // traveled from this value. Then we take that new position, and return
  // the value associated with that position.
  function getNewValue(currentValue: string, positionOffset: number): string {
    const position = getPositionOfValue(currentValue) + positionOffset;
    return getValueOfPosition(position);
  }

  function onDragStart(newPosition: number) {
    const nextValue = getNewValue(startValue, newPosition);
    const nextIndex = values.indexOf(nextValue);
    // Prevent item from being dragged off slider
    onCurrentIndexChange(nextIndex < 0 ? maxDateIndex : nextIndex);
    return DRAG_SIGNAL.RESET;
  }

  function onDragEnd(): DragEventSignal {
    onCurrentIndexChange(currentIndex);
    return DRAG_SIGNAL.RESET;
  }

  function renderSlider() {
    const circleOffset = CIRCLE_DIAMETER / 2;

    // The 'startPosition' is the pixel value for where a tick or line should
    // horizontally start drawing itself from. This increases as we build
    // each slider section. In each iteration, the value must match the
    // midpoint of the SliderThumb component when it is over a specific tick.
    // Because the circle's left edge starts at the given pixel position
    // (instead of its midpoint), we need to match by making sure the
    // first tick and line marks are initially offsetted.
    return (
      <svg width={TIMELINE_WIDTH} height={3}>
        {values.map((value, idx) => {
          const color = idx <= currentIndex ? '#313234' : '#bfc2c9';
          const startPosition = (idx / maxDateIndex) * width + circleOffset;
          const tick = (
            <line
              key={`tick-${idx}`}
              x1={startPosition}
              x2={startPosition}
              y1="0"
              y2="3"
              stroke={color}
              strokeLinecap="round"
            />
          );

          // Get the pixel distance to the next tick, and account for the size
          // of the thumb
          const endPosition = ((idx + 1) / maxDateIndex) * width + circleOffset;

          let line = null;
          if (idx !== values.length - 1) {
            line = (
              <line
                key={`line-${idx}`}
                x1={startPosition}
                x2={endPosition}
                y1="1.5"
                y2="1.5"
                stroke={idx < currentIndex ? '#313234' : '#bfc2c9'}
              />
            );
          }

          return [tick, line];
        })}
      </svg>
    );
  }

  // Position of the currently selected value
  const currentPosition = getPositionOfValue(startValue);

  return (
    <div className="query-result-timeline__slider-container">
      {renderSlider()}
      <SliderThumb
        circleDiameter={CIRCLE_DIAMETER}
        leftBound={-currentPosition}
        onDrag={onDragStart}
        onDragEnd={onDragEnd}
        position={currentPosition}
        rightBound={width}
      />
    </div>
  );
}

export default (React.memo(InputSlider): React.AbstractComponent<Props>);
