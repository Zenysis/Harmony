// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import RadioGroup from 'components/ui/RadioGroup';
import type { RadioItemElement } from 'components/ui/RadioGroup/RadioItem';

// TODO: either remove this setting or finally implement it, because
// currently legend placement is not enabled anywhere.

export const LEGEND_PLACEMENT = {
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  TOP_RIGHT: 'topRight',
};

export type LegendPlacement = $Values<typeof LEGEND_PLACEMENT>;

export const LEGEND_TEXT: { [LegendPlacement]: string } = {
  bottom: I18N.textById('Bottom'),
  left: I18N.text('Left'),
  right: I18N.text('Right'),
  top: I18N.textById('Top'),
  topRight: I18N.text('Top Right'),
};

const { BOTTOM, LEFT, RIGHT, TOP, TOP_RIGHT } = LEGEND_PLACEMENT;
const LEGEND_PLACEMENTS = [TOP, TOP_RIGHT, LEFT, RIGHT, BOTTOM];

export const LEGEND_PLACEMENT_RADIO_ITEMS: $ReadOnlyArray<
  RadioItemElement<LegendPlacement>,
> = LEGEND_PLACEMENTS.map(placement => (
  <RadioGroup.Item key={placement} value={placement}>
    {LEGEND_TEXT[placement]}
  </RadioGroup.Item>
));
