```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

<LabelWrapper inline label="Name">
  <InputText.Uncontrolled initialValue="" placeholder="Placeholder Text" />
</LabelWrapper>
```

Some inputs can automatically validate input based on the input `type`. For example, here is an invalid email:

```jsx
<LabelWrapper inline label="Email">
  <InputText.Uncontrolled
    initialValue="this is not an email"
    type="email"
  />
</LabelWrapper>
```

Disabled input:
```jsx
<LabelWrapper inline label="Email">
  <InputText.Uncontrolled
    disabled
    initialValue=""
    placeholder="This input is disabled"
  />
</LabelWrapper>
```

With embedded icon:
```jsx
<LabelWrapper inline label="Search">
  <InputText.Uncontrolled
    icon="search"
    initialValue=""
    placeholder="Placeholder Text"
  />
</LabelWrapper>
```
