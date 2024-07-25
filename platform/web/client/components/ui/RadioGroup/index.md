```jsx
import Group from 'components/ui/Group';

const [selectedItem, setSelectedItem] = React.useState('first');

<Group.Vertical>
  <p>Selected item is: {selectedItem}</p>

  <RadioGroup value={selectedItem} onChange={setSelectedItem}>
    <RadioGroup.Item value="first">First option</RadioGroup.Item>
    <RadioGroup.Item value="second">Second option</RadioGroup.Item>
    <RadioGroup.Item value="third">Third option</RadioGroup.Item>
    <RadioGroup.Item disabled value="fourth">Disabled fourth option</RadioGroup.Item>
  </RadioGroup>
</Group.Vertical>
```

Items can also be rendered vertically:
```jsx
import Group from 'components/ui/Group';

const [selectedItem, setSelectedItem] = React.useState('first');

<Group.Vertical>
  <p>Selected item is: {selectedItem}</p>

  <RadioGroup
    value={selectedItem}
    onChange={setSelectedItem}
    direction="vertical"
  >
    <RadioGroup.Item value="first">First option</RadioGroup.Item>
    <RadioGroup.Item value="second">Second option</RadioGroup.Item>
    <RadioGroup.Item value="third">Third option</RadioGroup.Item>
    <RadioGroup.Item disabled value="fourth">Disabled fourth option</RadioGroup.Item>
  </RadioGroup>
</Group.Vertical>
```
