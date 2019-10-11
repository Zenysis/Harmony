Wrapping a Button:
```jsx
<LabelWrapper label="Click me!">
  <Button onClick={() => alert('omg')}>Some Button</Button>
</LabelWrapper>
```

Wrapping a Card:
```jsx
<LabelWrapper label="I can wrap anything">
  <Card>I AM UNSTOPPABLE</Card>
</LabelWrapper>
```

Wrapping a button inline:
```jsx
<LabelWrapper inline label="Click me!">
  <Button onClick={() => alert('omg')}>Some Button</Button>
</LabelWrapper>
```

Wrapping a button inline with the label placed after:
```jsx
<LabelWrapper
  boldLabel
  labelAfter
  inline
  label="Click me! (Also, this label is bold)"
>
  <Button onClick={() => alert('omg')}>Some Button</Button>
</LabelWrapper>
```
