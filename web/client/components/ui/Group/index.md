Wrap your components in a `<Group.Horizontal>` or `<Group.Vertical>` tag to easily
apply standardized spacing between them. You can choose to use exact pixel spacing,
or to use relative `em` spacing (which is relative to the font size of elements).
You can even nest groups!

```jsx
import Button from 'components/ui/Button';

<Group.Vertical>
  <Group.Horizontal spacing="m" spacingUnit="em">
    <Button intent="primary">Button 1</Button>
    <Button intent="success">Button 2</Button>
    <Button intent="danger">Button 3</Button>
  </Group.Horizontal>
  <Group.Horizontal spacing="m" spacingUnit="px">
    <Button intent="primary">Button 1</Button>
    <Button intent="success">Button 2</Button>
    <Button intent="danger">Button 3</Button>
  </Group.Horizontal>
</Group.Vertical>
```

You can even apply spacing between `React.Fragment` components:
```js
<Group.Horizontal spacing="s">
  <>Hello</>
  <>All</>
  <>These</>
  <>Words</>
  <>Are</>
  <>Spaced</>
</Group.Horizontal>
```

You can apply styles to all of your items by using the `itemStyle` prop. Look at how we use that along with the `flex` property to create two columns:

```jsx
<Group.Horizontal flex spacing="none" itemStyle={{ flex: 1 }}>
  <p>This is text in column 1</p>
  <p>This is text in column 2</p>
</Group.Horizontal>
```

Since passing `flex` values are so common, we have a prop to let you specify an item's flex value without having to pass a style object:
```jsx
<Group.Horizontal flex spacing="none" itemFlexValue={1}>
  <p>This is text in column 1</p>
  <p>This is text in column 2</p>
</Group.Horizontal>
```

We saw in our first example how we could group things vertically, but you can even combine it with the `flex` property to make more interesting alignments. For example, lets evenly space out 3 buttons across a 200px height. We can use the `justifyContent` prop to easily space out the elements:
```jsx
import Button from 'components/ui/Button';

<Group.Vertical
  flex
  spacing="none"
  justifyContent="space-between"
  style={{ height: 200 }}
>
  <Button intent="primary">Button 1</Button>
  <Button intent="success">Button 2</Button>
  <Button intent="danger">Button 3</Button>
</Group.Vertical>
```
The `Group` component also exposes `alignItems` and `alignContent` props which are also commonly used with flex layouts.

Sometimes, we might have exceptions where we want to apply styles to **only** the first or last
item. There are some convenient props to help us with that:
```jsx
import Button from 'components/ui/Button';

<Group.Horizontal
  firstItemStyle={{ border: '2px solid blue' }}
  lastItemStyle={{ border: '2px solid red' }}
>
  <Button intent="primary">Button 0</Button>
  <Button intent="primary">Button 1</Button>
  <Button intent="primary">Button 2</Button>
  <Button intent="primary">Button 3</Button>
  <Button intent="primary">Button 4</Button>
</Group.Horizontal>
```

For even more granular control on individual items, you should use the [`<Spacing>`](#spacing) component to wrap your contents. Since you already imported the `Group` component, you can use the `Group.Item` alias to refer to `Spacing`, so you don't have to add another import.
Any attributes you specify in a `<Group.Item>` will override the values set by the `<Group>`. Look at how we can use it to apply a specific margin and padding for an individual item:
```jsx
import Button from 'components/ui/Button';

<Group.Horizontal>
  <Button intent="primary">Button 0</Button>
  <Button intent="primary">Button 1</Button>
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
