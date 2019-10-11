RangePicker example:
```jsx
const values = [];
for(let i = 0; i <= 10; i++) {
  values.push(i);
}

initialState = {
  end: 10,
  start: 0,
};

function onRangeChange(start, end) {
  setState({ start, end });
}


<RangeSlider
  initialStart={state.start}
  initialEnd={state.end}
  onRangeChange={onRangeChange}
  values={values}
/>
```

Custom objects:
```jsx
const values = [
  { color: 'red' },
  { color: 'orange' },
  { color: 'yellow' },
  { color: 'green' },
  { color: 'blue' },
  { color: 'indigo' },
  { color: 'violet' },
  { color: 'white' },
  { color: 'black' }
];

initialState = {
  values,
  end: values[values.length - 1],
  start: values[0],
};

function onRangeChange(start, end) {
  setState({ start, end });
}

function valueFormatter(value) {
  return value.color;
}

<RangeSlider
  initialStart={state.start}
  initialEnd={state.end}
  onRangeChange={onRangeChange}
  valueFormatter={valueFormatter}
  values={state.values}
/>
```
