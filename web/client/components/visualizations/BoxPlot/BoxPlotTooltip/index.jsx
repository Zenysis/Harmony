import React from 'react';
import PropTypes from 'prop-types';

import BoxPlotTooltipRow from 'components/visualizations/BoxPlot/BoxPlotTooltip/BoxPlotTooltipRow';
import moment from 'moment';
import { DISPLAY_DATE_FORMAT } from 'components/QueryResult/graphUtil';
import { splitCamelCase } from 'util/stringUtil';

const propTypes = {
  metadata: PropTypes.object.isRequired,
  value: PropTypes.number.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
};

const fieldOrder = [
  'RegionName',
  'ZoneName',
  'WoredaName',
  'date',
  'field',
];

const TEXT = t('query_result.BoxPlot.BoxPlotTooltip');

export default class BoxPlotTooltip extends React.PureComponent {
  constructor(props) {
    super(props);
    this._$tooltipElt = undefined;
  }

  componentDidMount() {
    this.maybeShiftTooltip();
  }

  componentDidUpdate() {
    this.maybeShiftTooltip();
  }

  // shift the tooltip so that it does not go outside the window
  maybeShiftTooltip() {
    const windowWidth = $(window).width();
    const tooltipWidth = this._$tooltipElt.width();
    if (tooltipWidth > windowWidth) {
      // tooltip is wider than the window, so there is no way we can move
      // the tooltip to make it fit in the window. Just leave it as is.
      return;
    }

    this._$tooltipElt.offset((_, { top, left }) => {
      const right = left + tooltipWidth;
      if (left < 0) {
        // tooltip is past left side of the window, so move it
        return { top, left: 10 };
      }

      if (right > windowWidth - 20) {
        // tooltip is past right side of the window, so shift to the left
        return { top, left: windowWidth - tooltipWidth - 20 };
      }

      return { top, left };
    });
  }

  render() {
    const { metadata, value, x, y } = this.props;
    const style = {
      position: 'absolute',
      left: x,
      top: y,
    };

    const formatedDate = moment.utc(metadata.date).format(DISPLAY_DATE_FORMAT);
    const metadataRows = fieldOrder.map((key) => {
      if (key in metadata) {
        return (
          <BoxPlotTooltipRow
            key={key}
            label={splitCamelCase(key)}
            value={key === 'date' ? formatedDate : metadata[key]}
          />
        );
      }
      return null;
    });

    return (
      <div
        ref={(ref) => {
          this._$tooltipElt = $(ref);
        }}
        className="box-plot-tooltip"
        style={style}
      >
        <div className="box-plot-tooltip__content">
          {metadataRows}
          <BoxPlotTooltipRow
            className="box-plot-tooltip__value-row"
            label={TEXT.valueLabel}
            value={value}
          />
        </div>
      </div>
    );
  }
}

BoxPlotTooltip.propTypes = propTypes;
