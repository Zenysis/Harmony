// @flow
import * as React from 'react';

import DraggableItem from 'components/ui/DraggableItem';
import type {
  DragEventSignal,
  DraggableData,
} from 'components/ui/DraggableItem';

type Props = {
  circleDiameter: number,
  /**
   * The max leftward distance (RELATIVE to the current position) that the
   * thumb can travel. This should be equivalent to the distance between
   * the current position and the initial start position
   */
  leftBound: number,
  onDrag: (newPosition: number) => DragEventSignal,
  onDragEnd: () => DragEventSignal,
  position: number,
  /**
   * The max rightward distance (from the initial start position) that the thumb
   * can travel
   */
  rightBound: number,
};

/**
 * The SliderThumb represents the draggable element that a user can control
 * to step through the dates in the timeline.
 *
 * NOTE(nina): This is repurposed from the RangeCircle element. It is mostly
 * identical, but I had plans to change how we calculate the positioning, since
 * it is really annoying to have to account for the edge versus midpoint of
 * the circle. I didn't end up doing that, but I think it is still good
 * to have our own copy of the thumb.
 */
export default function SliderThumb({
  circleDiameter,
  leftBound,
  onDrag,
  onDragEnd,
  position,
  rightBound,
}: Props): React.Element<'div'> {
  function onThumbDrag(
    // eslint-disable-next-line no-unused-vars
    e: SyntheticEvent<HTMLDivElement>,
    data: DraggableData,
  ): DragEventSignal {
    return onDrag(data.x);
  }

  const dragBounds = {
    bottom: 0,
    left: leftBound,
    right: rightBound,
    top: 0,
  };

  return (
    <div
      className="query-result-timeline__thumb-container"
      style={{
        transform: `translate(${position}px, 0)`,
      }}
    >
      <DraggableItem
        dragMovementBounds={dragBounds}
        onDrag={onThumbDrag}
        onDragEnd={onDragEnd}
      >
        <div
          className="query-result-timeline__thumb-circle"
          style={{
            borderRadius: circleDiameter / 2,
            height: circleDiameter,
            width: circleDiameter,
          }}
        />
      </DraggableItem>
    </div>
  );
}
