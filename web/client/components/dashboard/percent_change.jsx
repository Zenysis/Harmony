import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {
  formatPercent,
  getPercentChange,
} from 'components/dashboard/rank_util';

const GOOD_CHANGE_COLOR = 'green';
const BAD_CHANGE_COLOR = 'red';
const NEUTRAL_CHANGE_COLOR = '#999';

function getArrowClasses(value, color) {
  // TODO(stephen, ian): Potentially don't use glyphicon for missing values
  return classNames({
    arrow: true,
    glyphicon: !value,
    'glyphicon-minus': !value,
    'arrow-up': value > 0,
    'arrow-down': value < 0,
    good: color === GOOD_CHANGE_COLOR,
    bad: color === BAD_CHANGE_COLOR,
  });
}

function getStyleForPercentChange(percentChange, decreaseIsGood) {
  let color = NEUTRAL_CHANGE_COLOR;
  if (percentChange) {
    // eslint-disable-next-line no-bitwise
    const changeIsGood = (percentChange > 0) ^ decreaseIsGood;
    color = changeIsGood ? GOOD_CHANGE_COLOR : BAD_CHANGE_COLOR;
  }
  return { color };
}

const PercentChange = (props) => {
  const percentChange = getPercentChange(
    props.initialValue,
    props.currentValue,
  );
  const rankStyle = props.showColor
    ? getStyleForPercentChange(percentChange, props.decreaseIsGood)
    : {};

  const percentDisplay = formatPercent(percentChange, props.showValueSign);

  return (
    <span className="percent-change" style={rankStyle}>
      <span className="value">{percentDisplay}</span>
      {props.showArrow ? (
        <span className={getArrowClasses(percentChange, rankStyle.color)} />
      ) : null}
      {props.children}
    </span>
  );
};

PercentChange.propTypes = {
  decreaseIsGood: PropTypes.bool.isRequired,

  children: PropTypes.node,
  showArrow: PropTypes.bool,
  showColor: PropTypes.bool,
  showValueSign: PropTypes.bool,

  // The values are not required since we want to gracefully
  // handle the case when a percentage cannot be computed.
  currentValue: PropTypes.number,
  initialValue: PropTypes.number,
};

PercentChange.defaultProps = {
  children: undefined,
  showArrow: true,
  showColor: true,
  showValueSign: true,
  currentValue: undefined,
  initialValue: undefined,
};

export default PercentChange;
