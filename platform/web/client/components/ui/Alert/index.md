```jsx
import Group from 'components/ui/Group';

<Group.Vertical spacing="s">
  <Alert title="This is the default alert style" />
  <Alert intent="success" title="This is the success alert style" />
  <Alert intent="warning" title="This is the warning alert style" />
  <Alert intent="error" title="This is the error alert style" />
</Group.Vertical>;
```

Alerts with descriptions

```jsx
import Group from 'components/ui/Group';

const DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

<Group.Vertical spacing="s">
  <Alert title="This is the default alert style">{DESCRIPTION}</Alert>
  <Alert intent="success" title="This is the success alert style">
    {DESCRIPTION}
  </Alert>
  <Alert intent="warning" title="This is the warning alert style">
    {DESCRIPTION}
  </Alert>
  <Alert intent="error" title="This is the error alert style">
    {DESCRIPTION}
  </Alert>
</Group.Vertical>;
```

Alerts with tooltips

```jsx
import Group from 'components/ui/Group';

<Group.Vertical spacing="s">
  <Alert
    intent="success"
    title="This alert's icon has a tooltip"
    tooltipText="Yay — success!"
  />
  <Alert intent="success" title="This alert's icon does not have a tooltip" />
</Group.Vertical>;
```

Card appearance

- The card appearance is useful if the alert is presented as a standalone item on the page.

```jsx
import Group from 'components/ui/Group';

<Group.Vertical spacing="s">
  <Alert card title="This is the default alert card style" />
  <Alert card intent="success" title="This is the success alert card style" />
  <Alert card intent="warning" title="This is the warning alert card style" />
  <Alert card intent="error" title="This is the error alert card style" />
</Group.Vertical>;
```
