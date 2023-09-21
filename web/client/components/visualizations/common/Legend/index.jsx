// @flow
import * as React from 'react';

import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import SeriesRow from 'components/visualizations/common/Legend/SeriesRow';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';

type DefaultProps = {
  fontColor: string,
  fontFamily: string,
  fontSize: string,
  onToggleSeries: (seriesId: string) => void,
};

type Props = {
  ...DefaultProps,
  disabledSeriesIds: { +[string]: boolean, ... },
  seriesObjects: $ReadOnlyArray<QueryResultSeries>,
};

export default class Legend extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    fontColor: 'black',
    fontFamily: 'Arial',
    fontSize: '16px',
    onToggleSeries: noop,
  };

  @autobind
  onSeriesClick(seriesId: string) {
    const { onToggleSeries } = this.props;
    onToggleSeries(seriesId);
  }

  render(): React.Node {
    const {
      disabledSeriesIds,
      fontColor,
      fontFamily,
      fontSize,
      seriesObjects,
    } = this.props;
    const seriesRows = seriesObjects.map(series => (
      <SeriesRow
        key={series.id()}
        fontColor={fontColor}
        fontFamily={fontFamily}
        fontSize={fontSize}
        isDisabled={!!disabledSeriesIds[series.id()]}
        onSeriesClick={this.onSeriesClick}
        seriesColor={series.color()}
        seriesId={series.id()}
        seriesLabel={series.label()}
      />
    ));
    return <div className="legend">{seriesRows}</div>;
  }
}
