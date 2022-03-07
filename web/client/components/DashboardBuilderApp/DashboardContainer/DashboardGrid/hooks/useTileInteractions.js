// @flow
import * as React from 'react';
import { utils as ReactGridLayoutUtils } from 'react-grid-layout';
import type {
  EventCallback as ReactGridEventCallback,
  LayoutItem as ReactGridPosition,
} from 'react-grid-layout/lib/utils';

type ReactGridLayoutEventProps = {
  onDrag: ReactGridEventCallback,
  onDragStart: ReactGridEventCallback,
  onDragStop: ReactGridEventCallback,
  onResize: ReactGridEventCallback,
  onResizeStart: ReactGridEventCallback,
  onResizeStop: ReactGridEventCallback,
};

// Convert the layout passed from ReactGridLayout inside an onDrag event into a
// layout we can actually show on the page. RGL doesn't perform compaction on
// the layout it provides to us, so we need to perform compaction ourselves to
// ensure that the tile outlines that are drawn on the page are in valid
// positions.
function buildLayoutAfterDrag(
  layout: $ReadOnlyArray<ReactGridPosition>,
  dragItemId: string,
): $ReadOnlyArray<ReactGridPosition> {
  // If no tiles were marked as being `moved`, we can just return the layout
  // directly. RGL only marks tiles as having moved if there was a collision
  // caused by dragging.
  // NOTE(stephen): This is an optimization. Technically, we could just perform
  // compaction every time, but compaction is slow, and onDrag can potentially
  // be called a lot.
  if (layout.every(l => !l.moved || l.i === dragItemId)) {
    return layout;
  }

  return ReactGridLayoutUtils.compact(layout, 'vertical', 48);
}

/**
 * This hook manages the various event interactions and behaviors that we want
 * to support when a user interacts with a dashboard tile.
 */
export default function useTileInteractions(): [
  string | void, // selected tile ID
  string | void, // hover tile ID
  boolean, // dragging in progress
  boolean, // editing of tile in progress
  boolean, // resizing in progress
  (string, SyntheticMouseEvent<HTMLElement>) => void, // onTileClick
  (boolean) => void, // onEditingChange
  (string) => void, // onHoverStart
  () => void, // onHoverStop
  $ReadOnlyArray<ReactGridPosition> | void, // Current layout during repositioning of tiles
  ReactGridLayoutEventProps,
] {
  const [editing, onEditingChange] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [resizing, setResizing] = React.useState(false);
  const [repositionedLayout, setRepositionedLayout] = React.useState(undefined);
  const [selectedTileId, setSelectedTileId] = React.useState<string | void>();
  const [hoverTileId, setHoverTileId] = React.useState<string | void>();

  // Store a reference to the placeholder position drawn by RGL during a drag
  // event.
  const placeholderItemRef = React.useRef<ReactGridPosition | void>();

  const onDragStart = React.useCallback(
    (layout: $ReadOnlyArray<ReactGridPosition>) => {
      setDragging(true);
      setRepositionedLayout(layout);
      placeholderItemRef.current = undefined;
    },
    [],
  );

  // When the user drags a tile, update the repositioned layout with the new
  // layout drawn on the screen.
  const onDrag = React.useCallback(
    (
      newLayout: $ReadOnlyArray<ReactGridPosition>,
      oldItem: mixed,
      newItem: mixed,
      placeholder: ?ReactGridPosition,
    ) => {
      // NOTE(stephen): This isn't actually possible, but the RGL types are
      // looser than they should be.
      if (!placeholder) {
        return;
      }

      // RGL's onDrag event sends back an updated layout that does not respect
      // compaction rules. If we were to set this newLayout directly, the tile
      // boundaries drawn on the screen would potentially be in positions that
      // are impossible (like leaving a gap that vertical compacting normally
      // would remove). We want to store a valid repositinedLayout, so when the
      // user performs a drag event, convert the newLayout into a valid layout
      // that respects compaction rules.
      // NOTE(stephen): To avoid performing potentially costly compaction every
      // time the user drags, we use the placeholder item as a proxy to detect
      // whether a new layout is actually being drawn. The placeholder item is
      // always drawn in a valid position on the page, so if the placeholder
      // item is different than the previous one, that means we have a new
      // layout to store.
      const { current } = placeholderItemRef;
      if (
        current === undefined ||
        current.x !== placeholder.x ||
        current.y !== placeholder.y
      ) {
        setRepositionedLayout(buildLayoutAfterDrag(newLayout, placeholder.i));
      }
      placeholderItemRef.current = placeholder;
    },
    [],
  );

  const onDragStop = React.useCallback(() => {
    setDragging(false);
    setRepositionedLayout(undefined);
    placeholderItemRef.current = undefined;
  }, []);

  const onResizeStart = React.useCallback(() => {
    setResizing(true);
    setRepositionedLayout(undefined);
  }, []);

  const onResizeStop = React.useCallback(() => {
    setResizing(false);
    setRepositionedLayout(undefined);
  }, []);

  // Callback for onDrag or onResize when ReactGridLayout will pass in the
  // updated (but not committed) layout. We need this so that we can redraw the
  // tile outlines.
  const onRepositionLayout = React.useCallback(
    (newLayout: $ReadOnlyArray<ReactGridPosition>) => {
      setRepositionedLayout(newLayout);
    },
    [],
  );

  const onHoverStart = React.useCallback(
    tileId => {
      if (editing) {
        return;
      }
      if (tileId !== hoverTileId) {
        setHoverTileId(tileId);
      }
    },
    [editing, hoverTileId],
  );

  const onHoverStop = React.useCallback(() => setHoverTileId(undefined), []);

  const onTileClick = React.useCallback(
    (tileId: string, event: SyntheticMouseEvent<HTMLElement>) => {
      // Stop the mouse event from propagating so that when a tile is clicked,
      // we don't also trigger the documents mouse click listener causing a
      // deselection.
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();

      if (tileId === selectedTileId || editing) {
        // We are clicking on an already selected tile.
        return;
      }
      // We are selecting a tile different than what is currently selected.
      setSelectedTileId(tileId);
    },
    [editing, selectedTileId],
  );

  const captureDocumentClicks = !dragging && !editing && !resizing;
  React.useEffect(() => {
    // If a tile is being repositioned, we don't want to capture click events
    // since the resized or dragged tile should remain selected.
    if (!captureDocumentClicks) {
      return;
    }

    // We are creating a document level event listen to handle mouse clicks
    // when they are signaling to deselect a TileContainer. The TileContainer
    // component stops the mouse clicks from propagating up to here if it is
    // what was clicked on.
    const onClickDocument = () => {
      setSelectedTileId(undefined);
    };

    // NOTE(moriah): We are using `setTimeout` here so that we can attach the
    // new listener after the browser has handled all in-progress mouse events.
    // If we didn't wait, it would be possible for the listener to get added
    // immediately after repositioning stops but still in time to detect a
    // `click` event. If that happens, then the tile will be deselected when we
    // don't want it to.
    setTimeout(() => {
      document.addEventListener('click', onClickDocument);
    }, 0);
    // eslint-disable-next-line consistent-return
    return () => {
      document.removeEventListener('click', onClickDocument);
    };
  }, [captureDocumentClicks]);

  // HACK(stephen): Add a body-level class when the user is editing so that we
  // can perform manual style changes to parts of the app that are outside the
  // `DashboardGrid` tree. The main change is to temporarily disable the
  // `DashboardHeader` buttons. Right now, the `editing` state does not
  // propagate that far up the tree, and we are not yet ready to move that up
  // farther. Using a body-level class lets us override styles in CSS while
  // deferring how we want to handle this behavior until later when we have a
  // better idea.
  React.useEffect(() => {
    // NOTE(stephen): This is not actually possible.
    if (!document.body) {
      return;
    }

    if (editing) {
      document.body.classList.add('gd-dashboard-editing-mode');
    } else {
      document.body.classList.remove('gd-dashboard-editing-mode');
    }
  }, [editing]);

  const reactGridLayoutEventProps = {
    onResize: onRepositionLayout,
    onDrag,
    onDragStart,
    onDragStop,
    onResizeStart,
    onResizeStop,
  };

  return [
    selectedTileId,
    hoverTileId,
    dragging,
    editing,
    resizing,
    onTileClick,
    onEditingChange,
    onHoverStart,
    onHoverStop,
    repositionedLayout,
    reactGridLayoutEventProps,
  ];
}
