// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import DraggableItem, { DRAG_SIGNAL } from 'components/ui/DraggableItem';
import PlaceholderItem from 'components/ui/DraggableItemList/internal/PlaceholderItem';
import autobind from 'decorators/autobind';
import {
  computeDragItemStyle,
  computeInitialDragThreshold,
  computeNextDragThreshold,
} from 'components/ui/DraggableItemList/internal/util';
import type {
  DragEventSignal,
  DraggableData,
} from 'components/ui/DraggableItem';

// NOTE(stephen): Using our own style object instead of StyleObject because we
// control the values fully. However, flow wants us to refine the StyleObject's
// values to ensure they are number and not string, which is annoying to do.
export type DragItemStyle = {
  height: number,
  left: number,
  position: 'absolute',
  top: number,
  width: number,
};

type DefaultProps = {
  /**
   * An optional CSS selector that restricts drag events to only the DOM
   * elements that match the selector. If not provided, the entire element
   * will be draggable.
   */
  dragRestrictionSelector: string,
};

type Props<T> = {
  ...DefaultProps,

  /**
   * An ordered list of items to render in the draggable list. There is no
   * restriction on the item type, and it is ok to have duplicates in the list.
   */
  items: Zen.Array<T>,

  /**
   * Signals that a new ordering of items has been produced.
   * @param {Zen.Array.T} items The new ordering based on the user's drag actions
   */
  onItemOrderChanged: (
    Zen.Array<T>,
    event: SyntheticEvent<HTMLDivElement>,
  ) => void,

  /**
   * A render function that controls how the given item should be rendered
   * within the list.
   * @param {T} item Item to render.
   * @returns {React.MixedElement} A renderable React element.
   */
  renderItem: (item: T) => React.MixedElement,
};

type State<T> = {
  currentDragItemIdx: number,
  /**
   * Each drag cycle (wait + drag start + drag move... + drag end) should
   * maintain an identifier that indicates events and changes that occur during
   * that cycle are all part of the same cycle. When the cycle starts again, the
   * identifier should change. This helps us produce a safe `key` based on item
   * index.
   */
  dragCycleId: number,
  dragItemStyle: DragItemStyle,
  dragThreshold: [number, number],
  originalDragItemIdx: number,
  originalItemOrder: Zen.Array<T>,
};

const DEFAULT_DRAG_STYLE: DragItemStyle = {
  position: 'absolute',
  height: 0,
  left: 0,
  top: 0,
  width: 0,
};

function createDefaultState<T>(
  items: Zen.Array<T>,
  dragCycleId: number = 0,
): State<T> {
  return {
    dragCycleId,
    currentDragItemIdx: -1,
    dragItemStyle: DEFAULT_DRAG_STYLE,
    dragThreshold: [0, 0],
    originalDragItemIdx: -1,
    originalItemOrder: items,
  };
}

/**
 * The DraggableItemList is a flexibile UI component for rendering a list of
 * items. The user can change the order of these items by dragging the item up
 * or down to change position (see `dragRestrictionSelector` for details on
 * what can trigger a drag).
 *
 * Currently the only direction supported for dragging is vertical.
 */
export default class DraggableItemList<T> extends React.Component<
  Props<T>,
  State<T>,
> {
  static defaultProps: DefaultProps = {
    dragRestrictionSelector: '',
  };

  state: State<T> = createDefaultState(this.props.items);

  static getDerivedStateFromProps(
    props: Props<T>,
    state: State<T>,
  ): State<T> | null {
    // If the input item order has not changed, our assumptions are still valid.
    if (props.items === state.originalItemOrder) {
      return null;
    }

    // If the input item order has changed, we need to reset to a non-dragging
    // and potentially update the drag cycle to invalidate the previous
    // rendering.
    let { dragCycleId } = state;

    // If the user was in the middle of a drag, update the drag cycle ID since
    // we will be resetting to a non-dragging state and changing the item order.
    // In addition, if the number of items has changed then we cannot guarantee
    // that the order is consistent with the previous order.
    if (
      state.currentDragItemIdx !== -1 ||
      props.items.size() !== state.originalItemOrder.size()
    ) {
      dragCycleId += 1;
    }

    return createDefaultState(props.items, dragCycleId);
  }

  @autobind
  onDrag(
    e: SyntheticEvent<HTMLDivElement>,
    { deltaY, node, y }: DraggableData,
  ): DragEventSignal {
    const { currentDragItemIdx, dragItemStyle, dragThreshold } = this.state;
    const [lowerBound, upperBound] = dragThreshold;
    const absoluteY = dragItemStyle.top + y;
    if (
      // The first item in the list is being dragged up but no items exist
      // above it.
      (deltaY <= 0 && currentDragItemIdx === 0) ||
      // The last item in the list is being dragged down but no items exist
      // below it.
      (deltaY >= 0 && currentDragItemIdx === this.props.items.size() - 1) ||
      // The current item is being dragged within the threshold space and does
      // not trigger a reordering.
      (absoluteY >= lowerBound && absoluteY <= upperBound)
    ) {
      return;
    }

    const usePrevious = absoluteY < lowerBound;
    const newIdx = usePrevious
      ? currentDragItemIdx - 1
      : currentDragItemIdx + 1;
    this.setState({
      currentDragItemIdx: newIdx,
      dragThreshold: computeNextDragThreshold(node, usePrevious),
    });
  }

  @autobind
  onDragStart(
    e: SyntheticEvent<HTMLDivElement>,
    { node }: DraggableData,
    currentDragItemIdx: number | void,
  ): DragEventSignal {
    const dragItemStyle = computeDragItemStyle(node);

    // Prevent drag events from bubbling up to the parent since an ancestor
    // could also be a draggable item.
    e.stopPropagation();

    this.setState({
      currentDragItemIdx,
      dragItemStyle,
      dragThreshold: computeInitialDragThreshold(dragItemStyle, node),
      originalDragItemIdx: currentDragItemIdx,
    });
  }

  @autobind
  onDragEnd(
    e: SyntheticEvent<HTMLDivElement>,
    data: DraggableData,
    currentDragItemIdx: number | void,
  ): DragEventSignal {
    const { items, onItemOrderChanged } = this.props;
    const { dragCycleId, originalDragItemIdx } = this.state;
    let newItemOrder = items;

    // If the item order has not changed, we don't need to modify the drag
    // cycle ID. This provides a small rendering benefit since React will be
    // able to more efficiently reconcile the rendered child items.
    let newDragCycleId = dragCycleId;

    if (originalDragItemIdx !== currentDragItemIdx) {
      newItemOrder = items
        .delete(originalDragItemIdx)
        .insertAt(currentDragItemIdx || 0, items.get(originalDragItemIdx));
      newDragCycleId = dragCycleId + 1;
      onItemOrderChanged(newItemOrder, e);
    }

    this.setState(createDefaultState(newItemOrder, newDragCycleId));

    // Since we are resetting the actual position of the item in the DOM, we
    // do not want to preserve the drag translation applied to the element when
    // we have finished dragging.
    return DRAG_SIGNAL.RESET;
  }

  renderItems(): React.Node {
    const { dragRestrictionSelector, items, renderItem } = this.props;
    const {
      currentDragItemIdx,
      dragCycleId,
      dragItemStyle,
      originalDragItemIdx,
    } = this.state;

    const output = [];
    const dragRangeStart = Math.min(originalDragItemIdx, currentDragItemIdx);
    const dragRangeEnd = Math.max(originalDragItemIdx, currentDragItemIdx);

    // NOTE(stephen): Iterating imperatively since we need to reorder the items
    // in the input list based on the current drag item positioning.
    for (let i = 0; i < items.size(); i++) {
      let style;
      let itemIdx = i;

      // Check if the item that normally lives at this index is affected by
      // the drag repositioning.
      if (i >= dragRangeStart && i <= dragRangeEnd) {
        if (i === currentDragItemIdx) {
          itemIdx = originalDragItemIdx;
          style = dragItemStyle;
          output.push(
            <PlaceholderItem
              key="placeholder"
              height={dragItemStyle.height}
              width={dragItemStyle.width}
            />,
          );
        } else if (originalDragItemIdx > currentDragItemIdx) {
          // The item was dragged earlier in the list. The item that should
          // show up at this index is located *earlier* in the list.
          itemIdx = i - 1;
        } else {
          // The item was dragged later in the list. The item that should
          // show up at this index is located *later* in the list.
          itemIdx = i + 1;
        }
      }

      // NOTE(stephen): Intentionally using the index as the key here. Since we
      // are only changing the order that items are rendered, and not actually
      // the rendered content itself, we want React to know that the item
      // being rendered is the same even though it might have been reordered
      // within the DraggableItemList. This hint lets React avoid recreating
      // downstream elements (like input elements). Also, choosing to use index
      // instead of some unique identifier for this item's value since there is
      // no restriction on the items of the ZenArray. There could be duplicates.
      output.push(
        <DraggableItem
          key={`${dragCycleId}--${itemIdx}`}
          dragMovementBounds="parent"
          dragRestrictionSelector={dragRestrictionSelector}
          extraEventData={i}
          onDrag={this.onDrag}
          onDragEnd={this.onDragEnd}
          onDragStart={this.onDragStart}
          style={style}
        >
          {renderItem(items.get(itemIdx))}
        </DraggableItem>,
      );
    }
    return output;
  }

  render(): React.Element<'div'> {
    return <div className="ui-draggable-item-list">{this.renderItems()}</div>;
  }
}
