A normal on/off toggle:

```jsx
const [enabled, setEnabled] = React.useState(true);

function toggleState() {
  setEnabled(!enabled);
}

<ToggleSwitch onChange={toggleState} value={enabled} />;
```

The toggle can also be used to switch between two options without the blue
highlight for either state:

```jsx
const [enabled, setEnabled] = React.useState(true);

function toggleState() {
  setEnabled(!enabled);
}

<ToggleSwitch
  onChange={toggleState}
  value={enabled}
  highlightEnabledState={false}
  disabledLabel="Cats"
  enabledLabel="Dogs"
/>;
```

We can also choose to label just the current state of the switch rather than having labels on both sides.

```jsx
const [enabled, setEnabled] = React.useState(false);

function toggleState() {
  setEnabled(!enabled);
}

<ToggleSwitch
  onChange={toggleState}
  value={enabled}
  displayLabels="left"
  disabledLabel="Magic Mode is disabled"
  enabledLabel="Magic Mode is enabled"
/>;
```

We can instead choose just one label to display in both the enabled and disabled states. This requires that we specify a side for the label.

```jsx
const [enabled, setEnabled] = React.useState(false);

function toggleState() {
  setEnabled(!enabled);
}

<ToggleSwitch
  onChange={toggleState}
  value={enabled}
  displayLabels="right"
  label="Enable magic mode"
/>;
```
