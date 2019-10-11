// @flow
import React from 'react';

import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import SeriesRow from 'components/visualizations/common/Legend/SeriesRow';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';

type Props = {
  disabledSeriesIds: { +[string]: boolean },
  seriesObjects: $ReadOnlyArray<QueryResultSeries>,

  fontSize: string,
  fontColor: string,
  fontFamily: string,
  onToggleSeries: (seriesId: string) => void,
};

const defaultProps = {
  fontSize: '16px',
  fontColor: 'black',
  fontFamily: 'Arial',
  onToggleSeries: noop,
};

export default class Legend extends React.PureComponent<Props> {
  static defaultProps = defaultProps;

  @autobind
  onSeriesClick(seriesId: string) {
    const { onToggleSeries, disabledSeriesIds } = this.props;
    onToggleSeries(seriesId);

    // log user interaction
    const analyticsObj = { [seriesId]: !disabledSeriesIds[seriesId] };
    analytics.track('Toggle legend series', analyticsObj);
  }

  render() {
    const {
      seriesObjects,
      disabledSeriesIds,
      fontSize,
      fontColor,
      fontFamily,
    } = this.props;
    const seriesRows = seriesObjects.map(series => (
      <SeriesRow
        key={series.id()}
        seriesId={series.id()}
        seriesLabel={series.label()}
        seriesColor={series.color()}
        isDisabled={!!disabledSeriesIds[series.id()]}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontColor={fontColor}
        onSeriesClick={this.onSeriesClick}
      />
    ));
    return <div className="legend">{seriesRows}</div>;
  }
}
