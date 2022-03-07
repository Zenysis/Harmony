// @flow
import * as React from 'react';

import RangeCircle from 'components/ui/RangeSlider/internal/RangeCircle';
import { DRAG_SIGNAL } from 'components/ui/DraggableItem';
import { autobind } from 'decorators';
import type { DragEventSignal } from 'components/ui/DraggableItem';

type DefaultProps<T> = {
  /** The diameter (in px)  of the range selector circles */
  circleDiameter: number,

  /** Optional className */
  className: string,

  /** The width of the range line in px */
  lineThickness: number,

  /** Used to fromat the select values for display */
  valueFormatter: T => string | number,

  /** Width of the slider in pixels */
  width: number,
};

type Props<T> = {
  ...DefaultProps<T>,

  /** The initially selected start of the range */
  initialStart: T,

  /** The initially selected end of the range */
  initialEnd: T,

  /** This is called whenever a drag event ends with the new selected range */
  onRangeChange: (start: T, end: T) => void,

  /** An array of possible range values */
  values: $ReadOnlyArray<T>,
};

type RangeValueKey = 'start' | 'end';

type State<T> = {
  start: T,
  end: T,
};

function defaultValueFormatter(value: mixed): string | number {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return '';
}

/**
 * A slider component used to select the start and end value for a range.
 * It is built on a 1-dimensional scale from 0 to width.
 */
export default class RangeSlider<T> extends React.PureComponent<
  Props<T>,
  State<T>,
> {
  static defaultProps: DefaultProps<T> = {
    circleDiameter: 16,
    className: '',
    lineThickness: 2,
    valueFormatter: defaultValueFormatter,
    width: 400,
  };

  state: State<T> = {
    start: this.props.initialStart,
    end: this.props.initialEnd,
  };

  componentDidMount() {
    this.maybeWarnAboutNumberOfValues();
  }

  componentDidUpdate(prevProps: Props<T>) {
    const { values, width } = this.props;
    if (prevProps.width !== width || prevProps.values !== values) {
      this.maybeWarnAboutNumberOfValues();
    }

    if (values !== prevProps.values) {
      this.setState({
        start: this.props.initialStart,
        end: this.props.initialEnd,
      });
    }
  }

  maybeWarnAboutNumberOfValues() {
    const { values, width } = this.props;
    if (values.length > width) {
      // eslint-disable-next-line no-console
      console.warn(
        `There are more possible slider values then pixels available. This
        means that not all possible range values can be selected.`,
      );
    }
  }

  getPositionOfValue(value: T): number {
    const { values, width } = this.props;
    const index = values.indexOf(value);
    return width * (index / (values.length - 1));
  }

  getValueOfPosition(position: number): T {
    const { values, width } = this.props;

    const index = Math.round((position * (values.length - 1)) / width);
    return values[index];
  }

  getNewValue(currentValue: T, positionOffset: number): T {
    const position = this.getPositionOfValue(currentValue) + positionOffset;
    return this.getValueOfPosition(position);
  }

  onDrag(rangeValueKey: RangeValueKey, newPosition: number): DragEventSignal {
    this.setState(prevState => {
      const newValue = this.getNewValue(prevState[rangeValueKey], newPosition);
      if (rangeValueKey === 'start') {
        return { start: newValue };
      }
      return { end: newValue };
    });

    return DRAG_SIGNAL.RESET;
  }

  @autobind
  onDragStartRangeCircle(newPosition: number) {
    this.onDrag('start', newPosition);
  }

  @autobind
  onDragEndRangeCircle(newPosition: number) {
    this.onDrag('end', newPosition);
  }

  @autobind
  onDragEnd(): DragEventSignal {
    const { start, end } = this.state;
    const { onRangeChange } = this.props;
    onRangeChange(start, end);
    return DRAG_SIGNAL.RESET;
  }

  render(): React.Element<'div'> {
    const {
      circleDiameter,
      className,
      lineThickness,
      valueFormatter,
      values,
      width,
    } = this.props;
    const { end, start } = this.state;

    // Positions of the currently selected values
    const startSavedPosition = this.getPositionOfValue(start);
    const endSavedPosition = this.getPositionOfValue(end);

    // Always keep start and end of range at least 1 value apart.
    const minimumGap = Math.max(1, Math.floor(width / values.length));

    const centralGapWidth = endSavedPosition - startSavedPosition - minimumGap;

    const lineStyle = {
      top: (circleDiameter - lineThickness) / 2,
      height: lineThickness,
    };

    const activeLineStyle = {
      ...lineStyle,
      left: startSavedPosition + circleDiameter,
      width: endSavedPosition - startSavedPosition,
    };

    const inactiveLineStyle = {
      width,
      marginLeft: circleDiameter,
      ...lineStyle,
    };

    return (
      <div
        className={`range-slider ${className}`}
        style={{ width: width + 2 * circleDiameter }}
      >
        <div
          className="range-slider__line range-slider__line--inactive"
          style={inactiveLineStyle}
        />
        <div
          className="range-slider__line range-slider__line--active"
          style={activeLineStyle}
        />
        <RangeCircle
          circleDiameter={circleDiameter}
          leftBound={-startSavedPosition}
          onDrag={this.onDragStartRangeCircle}
          onDragEnd={this.onDragEnd}
          position={startSavedPosition}
          rightBound={centralGapWidth}
          displayedValue={valueFormatter(start)}
        />
        <RangeCircle
          circleDiameter={circleDiameter}
          leftBound={-centralGapWidth}
          onDrag={this.onDragEndRangeCircle}
          onDragEnd={this.onDragEnd}
          position={endSavedPosition}
          rightBound={width - endSavedPosition}
          displayedValue={valueFormatter(end)}
        />
      </div>
    );
  }
}
