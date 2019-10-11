import React from 'react';
import PropTypes from 'prop-types';
import Caret from 'components/ui/Caret';

const CARET_SIZE = 20;

const propTypes = {
  index: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired, // f(newIndex)
  disableDown: PropTypes.bool,
  disableUp: PropTypes.bool,
};

const defaultProps = {
  disableDown: false,
  disableUp: false,
};

export default class SeriesOrderCarets extends React.PureComponent {
  constructor(props) {
    super(props);
    this.onUpClick = this.onUpClick.bind(this);
    this.onDownClick = this.onDownClick.bind(this);
  }

  onUpClick() {
    // Moving "up" a row actually means decreasing the index
    this.props.onClick(this.props.index - 1);
  }

  onDownClick() {
    // Moving "down" a row actually means increasing the index
    this.props.onClick(this.props.index + 1);
  }

  render() {
    return (
      <div className="series-order-carets">
        <div>
          <Caret
            size={CARET_SIZE}
            className="caret-up"
            direction={Caret.Directions.UP}
            onClick={this.onUpClick}
            isDisabled={this.props.disableUp}
          />
        </div>
        <div>
          <Caret
            size={CARET_SIZE}
            className="caret-down"
            onClick={this.onDownClick}
            isDisabled={this.props.disableDown}
          />
        </div>
      </div>
    );
  }
}

SeriesOrderCarets.propTypes = propTypes;
SeriesOrderCarets.defaultProps = defaultProps;
