
The initial implementation of the EpiCurve visualization using vx

<style>
  .inline {
    display: inline-block;
  }
</style>

```jsx
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import { createSampleData } from 'components/ui/visualizations/EpiCurve/mocks';

const initialData = createSampleData()

const [binCount, setBinCount] = React.useState(10);
const data = React.useMemo(
  () => createSampleData(binCount),
  [binCount],
);

<div>
  <LabelWrapper label="Bin Count" inline className="inline">
    <InputText
      type="number"
      min="0"
      max="50"
      onChange={value => setBinCount(Number(value))}
      value={String(binCount)}
    />
  </LabelWrapper>

  <EpiCurveCore
    data={data}
    width={900}
    height={600}
  />
</div>
```
