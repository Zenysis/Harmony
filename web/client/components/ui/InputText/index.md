```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

const [value, setValue] = React.useState('');

<LabelWrapper inline label="Name">
  <InputText value={value} onChange={setValue} placeholder="Placeholder Text" />
</LabelWrapper>
```

Some inputs can automatically validate their own input based on the HTML `type` attribute. For example, here is an invalid email:

```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

const [value, setValue] = React.useState('this is not an email');

<LabelWrapper inline label="Email">
  <InputText value={value} onChange={setValue} type="email" />
</LabelWrapper>
```

You can also manually control the invalid state if you want, but you'll have to implement your own validation logic for that:
```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

const [value, setValue] = React.useState('Hello');

<LabelWrapper inline label="Only allow 3 characters:">
  <InputText
    invalid={value.length > 3}
    invalidMessage="This string is too long"
    value={value}
    onChange={setValue}
  />
</LabelWrapper>
```

Disabled input:
```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

const [value, setValue] = React.useState('');

<LabelWrapper inline label="Email">
  <InputText
    disabled
    value={value}
    onChange={setValue}
    placeholder="This input is disabled"
  />
</LabelWrapper>
```

With embedded icon:
```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

const [value, setValue] = React.useState('');

<LabelWrapper inline label="Search">
  <InputText
    icon="search"
    value={value}
    onChange={setValue}
    placeholder="Placeholder Text"
  />
</LabelWrapper>
```
