DraggableItemList example:

```jsx
import DragHandle from 'components/ui/DraggableItem/DragHandle';
import Tag from 'components/ui/Tag';
import Well from 'components/ui/Well';

// Define a function that the DraggableItemList can use to
// render an item in the list.
function renderItem(item) {
  return (
    <Tag style={{ textAlign: 'left', width: '80px' }}>
      <DragHandle />
      <span>{item}</span>
    </Tag>
  );
}

// Initialize the item list to draw.
const [items, setItems] = React.useState(
  ZenArray.create([
    'Item A',
    'Item B',
    'Item C',
    'Item D',
  ]),
);

// After the user drags an item into a new position, store the updated order.
function updateItems(newItems) {
  setItems(newItems);
}


<Well size="small" style={{ margin: 0, width: '100px' }}>
  <DraggableItemList
    dragRestrictionSelector={DragHandle.DEFAULT_SELECTOR}
    items={items}
    onItemOrderChanged={updateItems}
    renderItem={renderItem}
  />
</Well>
```
