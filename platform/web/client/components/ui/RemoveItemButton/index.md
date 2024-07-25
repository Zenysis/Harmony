A simple remove button.

```jsx
import Spacing from 'components/ui/Spacing';

<Spacing flex>
  <RemoveItemButton onClick={() => alert('Removed!')} />
</Spacing>
```

The remove button with a tooltip.
```jsx
import Spacing from 'components/ui/Spacing';

<Spacing flex>
  <RemoveItemButton
    onClick={() => alert('Removed!')}
    tooltipText="Remove this item"
  />
</Spacing>
```
