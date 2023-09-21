Different heading sizes:
```jsx
<>
  <Heading size={Heading.Sizes.LARGE}>Heading Large</Heading>
  <Heading size={Heading.Sizes.MEDIUM}>Heading Medium</Heading>
  <Heading size={Heading.Sizes.SMALL}>Heading Small</Heading>
</>
```

Headings can be specified more succinctly by using `<Heading.Large>` or `<Heading.Small>` components:
```jsx
<>
  <Heading.Large>Heading Large</Heading.Large>
  <Heading.Medium>Heading Medium</Heading.Medium>
  <Heading.Small>Heading Small</Heading.Small>
</>
```

Headings can be underlined easily by adding an `underlined` prop:
```jsx
import Group from 'components/ui/Group';

<Group.Horizontal spacing="l">
  <Heading.Large underlined>Heading Large</Heading.Large>
  <Heading.Medium underlined>Heading Medium</Heading.Medium>
  <Heading.Small underlined>Heading Small</Heading.Small>
</Group.Horizontal>
```

Heading with a tooltip:
```jsx
<Heading.Large infoTooltip="This is a tooltip">Heading with a tooltip</Heading.Large>
```
