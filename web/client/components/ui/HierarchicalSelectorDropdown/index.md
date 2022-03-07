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

const EMPTY_TREE = HierarchyItem.createRoot();
const [selectedItem, setSelectedItem] = React.useState(undefined);

<React.Fragment>
  <HierarchicalSelectorDropdown
    defaultDropdownText={'Select Item'}
    enableSearch
    hierarchyRoot={TREE}
    onItemSelected={setSelectedItem}
    selectedItem={selectedItem}
  />
</React.Fragment>
```
