```jsx
import Group from 'components/ui/Group';
import RadioGroup from 'components/ui/RadioGroup';

<Group.Vertical>
  <RadioGroup.Uncontrolled initialValue="first">
    <RadioGroup.Item value="first">First option</RadioGroup.Item>
    <RadioGroup.Item value="second">Second option</RadioGroup.Item>
    <RadioGroup.Item value="third">Third option</RadioGroup.Item>
    <RadioGroup.Item disabled value="fourth">Disabled fourth option</RadioGroup.Item>
  </RadioGroup.Uncontrolled>
</Group.Vertical>
```

Items can also be rendered vertically:
```jsx
import Group from 'components/ui/Group';
import RadioGroup from 'components/ui/RadioGroup';

<Group.Vertical>
  <RadioGroup.Uncontrolled initialValue="first" direction="vertical">
    <RadioGroup.Item value="first">First option</RadioGroup.Item>
    <RadioGroup.Item value="second">Second option</RadioGroup.Item>
    <RadioGroup.Item value="third">Third option</RadioGroup.Item>
    <RadioGroup.Item disabled value="fourth">Disabled fourth option</RadioGroup.Item>
  </RadioGroup.Uncontrolled>
</Group.Vertical>
```
