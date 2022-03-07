// @flow
import * as React from 'react';
import { DraggableCore } from 'react-draggable';

import autobind from 'decorators/autobind';
import type { DraggableData } from 'components/ui/DraggableItem';

type DefaultProps = {
  onDragStart: () => void,
  onDragStop: () => void,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
  focusEnd: number,
  focusStart: number,
  height: number,
  onFocusAreaChange: (number, number) => void,
  width: number,
};

const DRAG_HANDLE_STYLE = {
  cursor: 'ew-resize',
};

const DRAG_WINDOW_STYLE = {
  cursor: 'grab',
};

const FOCUS_DRAG_BAR_WIDTH = 3;

export default class FocusWindow extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    onDragStart: () => {},
    onDragStop: () => {},
  };

  calculateDragOffset(data: DraggableData): number {
    return data.deltaX;
  }

  updateFocusPosition(start: number, end: number) {
    const { focusEnd, focusStart, onFocusAreaChange } = this.props;
    if (start !== focusStart || end !== focusEnd) {
      onFocusAreaChange(start, end);
    }
  }

  @autobind
  onDragStart(event: SyntheticMouseEvent<SVGRectElement>, data: DraggableData) {
    this.props.onDragStart();
  }

  @autobind
  onDragStop() {
    this.props.onDragStop();
  }

  @autobind
  onDragStartHandle(
    event: SyntheticMouseEvent<SVGRectElement>,
    data: DraggableData,
  ) {
    const { focusEnd, focusStart } = this.props;
    const offset = this.calculateDragOffset(data);

    // Ensure the start handle is never less than 0 and that it never crosses
    // the end handle.
    const newStart = Math.min(Math.max(0, focusStart + offset), focusEnd - 1);
    this.updateFocusPosition(newStart, focusEnd);
  }

  @autobind
  onDragEndHandle(
    event: SyntheticMouseEvent<SVGRectElement>,
    data: DraggableData,
  ) {
    const { focusEnd, focusStart, width } = this.props;
    const offset = this.calculateDragOffset(data);

    // Ensure the end handle is never greater than the focus area width and that
    // it never crosses the start handle.
    const newEnd = Math.max(Math.min(focusEnd + offset, width), focusStart + 1);
    this.updateFocusPosition(focusStart, newEnd);
  }

  @autobind
  onDragFocusWindow(
    event: SyntheticMouseEvent<SVGRectElement>,
    data: DraggableData,
  ) {
    const { focusEnd, focusStart, width } = this.props;
    const offset = this.calculateDragOffset(data);

    // Ensure the focus window does not extend past either end of the focus
    // area.
    const focusWidth = focusEnd - focusStart;
    let newStart = focusStart + offset;
    let newEnd = focusEnd + offset;
    if (newEnd > width) {
      newEnd = width;
      newStart = newEnd - focusWidth;
    } else if (newStart < 0) {
      newStart = 0;
      newEnd = newStart + focusWidth;
    }
    this.updateFocusPosition(newStart, newEnd);
  }

  renderDragLayer(): React.Element<'g'> {
    const { focusEnd, focusStart, height, width } = this.props;
    const focusWidth = focusEnd - focusStart;
    return (
      <g className="focus-window__drag-layer" style={{ userSelect: 'none' }}>
        <rect
          fill="white"
          height={height}
          opacity={0.8}
          width={focusStart}
          x={0}
          y={0}
        />
        <rect
          fill="white"
          height={height}
          opacity={0.8}
          width={width - focusEnd}
          x={focusEnd}
          y={0}
        />
        <DraggableCore
          onStart={this.onDragStart}
          onDrag={this.onDragStartHandle}
          onStop={this.onDragStop}
        >
          <rect
            fill="#555555"
            height={height}
            style={DRAG_HANDLE_STYLE}
            width={FOCUS_DRAG_BAR_WIDTH}
            x={focusStart - FOCUS_DRAG_BAR_WIDTH}
            y={0}
          />
        </DraggableCore>
        <DraggableCore
          onStart={this.onDragStart}
          onDrag={this.onDragFocusWindow}
          onStop={this.onDragStop}
        >
          <rect
            fill="transparent"
            height={height}
            style={DRAG_WINDOW_STYLE}
            width={focusWidth}
            x={focusStart}
            y={0}
          />
        </DraggableCore>
        <DraggableCore
          onStart={this.onDragStart}
          onDrag={this.onDragEndHandle}
          onStop={this.onDragStop}
        >
          <rect
            fill="#555555"
            height={height}
            style={DRAG_HANDLE_STYLE}
            width={FOCUS_DRAG_BAR_WIDTH}
            x={focusEnd - FOCUS_DRAG_BAR_WIDTH}
            y={0}
          />
        </DraggableCore>
      </g>
    );
  }

  renderChart(): React.Element<'g'> {
    return <g className="focus-window__chart">{this.props.children}</g>;
  }

  render(): React.Element<'g'> {
    return (
      <g className="focus-window">
        {this.renderChart()}
        {this.renderDragLayer()}
      </g>
    );
  }
}
