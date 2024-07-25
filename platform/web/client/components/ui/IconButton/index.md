Basic IconButtons.

```jsx
<>
  <IconButton type="chevron-left" onClick={() => alert('Clicked!')} />
  <IconButton type="cog" onClick={() => alert('Clicked!')} />
  <IconButton type="svg-star-in-circle" onClick={() => alert('Clicked!')} />
</>
```

IconButtons with different intents.

```jsx
import Intents from 'components/ui/Intents';
<>
  <IconButton
    type="svg-cancel-outline"
    intent={Intents.DANGER}
    onClick={() => alert('Clicked!')}
  />
  <IconButton
    type="svg-check-circle-outline"
    intent={Intents.SUCCESS}
    onClick={() => alert('Clicked!')}
  />
</>;
```
