This is a basic list with hoverable items:

```jsx
<List hoverableItems spacing="m">
  <List.Item>
    First item
  </List.Item>
  <List.Item>
    Second item
  </List.Item>
  <List.Item>
    Third item
  </List.Item>
</List>
```

A typical use case is to render a list of properties:

```jsx
import Group from 'components/ui/Group';

const properties = {
  Name: 'Ian Webster',
  Email: 'ian@zenysis.com',
  Office: 'San Francisco',
};

const items = Object.keys(properties).map(key =>
  <List.Item key={key}>
    <Group.Horizontal firstItemStyle={{ width: 100 }}>
      <>{key}</>
      <>{properties[key]}</>
    </Group.Horizontal>
  </List.Item>
);

<List spacing="s">{items}</List>
```

Items can also be clickable by using `<List.ClickableItem>`

```jsx
import Group from 'components/ui/Group';

const [clickedOn, setClickedOn] = React.useState('');

const properties = {
  Name: 'Ian Webster',
  Email: 'ian@zenysis.com',
  Office: 'San Francisco',
};

const items = Object.keys(properties).map(key =>
  <List.ClickableItem key={key} value={key} onClick={setClickedOn}>
    <Group.Horizontal firstItemStyle={{ width: 100 }}>
      <>{key}</>
      <>{properties[key]}</>
    </Group.Horizontal>
  </List.ClickableItem>
);

<>
  <p>Clicked on: <strong>{clickedOn}</strong></p>
  <List spacing="s">{items}</List>
</>
```

You can have more control over how the list renders by using the `noBorder` and `noSeparators` props:

```jsx
import Group from 'components/ui/Group';

const properties = {
  Name: 'Ian Webster',
  Email: 'ian@zenysis.com',
  Office: 'San Francisco',
};

const items = Object.keys(properties).map(key =>
  <List.Item key={key}>
    <Group.Horizontal firstItemStyle={{ width: 100 }}>
      <b>{key}</b>
      <>{properties[key]}</>
    </Group.Horizontal>
  </List.Item>
);

<List spacing="s" hoverableItems noBorder noSeparators>{items}</List>
```
