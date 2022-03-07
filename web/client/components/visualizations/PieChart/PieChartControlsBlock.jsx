// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import PaletteControl from 'components/visualizations/common/controls/PaletteControl';
import PieChartSettings from 'models/visualizations/PieChart/PieChartSettings';
import PivotBreakdownControl from 'components/visualizations/common/controls/PivotBreakdownControl';
import RadioControl from 'components/visualizations/common/controls/RadioControl';
import RadioGroup from 'components/ui/RadioGroup';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

type Props = ControlsBlockProps<'PIE'>;

export default function PieChartControlsBlock({
  controls,
  onControlsSettingsChange,
}: Props): React.Element<typeof Group.Vertical> {
  const displayTypeControlLabel = (
    <Group.Horizontal spacing="none">
      <I18N>Value type</I18N>
      <InfoTooltip
        text={I18N.text(
          'Hover or click on legend items to view values on the pie chart',
          'displayLabelControlTooltip',
        )}
      />
    </Group.Horizontal>
  );

  return (
    <Group.Vertical spacing="l">
      <PivotBreakdownControl
        breakdown={controls.breakdown()}
        onBreakdownChange={v => onControlsSettingsChange('breakdown', v)}
      />
      <RadioControl
        controlKey="displayLabelType"
        label={displayTypeControlLabel}
        onValueChange={onControlsSettingsChange}
        value={controls.displayLabelType()}
      >
        <RadioGroup.Item value="percent">
          <I18N>Percent</I18N>
        </RadioGroup.Item>
        <RadioGroup.Item value="raw">
          <I18N>Raw</I18N>
        </RadioGroup.Item>
        <RadioGroup.Item value="both">
          <I18N>Both</I18N>
        </RadioGroup.Item>
      </RadioControl>
      <PaletteControl
        defaultPalette={PieChartSettings.defaultValues.palette}
        labelTooltip={I18N.text(
          'This color palette gets applied to indicators in order and to groupings alphabetically.',
          'pieChartPaletteTooltip',
        )}
        palette={controls.palette()}
        onPaletteChange={p => onControlsSettingsChange('palette', p)}
      />
    </Group.Vertical>
  );
}
