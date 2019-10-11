Here's an uncontrolled Checkbox example:

```jsx
<Checkbox.Uncontrolled
  initialValue={false}
  label="Uncontrolled Checkbox"
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

<Checkbox.Uncontrolled
  initialValue={false}
  onChange={toggleCheckedValue}
  label="Toggle Visibility"
  labelPlacement="left"
>
  {state.checked ? <Icon type="eye-close" /> : <Icon type="eye-open" />}
</Checkbox.Uncontrolled>
```

Disabled checkbox:
```jsx

<Checkbox.Uncontrolled
  initialValue
  disabled
  label="Disabled"
/>
```
