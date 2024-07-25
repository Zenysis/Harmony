```jsx
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

<LabelWrapper inline label="Name">
  <InputText.Uncontrolled initialValue="" placeholder="Placeholder Text" />
</LabelWrapper>
```

Some inputs can automatically validate their own input based on the HTML `type` attribute. For example, here is an invalid email:

```jsx
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

<LabelWrapper inline label="Email">
  <InputText.Uncontrolled
    initialValue="this is not an email"
    type="email"
  />
</LabelWrapper>
```

You can also manually control the invalid state if you want, but you'll have to implement your own validation logic for that:
```jsx
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

const [value, setValue] = React.useState('Hello');

<LabelWrapper inline label="Only allow 3 characters:">
  <InputText.Uncontrolled
    invalid={value.length > 3}
    invalidMessage="This string is too long"
    initialValue={value}
    onChange={setValue}
  />
</LabelWrapper>
```

Disabled input:
```jsx
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

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
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';

<LabelWrapper inline label="Search">
  <InputText.Uncontrolled
    icon="search"
    initialValue=""
    placeholder="Placeholder Text"
  />
</LabelWrapper>
```
