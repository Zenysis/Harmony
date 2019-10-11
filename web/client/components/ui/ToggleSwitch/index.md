
```jsx
initialState = {
  enabled: true
};

function toggleState() {
  setState(prevState => (
    { enabled: !prevState.enabled }
  ));
}

<ToggleSwitch
  onChange={toggleState}
  value={state.enabled}
/>
```
