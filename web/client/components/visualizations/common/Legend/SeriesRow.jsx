// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type { StyleObject } from 'types/jsCore';

type Props = {
  isDisabled: boolean,
  fontSize: string,
  seriesId: string,
  seriesLabel: string,
  seriesColor: string,

  fontColor: string,
  fontFamily: string,
  onSeriesClick: (seriesId: string) => void,
};

const defaultProps = {
  onSeriesClick: noop,
  fontColor: 'black',
  fontFamily: 'Arial',
};

export default class SeriesRow extends React.PureComponent<Props> {
  static defaultProps = defaultProps;

  @autobind
  onSeriesClick() {
    const { onSeriesClick, seriesId } = this.props;
    onSeriesClick(seriesId);
  }

  renderColorBlock() {
    return (
      <div className="legend-row__color-block">
        <ColorBlock color={this.props.seriesColor} size={14} />
      </div>
    );
  }

  renderSeriesLabel() {
    const { fontSize, fontColor, fontFamily, seriesLabel } = this.props;

    const style: StyleObject = {
      fontSize,
      fontFamily,
      color: fontColor,
      lineHeight: fontSize,
    };

    return (
      <div
        onClick={this.onSeriesClick}
        className="legend-row__text"
        style={style}
        role="link"
      >
        {seriesLabel}
      </div>
    );
  }

  render() {
    const className = !this.props.isDisabled
      ? 'legend-row'
      : 'legend-row legend-row--disabled';
    return (
      <div className={className}>
        {this.renderColorBlock()}
        {this.renderSeriesLabel()}
      </div>
    );
  }
}
