Sample Usage:

<style>
  .inline {
    display: inline-block;
  }

  .radio-item {
    margin-left: 10px;
  }

  .controls {
    padding-bottom: 10px;
  }

  .violin-patterns-container {
    display: inline-flex;
    align-items: center;
  }

  .violin-patterns-container > strong {
    padding: 0 5px;
  }
</style>

```jsx
import BoxPlotTheme from 'components/ui/visualizations/BoxPlot/models/BoxPlotTheme';
import Dropdown from 'components/ui/Dropdown';
import InputText from 'components/ui/InputText';
import LegacyButton from 'components/ui/LegacyButton';
import RadioGroup, { RadioItem } from 'components/common/RadioGroup';
import { generateBoxPlotData } from 'components/ui/visualizations/BoxPlot/mocks';

initialState = {
  showOutliers: true,
  groups: generateBoxPlotData(10),
  theme: 'dark',
  showViolinPlot: true,
  numberOfGroups: 10,
  showViolinPatternLines: true,
  violinPattern: 'horizontal'
};

function formatTooltipValues(value) {
  return Number(value).toFixed(3);
}

function onToggleOutliers() {
  setState(prevState => ({ showOutliers: !prevState.showOutliers }));
}

function onToggleViolinPlot() {
  setState(prevState => ({ showViolinPlot: !prevState.showViolinPlot }));
}

function onToggleViolinPatternLines(){
  setState(prevState => ({
    showViolinPatternLines: !prevState.showViolinPatternLines
  }))
}

function onGroupsNumberChange(numberOfGroups) {
  setState({ groups: generateBoxPlotData(numberOfGroups), numberOfGroups });
}

function onThemeChange(theme, value){
  setState({ theme })
}

function onSelectViolinPattern(violinPattern){
  setState({ violinPattern })
}

function maybeRenderViolinPatternsDropdown(){
  if(!state.showViolinPatternLines || !state.showViolinPlot){
    return null
  }

  return (
    <div className="violin-patterns-container">
      <strong>Select Violin Patterns:</strong>
      <Dropdown
        value={state.violinPattern}
        onSelectionChange={onSelectViolinPattern}
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
    </div>
  )
}

function maybeRenderViolinPatternLinesToggleButton(){
  if(!state.showViolinPlot){
    return null
  }

  return (
    <LegacyButton
      type={LegacyButton.Intents.PRIMARY}
      onClick={onToggleViolinPatternLines}
      style={{ marginBottom: '10px', verticalAlign: 'top' }}
    >
      {`${state.showViolinPatternLines ? 'Hide' : 'Show'} Violin Pattern Lines`}
    </LegacyButton>
  )
}

<div>
  <div className="controls">
    <LegacyButton
      type={LegacyButton.Intents.PRIMARY}
      onClick={onToggleOutliers}
      style={{ marginBottom: '10px', verticalAlign: 'top' }}
    >
      {`${state.showOutliers ? 'Hide' : 'Show'} Outliers`}
    </LegacyButton>{' '}
    <LegacyButton
      type={LegacyButton.Intents.PRIMARY}
      onClick={onToggleViolinPlot}
      style={{ marginBottom: '10px', verticalAlign: 'top' }}
    >
      {`${state.showViolinPlot ? 'Hide' : 'Show'} Violin Plot`}
    </LegacyButton>{' '}
    {maybeRenderViolinPatternLinesToggleButton()}{' '}
    {maybeRenderViolinPatternsDropdown()}
    <RadioGroup
      onChange={onThemeChange}
      name="theme-radio-group"
      value={state.theme}
      className="inline"
    >
      <RadioItem value="dark" className="inline radio-item">
        Dark Theme
      </RadioItem>
      <RadioItem value="light" className="inline radio-item">
        Light Theme
      </RadioItem>
    </RadioGroup>
    {' '}
    <LabelWrapper label="Number of Box Plots" inline className="inline">
      <InputText
        type="number"
        min="0"
        max="50"
        onChange={onGroupsNumberChange}
        value={''+state.numberOfGroups}
      />
    </LabelWrapper>
  </div>
  <BoxPlotCore
    showOutliers={state.showOutliers}
    yAxisLabel="Temperature"
    xAxisLabel="Regions"
    height={600}
    width={900}
    groups={state.groups}
    theme={BoxPlotTheme.THEMES[state.theme]}
    showViolinPlot={state.showViolinPlot}
    tooltipValueFormatter={formatTooltipValues}
    showViolinPatternLines={state.showViolinPatternLines}
    violinPatternName={state.violinPattern}
  />
</div>

```
