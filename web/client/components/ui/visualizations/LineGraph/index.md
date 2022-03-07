The Line graph implementation

```jsx
import LabelWrapper from 'components/ui/LabelWrapper';
import LineGraphTheme from 'components/ui/visualizations/LineGraph/models/LineGraphTheme';
import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import RadioGroup from 'components/ui/RadioGroup';
import { createSampleData } from 'components/ui/visualizations/LineGraph/mocks';

const groupCount = 2;
const numberOfDataPoints = 30;

const [data, setData] = React.useState(
  createSampleData(groupCount, numberOfDataPoints),
);
const [goalLineValue, setGoalLineValue] = React.useState('');
const [lineGraphCount, setLineGraphCount] = React.useState(groupCount);
const [theme, setTheme] = React.useState('light');


function onDataPointClick(dataPoint) {
  alert(JSON.stringify(dataPoint));
  console.log(dataPoint);
}

function onGoalLineValueChange(value) {
  const parsedValue = value === '' ? undefined : Number(value);
  const goalLineValue = !Number.isNaN(parsedValue) ? parsedValue : undefined;
  setGoalLineValue(goalLineValue);
}

function onLineGraphCountChange(lineGraphCount) {
  if (Number(lineGraphCount) && lineGraphCount > 0) {
    setLineGraphCount(lineGraphCount);
    setData(createSampleData(lineGraphCount));
  } else {
    setLineGraphCount(lineGraphCount);
  }
}

const goalLines = goalLineValue
  ? [
      {
        axis: 'y1Axis',
        fontColor: 'black',
        fontSize: 14,
        id: 'some id',
        label: 'My Goal Line Label',
        lineStyle: 'solid',
        lineThickness: 1,
        value: goalLineValue,
      },
    ]
  : [];

<div>
  <Group.Horizontal>
    <LabelWrapper label="Line Graph Count" inline>
      <InputText
        type="number"
        onChange={onLineGraphCountChange}
        value={String(lineGraphCount)}
      />
    </LabelWrapper>
    <LabelWrapper label="Goal Line Value" inline>
      <InputText
        type="number"
        onChange={onGoalLineValueChange}
        value={String(goalLineValue)}
      />
    </LabelWrapper>
    <RadioGroup
      onChange={setTheme}
      name="line-graph-theme-radio-group"
      value={theme}
    >
      <RadioGroup.Item value="light">
        Light Theme
      </RadioGroup.Item>
      <RadioGroup.Item value="dark">
        Dark Theme
      </RadioGroup.Item>
    </RadioGroup>
  </Group.Horizontal>
  <LineGraph
    data={data}
    goalLines={goalLines}
    height={600}
    onDataPointClick={onDataPointClick}
    theme={LineGraphTheme.Themes[theme]}
    width={900}
  />
</div>;
```
