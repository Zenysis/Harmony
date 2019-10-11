import React from 'react';
import PropTypes from 'prop-types';
import numeral from 'numeral';
import pluralize from 'pluralize';

const propTypes = {
  cumulativePercent: PropTypes.number.isRequired,
  dimensionValue: PropTypes.string.isRequired,
  excludeCumulativeLabel: PropTypes.bool.isRequired,
  field: PropTypes.string.isRequired,
  fieldValue: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
};

const defaultProps = {
  excludeCumulativeLabel: false,
};

export default class Tooltip extends React.PureComponent {
  // TODO(stephen): none of this is being translated.
  // TODO(stephen): Remove this since it is not used by our users and the
  // results are wrong if the field type is not SUM.
  maybeRenderCumulativePercent() {
    const { cumulativePercent, excludeCumulativeLabel, index } = this.props;
    if (excludeCumulativeLabel) {
      return null;
    }

    const percent = numeral(cumulativePercent).format('0.00%');
    const verb = index === 0 ? 'accounts' : 'account';
    const includeNumber = index > 0;
    const countDisplay = pluralize('result', index + 1, includeNumber);
    return (
      <span>First {countDisplay} {verb} for {percent} of total</span>
    );
  }

  render() {
    const { dimensionValue, field, fieldValue } = this.props;
    return (
      <span>
        <b>{dimensionValue}</b>
        <br /><br />
        <span><b>{field}</b>: {fieldValue}</span>
        <br />
        {this.maybeRenderCumulativePercent()}
      </span>
    );
  }
}

Tooltip.propTypes = propTypes;
