// @flow
import * as React from 'react';

import { RadioItem } from 'components/common/RadioGroup';

// TODO(pablo): either remove this setting or finally implement it, because
// currently legend placement is not enabled anywhere.

type LegendPlacementMap = {
  TOP: 'top',
  TOP_RIGHT: 'topRight',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
};

export type LegendPlacement = $Values<LegendPlacementMap>;

export const LEGEND_PLACEMENT: LegendPlacementMap = {
  TOP: 'top',
  TOP_RIGHT: 'topRight',
  LEFT: 'left',
  RIGHT: 'right',
  BOTTOM: 'bottom',
};

const { TOP, TOP_RIGHT, LEFT, RIGHT, BOTTOM } = LEGEND_PLACEMENT;
const LEGEND_PLACEMENTS = [TOP, TOP_RIGHT, LEFT, RIGHT, BOTTOM];

const TEXT = t('visualizations.common.SettingsModal.LegendSettingsTab');
export const LEGEND_PLACEMENT_RADIO_ITEMS: $ReadOnlyArray<
  React.Element<typeof RadioItem>,
> = LEGEND_PLACEMENTS.map(placement => (
  <RadioItem key={placement} value={placement}>
    {TEXT.legendPlacements[placement]}
  </RadioItem>
));
