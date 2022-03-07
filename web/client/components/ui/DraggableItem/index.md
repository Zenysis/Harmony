DraggableItem examples:

This item can be dragged anywhere on the page:
```jsx
import Tag from 'components/ui/Tag';

<DraggableItem style={{ display: 'inline-block' }}>
  <Tag>Drag me anywhere!</Tag>
</DraggableItem>
```

This item can only be dragged within the parent container:
```jsx
import Tag from 'components/ui/Tag';
import Well from 'components/ui/Well';

const WELL_STYLE = {
  height: '80px',
  margin: 0,
  position: 'relative',
};

<Well size="small" style={WELL_STYLE}>
  <DraggableItem
    dragMovementBounds="parent"
    style={{ display: 'inline-block' }}
  >
    <Tag>I can only be dragged inside this box</Tag>
  </DraggableItem>
</Well>
```

This item can only be dragged within containers that match the selector:
```jsx
import Tag from 'components/ui/Tag';
import Well from 'components/ui/Well';

const WELL_STYLE = {
  height: '80px',
  margin: 0,
  position: 'relative',
  width: '40%',
};
<Well className="example-drag-container" size="small" style={WELL_STYLE}>
  <DraggableItem
    dragMovementBounds=".example-drag-container"
    style={{ display: 'inline-block' }}
  >
    <Tag>I can only be dragged inside this box</Tag>
  </DraggableItem>
</Well>
```

This item can only be dragged within a bounding area:
```jsx
import Tag from 'components/ui/Tag';

const DRAG_BOUNDS = {
  bottom: 50,
  left: -50,
  right: 50,
  top: -50,
};

<DraggableItem
  dragMovementBounds={DRAG_BOUNDS}
  style={{ display: 'inline-block' }}
>
  <Tag>I can only be dragged dragged 50px in any direction</Tag>
</DraggableItem>
```

This item can only be dragged by its handle:
```jsx
import DragHandle from 'components/ui/DraggableItem/DragHandle';
import Tag from 'components/ui/Tag';

<DraggableItem
  dragRestrictionSelector={DragHandle.DEFAULT_SELECTOR}
  style={{ display: 'inline-block' }}
>
  <Tag>
    <DragHandle />
    <span>Drag me using the handle</span>
  </Tag>
</DraggableItem>
```
