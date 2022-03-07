// @flow
import * as React from 'react';

import DraggableItem from 'components/ui/DraggableItem';
import { autobind } from 'decorators';
import type {
  DragEventSignal,
  DraggableData,
} from 'components/ui/DraggableItem';

type Props = {
  circleDiameter: number,
  displayedValue: string | number,
  leftBound: number,
  onDrag: (newPosition: number) => DragEventSignal,
  onDragEnd: () => DragEventSignal,
  position: number,
  rightBound: number,
};

export default class RangeCircle extends React.PureComponent<Props> {
  @autobind
  onDrag(
    // eslint-disable-next-line no-unused-vars
    e: SyntheticEvent<HTMLDivElement>,
    data: DraggableData,
  ): DragEventSignal {
    return this.props.onDrag(data.x);
  }

  @autobind
  onDragEnd(): DragEventSignal {
    return this.props.onDragEnd();
  }

  render(): React.Element<'div'> {
    const {
      circleDiameter,
      displayedValue,
      leftBound,
      position,
      rightBound,
    } = this.props;

    const dragBounds = {
      bottom: 0,
      left: leftBound + circleDiameter / 2,
      right: rightBound,
      top: 0,
    };

    return (
      <div
        className="range-slider__container"
        style={{
          transform: `translate(${position - circleDiameter / 2}px, 0)`,
        }}
      >
        <DraggableItem
          dragMovementBounds={dragBounds}
          onDrag={this.onDrag}
          onDragEnd={this.onDragEnd}
        >
          <div className="range-slider__item">
            <div
              className="range-slider__circle"
              style={{
                borderRadius: circleDiameter / 2,
                height: circleDiameter,
                width: circleDiameter,
              }}
            />
            <p
              className="range-slider__value"
              style={{
                // NOTE(stephen): Leaving the width unset causes reflow issues.
                // If you drag the left slider from 0 to 100, you'll notice the
                // right slider moves to the right despite not being touched.
                // This is caused by the value width increasing because the
                // value has changed. Setting the width to a fixed number
                // prevents this from happening.
                width: circleDiameter,
              }}
            >
              {displayedValue}
            </p>
          </div>
        </DraggableItem>
      </div>
    );
  }
}
