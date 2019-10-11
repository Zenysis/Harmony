Disabled Caret (unclickable, despite having an `onClick` event):
```jsx
<Caret isDisabled onClick={() => alert('Clicked!')}/>
```

Clickable caret, and changes direction when clicked:
```jsx
initialState = {
  direction: Caret.Directions.DOWN,
};

function toggleDirection() {
  setState((prevState) => {
    if (prevState.direction === Caret.Directions.UP) {
      return { direction: Caret.Directions.DOWN };
    }
    return { direction: Caret.Directions.UP };
  });
}

<Caret direction={state.direction} onClick={toggleDirection} />
```
