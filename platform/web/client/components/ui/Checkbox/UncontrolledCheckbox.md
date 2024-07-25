Here's an uncontrolled Checkbox example:

```jsx
import Checkbox from 'components/ui/Checkbox';

<Checkbox.Uncontrolled
  initialValue={false}
  label="Uncontrolled Checkbox"
  labelPlacement="left"
/>
```

Checkbox with custom icon:
```jsx
import Checkbox from 'components/ui/Checkbox';
import Icon from 'components/ui/Icon';

const [checked, setChecked] = React.useState(false);

function toggleCheckedValue() {
  setChecked(!checked);
}

<Checkbox.Uncontrolled
  initialValue={false}
  onChange={toggleCheckedValue}
  label="Toggle Visibility"
  labelPlacement="left"
>
  {checked ? <Icon type="eye-close" /> : <Icon type="eye-open" />}
</Checkbox.Uncontrolled>
```

Disabled checkbox:
```jsx
import Checkbox from 'components/ui/Checkbox';

<Checkbox.Uncontrolled
  initialValue
  disabled
  label="Disabled"
/>
```
