**Using `<Spacing>` on its own:**

```jsx
import Button from 'components/ui/Button';

<>
  <Spacing paddingBottom="xl" style={{ borderBottom: '1px solid black' }}>
    <Button>This button has a padding-bottom</Button>
  </Spacing>

  This is text right below the button.
</>
```

`<Spacing>` allows for shorthand application of margin and paddings, similar to how you'd do with CSS: you can use `margin` to apply all margins, or `marginX` and `marginY` to apply only horizontal or vertical margins. Same goes for paddings:

```jsx
import Button from 'components/ui/Button';

<Spacing padding="xl" style={{ border: '1px solid black' }}>
  <Button>This button has padding in every direction</Button>
</Spacing>
```

**Using `<Spacing>` inside a `<Group>` container with `<Group.Item>`:**

You can use this component for more granular control on how individual items should render. In this example, buttons 1 and 3 were given custom stylings, and with Button 3 we went even further and gave it custom margins and paddings.
```jsx
import Button from 'components/ui/Button';
import Group from 'components/ui/Group';

<Group.Horizontal spacing="s">
  <Button intent="primary">Button 0</Button>
  <Group.Item style={{ border: '2px solid blue' }}>
    <Button intent="primary">Button 1</Button>
  </Group.Item>
  <Button intent="primary">Button 2</Button>
  <Group.Item
    marginLeft="m"
    marginRight="xl"
    paddingLeft="l"
    style={{ border: '3px solid green' }}
  >
    <Button intent="primary">Button 3</Button>
  </Group.Item>
  <Button intent="primary">Button 4</Button>
</Group.Horizontal>
```
