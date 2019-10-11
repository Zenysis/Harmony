```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

initialState = {
  value: '',
};

function onChange(value) {
  setState({ value });
}

<LabelWrapper inline label="Name">
  <InputText value={state.value} onChange={onChange} placeholder="Placeholder Text" />
</LabelWrapper>
```

Some inputs can automatically validate input based on the input `type`. For example, here is an invalid email:

```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

initialState = {
  value: 'this is not an email',
};

function onChange(value) {
  setState({ value });
}

<LabelWrapper inline label="Email">
  <InputText value={state.value} onChange={onChange} type="email" />
</LabelWrapper>
```

Disabled input:
```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

initialState = {
  value: '',
};

function onChange(value) {
  setState({ value });
}

<LabelWrapper inline label="Email">
  <InputText
    disabled
    value={state.value}
    onChange={onChange}
    placeholder="This input is disabled"
  />
</LabelWrapper>
```

With embedded icon:
```jsx
import LabelWrapper from 'components/ui/LabelWrapper';

initialState = {
  value: '',
};

function onChange(value) {
  setState({ value });
}

<LabelWrapper inline label="Search">
  <InputText
    icon="search"
    value={state.value}
    onChange={onChange}
    placeholder="Placeholder Text"
  />
</LabelWrapper>
```

