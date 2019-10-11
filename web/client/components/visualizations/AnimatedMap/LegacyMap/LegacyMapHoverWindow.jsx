import PropTypes from 'prop-types';
import React from 'react';

import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import ZenPropTypes from 'util/ZenPropTypes';
import { formatFieldValueForDisplay } from 'indicator_fields';

// TODO(pablo): refactor this class to follow proper React style

// Maximum width of the hover window. This won't overflow the map.
export const MAX_HOVER_WINDOW_WIDTH_PX = 650;
export const MOBILE_MAX_HOVER_WINDOW_WIDTH_PX = 288;

// Maximum height of the hover window. This won't overflow the map.
export const MAX_HOVER_WINDOW_HEIGHT_PX = 300;

const propTypes = {
  seriesObjects: ZenPropTypes.arrayOfType(QueryResultSeries).isRequired,
  geoObj: PropTypes.object.isRequired,
  getMarkerValue: PropTypes.func.isRequired,
};

export default class LegacyMapHoverWindow extends React.Component {
  renderDisplayForData() {
    const { seriesObjects, geoObj } = this.props;

    const tableRows = seriesObjects.map(series => {
      const { id, label } = series.modelValues();
      const val = this.props.getMarkerValue(geoObj, id);
      return (
        <tr key={id}>
          <td>{label}</td>
          <td>{formatFieldValueForDisplay(val, id)}</td>
        </tr>
      );
    });

    return (
      <table className="table table-striped table-condensed map-hover-table">
        <thead>
          <tr>
            <th>Indicator</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </table>
    );
  }

  render() {
    const { geoObj } = this.props;

    return (
      <div className="map-hover-container">
        <center>
          <strong>{geoObj.geoName}</strong>
        </center>
        {this.renderDisplayForData()}
      </div>
    );
  }
}

LegacyMapHoverWindow.propTypes = propTypes;
