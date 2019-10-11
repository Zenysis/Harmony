import PropTypes from 'prop-types';
import React from 'react';

import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import { PRIMARY_COLORS } from 'components/QueryResult/graphUtil';
import { isEmpty, uniqueId } from 'util/util';

const propTypes = {
  fontSize: PropTypes.string.isRequired,

  entityObject: PropTypes.object,
  seriesFilters: PropTypes.object,
  seriesObject: QueryResultSeries.type(),
};

const defaultProps = {
  entityObject: undefined,
  seriesFilters: undefined,
  seriesObject: undefined,
};

const TXT_LEGEND = t('query_result.legend');

function renderColorMarker(color, size) {
  const sizePx = `${size}px`;
  const style = {
    opacity: 1,
    backgroundColor: color,
    height: sizePx,
    width: sizePx,
    borderRadius: sizePx,
  };
  return <div className="legend-marker" style={style} />;
}

function renderColorFilterRow(key, color, title) {
  return (
    <div className="legend-item" key={key}>
      {renderColorMarker(color, 13)}
      <span className="legend-item-title">{title}</span>
    </div>
  );
}

function renderSingleValueRow(filterType, value, color) {
  if (isNaN(value)) {
    return null;
  }

  const isGreaterThan =
    filterType === 'colorTop' || filterType.startsWith('colorAbove');
  const isExact = filterType === 'colorEqual';
  const isEqualTo =
    isExact || filterType === 'colorTop' || filterType === 'colorBottom';
  const prefix = isExact ? '' : isGreaterThan ? '>' : '<';
  const symbol = `${prefix}${isEqualTo ? '=' : ''}`;
  const strValue = value === null ? 'null' : parseFloat(value).toFixed(3);
  const title = `${TXT_LEGEND.values} ${symbol} ${strValue}`;
  return renderColorFilterRow(filterType, color, title);
}

function renderValueRangeRow(from, to, color, filterTitle) {
  const key = uniqueId().toString();
  const title = filterTitle || `${from} - ${to}`;
  return renderColorFilterRow(key, color, title);
}

function maybeRenderColorFilterRows(colorFilters) {
  if (!colorFilters || isEmpty(colorFilters)) {
    return null;
  }

  const filterRows = Object.keys(colorFilters).map(filterType => {
    const filter = colorFilters[filterType];
    if (filterType === 'colorRangeProps') {
      const { rangeTitle, rangeVals, rangeColors } = filter;
      return rangeVals.map(([from, to], i) =>
        renderValueRangeRow(from, to, rangeColors[i], rangeTitle[i]),
      );
    }

    return renderSingleValueRow(filterType, filter.value, filter.color);
  });

  return <div className="legend-item-block">{filterRows}</div>;
}

function renderEntityColorRows(vals) {
  const rows = [];
  const colors = [];
  Object.keys(PRIMARY_COLORS).forEach(colorKey => {
    if (colorKey !== 'ZA_BLUE') {
      colors.push(PRIMARY_COLORS[colorKey]);
    }
  });
  vals.forEach((val, idx) => {
    const key = uniqueId().toString();
    rows.push(renderColorFilterRow(key, colors[idx], val));
  });
  return rows;
}

export default class Legend extends React.PureComponent {
  render() {
    const { fontSize, entityObject } = this.props;
    const style = { fontSize };

    if (entityObject !== undefined) {
      const entityLabel = Object.keys(entityObject)[0];
      return (
        <div className="legend">
          <div className="legend-title">{entityLabel}</div>
          {renderEntityColorRows(entityObject[entityLabel])}
        </div>
      );
    }

    const { seriesFilters, seriesObject } = this.props;
    const colorFilters = seriesFilters ? seriesFilters.colorFilters : undefined;
    const seriesLabel = seriesObject ? seriesObject.label() : '';
    return (
      <div className="legend">
        <div className="map-legend" style={style}>
          <div className="legend-title">{seriesLabel}</div>
          {maybeRenderColorFilterRows(colorFilters)}
        </div>
      </div>
    );
  }
}

Legend.propTypes = propTypes;
Legend.defaultProps = defaultProps;
