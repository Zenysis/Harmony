// @flow
import * as React from 'react';
import { Tooltip } from '@vx/tooltip';

import {
  extractDate,
  extractValue,
} from 'components/ui/visualizations/LineGraph/LineGraphUtil';
import type { TooltipData } from 'components/ui/visualizations/LineGraph/types';

const TEXT = t('ui.visualizations.LineGraph.LineGraphTooltip');

type TooltipDateFormatter = (date: string | Date) => string;

type Props = {
  /** The height of the graph */
  graphHeight: number,

  /** The width of the graph */
  graphWidth: number,

  /** A function to format the date of the tooltip */
  formatDate: TooltipDateFormatter,

  /** A function to format the data point value */
  formatValue: (value: number) => number | string,

  /** The top coordinate of the hovered data point  */
  tooltipTop: number,

  /** The left coordinate of the hovered data point  */
  tooltipLeft: number,

  /** The right coordinate of the hovered data point  */
  tooltipRight: number,

  /** Data to show in the tooltip */
  tooltipData: TooltipData,

  /** The label to the date in the tooltip */
  dateLabel?: string,

  /** The label to the value in the tooltip */
  valueLabel?: string,
};

export default function LineGraphTooltip({
  formatValue,
  tooltipData,
  tooltipLeft,
  tooltipTop,
  graphHeight,
  graphWidth,
  formatDate,
  tooltipRight,
  dateLabel = TEXT.date,
  valueLabel = TEXT.value,
}: Props): React.Node {
  const TOOLTIP_LEFT_OFFSET = 100;
  const TOOL_TIP_RIGHT_OFFSET = 60;
  const tooltipPositionStyles = {};

  if (graphHeight / 2 > tooltipTop) {
    // show tooltip in the bottom half of the graph if data point in in the top
    // half of the graph
    tooltipPositionStyles.top = `${(graphHeight * 3) / 4}px`;
  } else {
    // show tooltip at the top half of the graph if data point is in the bottom
    // half of the graph
    tooltipPositionStyles.top = `${graphHeight / 4}px`;
  }

  if (graphWidth / 2 < tooltipLeft) {
    // show tooltip at the left of the  data point if data point is in the right
    // half of the graph
    tooltipPositionStyles.right = `${tooltipRight + TOOL_TIP_RIGHT_OFFSET}px`;
  } else {
    // show tooltip to the right of the data point if the data point is in the
    // left half of the graph
    tooltipPositionStyles.left = `${tooltipLeft + TOOLTIP_LEFT_OFFSET}px`;
  }

  return (
    <Tooltip
      style={{ ...tooltipPositionStyles }}
      className="line-graph__tooltip-container"
    >
      <strong>{tooltipData.seriesName}</strong>
      <hr className="line-graph__tooltip-divider" />
      <div>
        {valueLabel} : {formatValue(extractValue(tooltipData))}
      </div>
      <div>
        {dateLabel} : {formatDate(extractDate(tooltipData))}
      </div>
    </Tooltip>
  );
}
