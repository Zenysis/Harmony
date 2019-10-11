import PropTypes from 'prop-types';
import React from 'react';

import * as Zen from 'lib/Zen';
import ColorFilter from 'models/core/QueryResultSpec/QueryResultFilter/ColorFilter';
import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import { PRIMARY_COLORS } from 'components/QueryResult/graphUtil';
import { uniqueId } from 'util/util';

const propTypes = {
  colorFilters: Zen.Map.of(PropTypes.instanceOf(ColorFilter)).isRequired,
  fontSize: PropTypes.string.isRequired,
  selectedField: PropTypes.string.isRequired,

  allValues: PropTypes.arrayOf(PropTypes.number),
  entityObject: PropTypes.object,
  seriesObject: QueryResultSeries.type(),
};

const defaultProps = {
  allValues: undefined,
  entityObject: undefined,
  seriesFilters: undefined,
  seriesObject: undefined,
};

// TODO(pablo): replace with ColorBlock and add a ColorBlock prop to render
// as a circle
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

function renderColorFilterRow(color, title) {
  return (
    <div className="legend-item" key={uniqueId()}>
      {renderColorMarker(color, 13)}
      <span className="legend-item-title">{title}</span>
    </div>
  );
}

function maybeRenderColorFilterRows(colorFilter, allValues) {
  if (
    colorFilter !== undefined &&
    !colorFilter.filters().isEmpty() &&
    allValues !== undefined
  ) {
    const filterRows = colorFilter.filters().map(colorAction => {
      const { rule, color, label } = colorAction.modelValues();
      const ruleString = rule.getRuleString(allValues);
      return renderColorFilterRow(color, label || ruleString);
    });

    return <div className="legend-item-block">{filterRows}</div>;
  }

  return null;
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
    rows.push(renderColorFilterRow(colors[idx], val));
  });
  return rows;
}

export default class Legend extends React.PureComponent {
  render() {
    const {
      fontSize,
      entityObject,
      colorFilters,
      seriesObject,
      selectedField,
      allValues,
    } = this.props;
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

    const colorFilter = colorFilters.get(selectedField);
    const seriesLabel = seriesObject ? seriesObject.label() : '';
    return (
      <div className="legend">
        <div className="map-legend" style={style}>
          <div className="legend-title">{seriesLabel}</div>
          {maybeRenderColorFilterRows(colorFilter, allValues)}
        </div>
      </div>
    );
  }
}

Legend.propTypes = propTypes;
Legend.defaultProps = defaultProps;
