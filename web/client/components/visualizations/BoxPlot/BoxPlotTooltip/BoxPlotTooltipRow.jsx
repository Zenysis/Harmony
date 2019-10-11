import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,

  className: PropTypes.string
};

const defaultProps = {
  className: undefined,
};

export default function BoxPlotTooltipRow({ className, label, value }) {
  const rowClass = classNames('box-plot-tooltip__row', className);
  return (
    <div key={label} className={rowClass}>
      <span className="box-plot-tooltip__label">
        {label}:
      </span>
      <span className="box-plot-tooltip__value">
        {value}
      </span>
    </div>
  );
}

BoxPlotTooltipRow.propTypes = propTypes;
BoxPlotTooltipRow.defaultProps = defaultProps;
