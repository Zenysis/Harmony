Hierarchical selector examples without search, with search and with search whilst waiting for data to load:

```jsx
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';

// HierarchyItems derive their names from a wrapped metadata object
// We're creating a dummy class here called Item that will be the wrapped metadata
class Item {
  constructor(name) {
    this._name = name;
  }

  name() {
    return this._name;
  }
}

// Create an example tree
const TREE = HierarchyItem.createRoot().children(
  ZenArray.create([
    HierarchyItem.create({
      id: '0.0',
      metadata: new Item('First'),
      children: ZenArray.create([
        HierarchyItem.create({ id: '1.0', metadata: new Item('First child') }),
        HierarchyItem.create({ id: '1.1', metadata: new Item('Second child') }),
      ]),
    }),
    HierarchyItem.create({ id: '0.1', metadata: new Item('Second') }),
  ])
);

const EMPTY_TREE = HierarchyItem.createRoot()

// Create a function to determine the column title based on the selected
// hierarchy item
function getColumnTitle(hierarchyItem) {
  if (hierarchyItem.isHierarchyRoot()) {
    return 'Root';
  }
  return hierarchyItem.name();
}

<React.Fragment>
  <div>
    <HierarchicalSelector
      hierarchyRoot={TREE}
      maxWidth={900}
      columnTitleGenerator={getColumnTitle}
    />
  </div>
  <div style={{ marginTop: 20 }}>
    <HierarchicalSelector
      enableSearch
      hierarchyRoot={TREE}
      maxWidth={900}
      columnTitleGenerator={getColumnTitle}
    />
  </div>
  <div style={{ marginTop: 20 }}>
    <HierarchicalSelector
      hierarchyLoaded={false}
      enableSearch
      hierarchyRoot={EMPTY_TREE}
      maxWidth={900}
      columnTitleGenerator={getColumnTitle}
    />
  </div>
</React.Fragment>
```
