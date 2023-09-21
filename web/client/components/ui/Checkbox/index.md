Here's a Checkbox with an event handler, tracking the checked value in state:

```jsx
const [checked, setChecked] = React.useState(false);

function toggleCheckedValue() {
  setChecked(!checked);
}

<Checkbox
  value={checked}
  onChange={toggleCheckedValue}
  label="Checkbox!"
  labelPlacement="left"
/>
```

Checkbox with custom icon:
```jsx
import Icon from 'components/ui/Icon';

const [checked, setChecked] = React.useState(false);

function toggleCheckedValue() {
  setChecked(!checked);
}

<Checkbox
  label="Toggle Visibility"
  labelPlacement="left"
  value={checked}
  onChange={toggleCheckedValue}
>
  {checked ? <Icon type="eye-close" /> : <Icon type="eye-open" />}
</Checkbox>
```

Disabled checkbox:
```jsx
const [checked, setChecked] = React.useState(true);

function toggleCheckedValue() {
  setChecked(!checked);
}

<Checkbox
  disabled
  label="Disabled"
  value={checked}
  onChange={toggleCheckedValue}
/>
```
