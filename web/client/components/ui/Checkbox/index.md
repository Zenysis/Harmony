Here's a Checkbox with an event handler, tracking the checked value in state:

```jsx
initialState = {
  checked: false,
};

function toggleCheckedValue() {
  setState(prevState => (
    { checked: !prevState.checked }
  ));
}

<Checkbox
  value={state.checked}
  onChange={toggleCheckedValue}
  label="Checkbox!"
  labelPlacement="left"
/>
```

Checkbox with custom icon:
```jsx
import Icon from 'components/ui/Icon';

initialState = {
  checked: false,
};

function toggleCheckedValue() {
  setState(prevState => (
    { checked: !prevState.checked }
  ));
}

<Checkbox
  label="Toggle Visibility"
  labelPlacement="left"
  value={state.checked}
  onChange={toggleCheckedValue}
>
  {state.checked ? <Icon type="eye-close" /> : <Icon type="eye-open" />}
</Checkbox>
```

Disabled checkbox:
```jsx
initialState = {
  checked: true,
};

function toggleCheckedValue() {
  setState(prevState => (
    { checked: !prevState.checked }
  ));
}

<Checkbox
  disabled
  label="Disabled"
  value={state.checked}
  onChange={toggleCheckedValue}
/>
```
