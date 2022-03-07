```jsx
import ElementResizeService from 'services/ui/ElementResizeService';

const [drilldownSelection, setDrilldownSelection] = React.useState(undefined);
const [selectedSegments, setSelectedSegments] = React.useState([]);
const [size, setSize] = React.useState({ height: 10, width: 10 });

// Adjust the contaienr size when the styleguide page is resized.
const resizeRegistration = ElementResizeService.register(({ contentRect }) => {
  setSize({ height: contentRect.height, width: contentRect.width });
});

// Smartphone sales data from: https://www.statista.com/statistics/412108/global-smartphone-shipments-global-region/
const salesDataTree = {
  children: [
    {
      levels: { year: '2013' },
      segments: { r0: 50.9, r1: 359.0, r2: 68.3, r3: 96.9, r4: 68.7, r5: 99.8, r6: 139.1, r7: 115.4 },
    },
    {
      levels: { year: '2014' },
      segments: { r0: 69.3, r1: 392.8, r2: 65.1, r3: 148.6, r4: 108.5, r5: 135.8, r6: 177.2, r7: 127.9 },
    },
    {
      levels: { year: '2015' },
      segments: { r0: 71.5, r1: 385.3, r2: 73.4, r3: 197.9, r4: 108.4, r5: 157.5, r6: 191.0, r7: 135.4 },
    },
    {
      levels: { year: '2016' },
      segments: { r0: 78.0, r1: 448.5, r2: 72.9, r3: 214.5, r4: 105.9, r5: 168.9, r6: 198.2, r7: 131 },
    },
    {
      levels: { year: '2017' },
      segments: { r0: 85.2, r1: 454.4, r2: 68.5, r3: 232.7, r4: 115.8, r5: 176.5, r6: 201.3, r7: 125.6 },
    },
  ],
  levels: {},
  segments: { r0: 354.9, r1: 2040, r2: 348.2, r3: 890.6, r4: 507.3, r5: 738.5, r6: 906.8, r7: 635.3 },
};

const drilldownLevels = ['year'];

const segments = [
  { color: '#4e79a7', id: 'r0', label: 'Central & Eastern Europe' },
  { color: '#f28e2c', id: 'r1', label: 'China' },
  { color: '#e15759', id: 'r2', label: 'Developed APAC' },
  { color: '#76b7b2', id: 'r3', label: 'Emerging APAC' },
  { color: '#59a14f', id: 'r4', label: 'Latin America' },
  { color: '#edc949', id: 'r5', label: 'Middle East & Africa' },
  { color: '#af7aa1', id: 'r6', label: 'North America' },
  { color: '#ff9da7', id: 'r7', label: 'Western Europe' },
];

<div ref={resizeRegistration.setRef}>
  <h5>Smartphone Sales by Region and Year (2013 - 2017)</h5>
  <PieChartDrilldown
    drilldownLevels={drilldownLevels}
    drilldownSelection={drilldownSelection}
    height={400}
    onDrilldownSelectionChange={setDrilldownSelection}
    onSelectedSegmentsChange={setSelectedSegments}
    root={salesDataTree}
    rootNodeName="Total"
    segmentOrder={segments}
    selectedSegments={selectedSegments}
    width={size.width}
  />
</div>
```
