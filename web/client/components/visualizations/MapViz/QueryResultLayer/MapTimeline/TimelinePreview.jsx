// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Icon from 'components/ui/Icon';
import MiniInputSlider from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/MiniInputSlider';
import { TEXT_WIDTH_VALUES } from 'components/visualizations/MapViz/QueryResultLayer/MapTimeline/registry';

type Props = {
  dateGrouping: string,
  dateIndex: number,
  dates: $ReadOnlyArray<string>,
  maxDateIndex: number,
};

const TIMELINE_PADDING = 12;
const ICON_SIZE = 20;
// Equivalent to xxs in our spacing variables
const TEXT_SPACING = 4;

export default function TimelinePreview({
  dateGrouping,
  dateIndex,
  dates,
  maxDateIndex,
}: Props): React.Node {
  const textWidth = TEXT_WIDTH_VALUES[dateGrouping] || 50;
  const containerWidth =
    2 * TIMELINE_PADDING + ICON_SIZE + TEXT_SPACING + textWidth;
  const innerWidth = ICON_SIZE + TEXT_SPACING + textWidth;
  return (
    <Group.Vertical
      className="query-result-timeline-preview-container hide-on-export"
      spacing="xxs"
      style={{ width: containerWidth }}
    >
      <Group.Horizontal flex alignItems="center" spacing="xxs">
        <Group.Item flex>
          <Icon
            className="query-result-timeline__icon-button"
            type="svg-play"
            style={{ height: ICON_SIZE, width: ICON_SIZE }}
          />
        </Group.Item>
        <Group.Item style={{ whiteSpace: 'nowrap', width: textWidth }}>
          {dates[dateIndex] || ''}
        </Group.Item>
      </Group.Horizontal>
      <MiniInputSlider
        currentIndex={dateIndex}
        maxDateIndex={maxDateIndex}
        values={dates}
        width={innerWidth}
      />
    </Group.Vertical>
  );
}
