```jsx
const dataPoints = [
  { color: '#4e79a7', key: 'Female', value: 166745677 },
  { color: '#f28e2c', key: 'Male', value: 161493846 },
];

const highlightedSegments = ['Female'];

function renderLegendRow({ color, key }) {
  return (
    <div key={key} style={{ alignItems: 'center', display: 'flex' }}>
      <div style={{ backgroundColor: color, height: 14, marginRight: 8, width: 14 }} />
      <div>{key}</div>
    </div>
  );
}

<React.Fragment>
  <h5>US Population - 2019 Estimate</h5>
  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
    <PieChart
      dataPoints={dataPoints}
      height={300}
      title="Default chart behavior"
      width={300}
    />
    <PieChart
      dataPoints={dataPoints}
      height={300}
      highlightedSegments={highlightedSegments}
      title="Highlighted chart"
      width={300}
    />
    <PieChart
      dataPoints={dataPoints}
      donut
      height={300}
      highlightedSegments={highlightedSegments}
      title="Highlighted donut chart"
      width={300}
    />
  </div>
  <div style={{ marginTop: 20 }}>
    {dataPoints.map(renderLegendRow)}
  </div>
</React.Fragment>
```
