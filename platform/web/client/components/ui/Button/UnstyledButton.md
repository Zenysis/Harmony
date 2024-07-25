Basic button:

```jsx
import Button from 'components/ui/Button';

<Button.Unstyled onClick={() => alert('I have been clicked')}>I am a button</Button.Unstyled>
```

Disabled button:

```jsx
import Button from 'components/ui/Button';

<Button.Unstyled disabled onClick={() => alert('You should never see this. This should not fire!')}>
  Disabled
</Button.Unstyled>
```
