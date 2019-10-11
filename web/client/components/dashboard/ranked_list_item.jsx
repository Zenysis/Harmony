import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { formatFieldValueForDisplay } from 'indicator_fields';
import PercentChange from 'components/dashboard/percent_change';

const CONFIG = window.__JSON_FROM_BACKEND.dashboard;

class RankedListItem extends Component {
  getClickUrl() {
    if (window.location.pathname.indexOf('/geo/') !== -1) {
      // Geo dashboards lead to field pages.
      return `/dashboard/field/${this.props.data.fieldId}${
        window.location.search
      }`;
    }

    // Use the first filter object since the field dashboard is only displaying
    // one geo hierarchy at a time.
    const queryParams = Object.assign({}, CONFIG.filters[0]);

    // Add the current item to the query params
    queryParams[CONFIG.granularity] = this.props.data.geoName;

    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    // Field dashboards lead to field pages, filtered by geo.
    return `${window.location.pathname}?${queryString}`;
  }

  shouldDisplay() {
    const { data, historicalLevel } = this.props;
    const startValue = data.currentData[historicalLevel];
    const endValue = data.historicalData[historicalLevel];
    // Limit percent change to +-5000%. Assume values outside this range are
    // an error and return no percent change.
    return (
      startValue &&
      endValue &&
      Math.abs((endValue - startValue) / startValue) < 50
    );
  }

  renderItemDescription() {
    return (
      <div className="item-description">
        <span className="item-index">{this.props.index}</span>
        <span className="item-name">{this.props.data.name}</span>
      </div>
    );
  }

  renderPercentChange(subtitle = '', showValueSign = true) {
    const { data, historicalLevel } = this.props;
    return (
      <PercentChange
        decreaseIsGood={data.decreaseIsGood}
        currentValue={data.currentData[historicalLevel]}
        initialValue={data.historicalData[historicalLevel]}
        showValueSign={showValueSign}
      >
        {subtitle ? <span className="subtitle">{subtitle}</span> : null}
      </PercentChange>
    );
  }

  renderRawValue() {
    const { data, historicalLevel } = this.props;
    const { fieldId } = data;
    const value = formatFieldValueForDisplay(
      data.currentData[historicalLevel],
      fieldId,
    );
    return <span className="raw-value">{value}</span>;
  }

  render() {
    return (
      <div className="ranked-list-item">
        <a href={this.getClickUrl()}>
          {this.renderItemDescription()}
          {this.renderPercentChange()}
          {this.renderRawValue()}
        </a>
      </div>
    );
  }
}

RankedListItem.propTypes = {
  index: PropTypes.number.isRequired,
  data: PropTypes.object.isRequired,
  historicalLevel: PropTypes.string.isRequired,

  denomSuffix: PropTypes.string,
  groupSize: PropTypes.number,
};

RankedListItem.defaultProps = {
  denomSuffix: '',
  groupSize: -1,
};

export default RankedListItem;
