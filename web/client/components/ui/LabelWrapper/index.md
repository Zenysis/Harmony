If you are wrapping a form control, you should use the `htmlFor` prop in order to associate your label to the control. You will need the id on the control to match the id in the `htmlFor` prop.

For example, you will notice that if you click on the label, the InputText will be focused:
```jsx
import InputText from 'components/ui/InputText';

<LabelWrapper inline label="Name" htmlFor="my-input">
  <InputText id="my-input" initialValue="" placeholder="Enter name" />
</LabelWrapper>
```

Wrapping a Button:
```jsx
import Button from 'components/ui/Button';

<LabelWrapper label="Click me!">
  <Button onClick={() => alert('omg')}>Some Button</Button>
</LabelWrapper>
```

Wrapping a button inline:
```jsx
import Button from 'components/ui/Button';

<LabelWrapper inline label="Click me!">
  <Button onClick={() => alert('omg')}>Some Button</Button>
</LabelWrapper>
```

Wrapping a button inline with the label placed after:
```jsx
import Button from 'components/ui/Button';

<LabelWrapper
  boldLabel
  labelAfter
  inline
  label="Click me! (Also, this label is bold)"
>
  <Button onClick={() => alert('omg')}>Some Button</Button>
</LabelWrapper>
```
