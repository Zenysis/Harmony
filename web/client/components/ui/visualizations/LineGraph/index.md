The Line graph implementation

<style>
  .inline {
    display: inline-block;
  }

  .radio-item {
    margin-left: 10px;
  }
</style>

```jsx
import LineGraphTheme from 'components/ui/visualizations/LineGraph/models/LineGraphTheme';
import RadioGroup, { RadioItem } from 'components/common/RadioGroup';
import { createSampleData } from 'components/ui/visualizations/LineGraph/mocks';

const groupCount = 2;
const numberOfDataPoints = 30;
const initialData = createSampleData(groupCount,numberOfDataPoints);

initialState = {
  data: initialData,
  lineGraphCount: groupCount,
  theme: 'dark'
};

function onDataPointClick(dataPoint){
  alert(JSON.stringify(dataPoint));
  console.log(dataPoint)
}

function onThemeChange(theme){
  setState({ theme })
}

function onLineGraphCountChange(lineGraphCount){
  if (Number(lineGraphCount) && lineGraphCount > 0) {
    setState({ lineGraphCount, data: createSampleData(lineGraphCount) })
  }else{
    setState({ lineGraphCount })
  }
}

<div>
  <LabelWrapper label="Line Graph Count" inline className="inline">
    <InputText
      type="number"
      onChange={onLineGraphCountChange}
      value={String(state.lineGraphCount)}
    />
  </LabelWrapper>
  <RadioGroup
    onChange={onThemeChange}
    name="line-graph-theme-radio-group"
    value={state.theme}
    className="inline"
    id="line-graph"
  >
    <RadioItem value="dark" className="inline radio-item">
      Dark Theme
    </RadioItem>
    <RadioItem value="light" className="inline radio-item">
      Light Theme
    </RadioItem>
  </RadioGroup>
  <LineGraph
    data={state.data}
    width={900}
    height={600}
    onDataPointClick={onDataPointClick}
    theme={LineGraphTheme.THEMES[state.theme]}
  />
</div>
```
