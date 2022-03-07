```jsx
const primaryNumber = {
  label: 'Number of private hospitals',
  value: 1000,
};

const secondaryNumber = {
  label: 'of total hospitals',
  value: '53%',
};

const theme = {
  primaryNumber: {
    displayValueAsPill: true,
    labelFontSize: 20,
    valueFontColor: '#C70039',
    valueFontSize: 36,
  },
  secondaryNumber: {
    fontSize: 14,
    valueFontColor: '#FF5733',
  },
};

<div
  style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}
>
  <NumberTrend primaryNumber={primaryNumber} trendPoints={[]} />
  <NumberTrend
    primaryNumber={primaryNumber}
    secondaryNumber={secondaryNumber}
    trendPoints={[]}
  />
  <NumberTrend
    primaryNumber={primaryNumber}
    secondaryNumber={secondaryNumber}
    theme={theme}
    trendPoints={[]}
  />
</div>;
```
