Disabled Caret (unclickable, despite having an `onClick` event):
```jsx
<Caret isDisabled onClick={() => alert('Clicked!')}/>
```

Clickable caret, and changes direction when clicked:
```jsx
const [direction, setDirection] = React.useState(Caret.Directions.DOWN);

function toggleDirection() {
  const newDirection = direction === Caret.Directions.UP
    ? Caret.Directions.DOWN
    : Caret.Directions.UP;
  setDirection(newDirection);
}

<Caret direction={direction} onClick={toggleDirection} />
```
