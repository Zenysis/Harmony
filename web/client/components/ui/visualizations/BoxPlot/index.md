Sample Usage:

<style>
  .violin-patterns-container {
    display: inline-flex;
    align-items: center;
  }
</style>

```jsx
import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import LegacyButton from 'components/ui/LegacyButton';
import RadioGroup from 'components/ui/RadioGroup';
import { generateBoxPlotData } from 'components/ui/visualizations/BoxPlot/mocks';

const [showOutliers, setShowOutliers] = React.useState(true);
const [theme, setTheme] = React.useState('dark');
const [showViolinPlot, setShowViolinPlot] = React.useState(true);
const [numberOfGroups, setNumberOfGroups] = React.useState(10);
const [showViolinPatternLines, setShowViolinPatternLines] = React.useState(
true,
);
const [violinPattern, setViolinPattern] = React.useState('horizontal');

const groups = React.useMemo(
  () => generateBoxPlotData(numberOfGroups),
  [numberOfGroups],
);

function metricValueFormatter(value) {
  return Number(value).toFixed(3);
}

function onToggleOutliers() {
  setShowOutliers(!showOutliers);
}

function onToggleViolinPlot() {
  setShowViolinPlot(!showViolinPlot);
}

function onToggleViolinPatternLines(){
  setShowViolinPatternLines(!showViolinPatternLines);
}

function maybeRenderViolinPatternsDropdown(){
  if(!showViolinPatternLines || !showViolinPlot){
    return null
  }

  return (
    <LabelWrapper inline boldLabel label="Select Violin Patterns:">
      <Dropdown
        value={violinPattern}
        onSelectionChange={setViolinPattern}
        defaultDisplayContent="Select A violin pattern"
      >
        <Dropdown.Option value="horizontal">Horizontal</Dropdown.Option>
        <Dropdown.Option value="vertical">Vertical</Dropdown.Option>
        <Dropdown.Option value="diagonal">Diagonal</Dropdown.Option>
        <Dropdown.Option value="horizontalAndDiagonal">
          Horizontal And Diagonal
        </Dropdown.Option>
        <Dropdown.Option value="horizontalAndVertical">
          Horizontal And Vertical
        </Dropdown.Option>
        <Dropdown.Option value="verticalAndDiagonal">
          Vertical And Diagonal
        </Dropdown.Option>
        <Dropdown.Option value="all">
          Vertical, Horizontal And Diagonal
        </Dropdown.Option>
      </Dropdown>
    </LabelWrapper>
  )
}

function maybeRenderViolinPatternLinesToggleButton(){
  if(!showViolinPlot){
    return null
  }

  return (
    <LegacyButton
      type={LegacyButton.Intents.PRIMARY}
      onClick={onToggleViolinPatternLines}
      style={{ marginBottom: '10px', verticalAlign: 'top' }}
    >
      {`${showViolinPatternLines ? 'Hide' : 'Show'} Violin Pattern Lines`}
    </LegacyButton>
  )
}

<Group.Vertical spacing="l">
  <Group.Horizontal>
    <LegacyButton
      type={LegacyButton.Intents.PRIMARY}
      onClick={onToggleOutliers}
      style={{ marginBottom: '10px', verticalAlign: 'top' }}
    >
      {`${showOutliers ? 'Hide' : 'Show'} Outliers`}
    </LegacyButton>
    <LegacyButton
      type={LegacyButton.Intents.PRIMARY}
      onClick={onToggleViolinPlot}
      style={{ marginBottom: '10px', verticalAlign: 'top' }}
    >
      {`${showViolinPlot ? 'Hide' : 'Show'} Violin Plot`}
    </LegacyButton>

    {maybeRenderViolinPatternLinesToggleButton()}{' '}
    {maybeRenderViolinPatternsDropdown()}

    <RadioGroup
      onChange={setTheme}
      name="theme-radio-group"
      value={theme}
      className="inline"
      direction="horizontal"
    >
      <RadioGroup.Item value="dark">
        Dark Theme
      </RadioGroup.Item>
      <RadioGroup.Item value="light">
        Light Theme
      </RadioGroup.Item>
    </RadioGroup>

    <LabelWrapper label="Number of Box Plots" inline>
      <InputText
        type="number"
        min="0"
        max="50"
        onChange={setNumberOfGroups}
        value={''+numberOfGroups}
      />
    </LabelWrapper>
  </Group.Horizontal>
  <BoxPlotCore
    showOutliers={showOutliers}
    yAxisLabel="Temperature"
    xAxisLabel="Regions"
    height={600}
    width={900}
    groups={groups}
    theme={BoxPlotTheme.Themes[theme]}
    showViolinPlot={showViolinPlot}
    metricValueFormatter={metricValueFormatter}
    showViolinPatternLines={showViolinPatternLines}
    violinPatternName={violinPattern}
  />
</Group.Vertical>
```
