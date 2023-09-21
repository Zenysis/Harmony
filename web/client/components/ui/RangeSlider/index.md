RangePicker example:
```jsx
const values = [];
for(let i = 0; i <= 10; i++) {
  values.push(i);
}

const [range, setRange] = React.useState({
  end: 10,
  start: 0,
});

function onRangeChange(start, end) {
  setRange({ start, end });
}


<RangeSlider
  initialStart={range.start}
  initialEnd={range.end}
  onRangeChange={onRangeChange}
  values={values}
/>
```

Custom objects:
```jsx
const [values, setValues] = React.useState([
  { color: 'red' },
  { color: 'orange' },
  { color: 'yellow' },
  { color: 'green' },
  { color: 'blue' },
  { color: 'indigo' },
  { color: 'violet' },
  { color: 'white' },
  { color: 'black' }
]);

const [range, setRange] = React.useState({
  end: values[values.length - 1],
  start: values[0],
});

React.useEffect(() => {
  setRange({
    end: values[values.length - 1],
    start: values[0],
  });
}, [values]);

function onRangeChange(start, end) {
  setRange({ start, end });
}

function valueFormatter(value) {
  return value.color;
}

<RangeSlider
  initialStart={range.start}
  initialEnd={range.end}
  onRangeChange={onRangeChange}
  valueFormatter={valueFormatter}
  values={values}
/>
```
