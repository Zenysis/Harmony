Look at the [`<List>`](#list) component for more examples.

```jsx
import Group from 'components/ui/Group';
import List from 'components/ui/List';

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
  <List>{items}</List>
</>
```
