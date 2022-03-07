// @flow
import * as React from 'react';
import moment from 'moment';

import CheckboxControl from 'components/visualizations/common/controls/CheckboxControl';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import GoalLineControlsBlock from 'components/visualizations/BarGraph/BarGraphControlsBlock/GoalLineControlsBlock';
import Group from 'components/ui/Group';
import HistogramSettings from 'models/visualizations/Histogram/HistogramSettings';
import I18N from 'lib/I18N';
import PaletteControl from 'components/visualizations/common/controls/PaletteControl';
import PivotBreakdownControl from 'components/visualizations/common/controls/PivotBreakdownControl';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import RadioGroup from 'components/ui/RadioGroup';
import ResultLimitControl from 'components/visualizations/common/controls/ResultLimitControl';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SingleFieldSelectionControl from 'components/visualizations/common/controls/SingleFieldSelectionControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'EPICURVE'>;

const CONTROLS_TEXT = t('query_result.controls');
const BAR_GRAPH_CONTROLS_TEXT = t(
  'visualizations.BarGraph.BarGraphControlsBlock',
);

const RESULT_LIMIT_OPTIONS = [20, 50, 100, 250, 500];

// TODO(sophie): move this functionality to GROUP settings tab
// HACK(sophie): constant used as placeholder, taken from old bargraph
export const DEFAULT_TIME_FORMAT = 'Default';
const EXAMPLE_DATE = moment('2019-01-05');
const DATE_FORMATS = [
  'YYYY-MM-DD',
  'MMM Do, YYYY',
  'Do MMM, YYYY',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'MM/DD',
  'DD/MM',
  'M/D',
  'D/M',
];

export default function HistogramControlsBlock({
  controls,
  onControlsSettingsChange,
  seriesSettings,
}: Props): React.Element<typeof Group.Vertical> {
  const selectableFields = React.useMemo(() => {
    const seriesObjects = seriesSettings.seriesObjects();
    return Object.keys(seriesObjects).map(id => seriesObjects[id]);
  }, [seriesSettings]);

  const onBreakdownChange = React.useCallback(
    newBreakdown => {
      onControlsSettingsChange('breakdown', newBreakdown);
    },
    [onControlsSettingsChange],
  );

  const onGoalLinesChange = React.useCallback(
    goalLines => {
      onControlsSettingsChange('goalLines', goalLines);
    },
    [onControlsSettingsChange],
  );

  const breakdown = controls.breakdown();
  return (
    <Group.Vertical spacing="l">
      <ResultLimitControl
        buttonMinWidth={115}
        controlKey="resultLimit"
        onValueChange={onControlsSettingsChange}
        resultLimitOptions={RESULT_LIMIT_OPTIONS}
        showAllOption
        value={controls.resultLimit()}
      />
      <CheckboxControl
        controlKey="alwaysShowFocusWindow"
        onValueChange={onControlsSettingsChange}
        value={controls.alwaysShowFocusWindow()}
        label={I18N.textById('Always show focus window')}
        labelClassName="wrap-label-text"
      />
      <DropdownControl
        controlKey="xTickFormat"
        onValueChange={onControlsSettingsChange}
        value={controls.xTickFormat()}
        label={I18N.text('Date format', 'dateFormat')}
        buttonMinWidth={115}
      >
        <Option key={DEFAULT_TIME_FORMAT} value={DEFAULT_TIME_FORMAT}>
          <I18N>Default</I18N>
        </Option>
        {DATE_FORMATS.map(format => (
          <Option key={format} value={format}>
            {EXAMPLE_DATE.format(format)}
          </Option>
        ))}
      </DropdownControl>
      <CheckboxControl
        controlKey="rotateXAxisLabels"
        onValueChange={onControlsSettingsChange}
        value={controls.rotateXAxisLabels()}
        label={I18N.text('Rotate x-axis labels', 'rotateXAxisLabels')}
        labelClassName="wrap-label-text"
      />
      <SettingsBlock title={I18N.text('Bar Display Settings')}>
        <Group.Vertical spacing="l">
          <PivotBreakdownControl
            breakdown={breakdown}
            onBreakdownChange={onBreakdownChange}
          />
          {breakdown === 'dimension' && (
            <SingleFieldSelectionControl
              controlKey="selectedField"
              onValueChange={onControlsSettingsChange}
              value={controls.selectedField()}
              label={CONTROLS_TEXT.selectedField}
              fields={selectableFields}
            />
          )}
          <PaletteControl
            defaultPalette={HistogramSettings.defaultValues.palette}
            labelTooltip={I18N.textById('pieChartPaletteTooltip')}
            palette={controls.palette()}
            onPaletteChange={p => onControlsSettingsChange('palette', p)}
          />
          {(selectableFields.length > 1 || breakdown === 'grouping') && (
            <RadioControl
              controlKey="barTreatment"
              label={BAR_GRAPH_CONTROLS_TEXT.barTreatmentLabel}
              onValueChange={onControlsSettingsChange}
              value={controls.barTreatment()}
            >
              <RadioGroup.Item value="stacked">
                {BAR_GRAPH_CONTROLS_TEXT.stackedBar}
              </RadioGroup.Item>
              <RadioGroup.Item value="overlaid">
                {BAR_GRAPH_CONTROLS_TEXT.overlaidBar}
              </RadioGroup.Item>
            </RadioControl>
          )}
          <CheckboxControl
            controlKey="displayBorders"
            label={I18N.text('Display bar borders', 'displayBarBorders')}
            labelClassName="wrap-label-text"
            onValueChange={onControlsSettingsChange}
            value={controls.displayBorders()}
          />
          <CheckboxControl
            controlKey="rotateDataValueLabels"
            onValueChange={onControlsSettingsChange}
            value={controls.rotateDataValueLabels()}
            label={I18N.text(
              'Rotate data value labels',
              'rotateDataValueLabels',
            )}
            labelClassName="wrap-label-text"
          />
          <CheckboxControl
            controlKey="hideZeroValueLabels"
            onValueChange={onControlsSettingsChange}
            value={controls.hideZeroValueLabels()}
            label={I18N.text(
              'Hide value labels equal to zero',
              'hideZeroValueLabels',
            )}
            labelClassName="wrap-label-text"
          />
          <GoalLineControlsBlock
            goalLines={controls.goalLines()}
            onGoalLinesChange={onGoalLinesChange}
          />
        </Group.Vertical>
      </SettingsBlock>
    </Group.Vertical>
  );
}
