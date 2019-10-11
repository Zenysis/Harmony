
The initial implementation of the EpiCurve visualization using vx

<style>
  .inline {
    display: inline-block;
  }
</style>

```jsx
import InputText from 'components/ui/InputText';
import { createSampleData } from 'components/ui/visualizations/EpiCurve/mocks';

const numberOfDataPoints = 200;
const initialData = createSampleData(numberOfDataPoints)

initialState = {
  data: initialData,
  binCount: 10,
  showBinValues: false
}

function onBinCountChange(binCount){
  setState({
    binCount: Number(binCount),
    data: createSampleData(numberOfDataPoints, binCount)
  })
}

function toggleShowBinValues(){
  setState(prevState=>({ showBinValues: !prevState.showBinValues }))
}

const binValuesLabel = state.showBinValues ? 'Hide Bin Values': 'Show Bin Values';

<div>
  <LabelWrapper label="Bin Count" inline className="inline">
    <InputText
      type="number"
      min="0"
      max="50"
      onChange={onBinCountChange}
      value={String(state.binCount)}
    />
  </LabelWrapper>
  {' '}
  <LabelWrapper label={binValuesLabel} inline className="inline">
    <Checkbox
      onChange={toggleShowBinValues}
      value={state.showBinValues}
    />
  </LabelWrapper>

  <EpiCurveCore
    data={state.data}
    width={900}
    height={600}
    showBinValues={state.showBinValues}
  />
</div>
```
