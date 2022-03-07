// @flow
import * as React from 'react';

import ColorBlock from 'components/ui/ColorBlock';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  fontColor: string,
  fontFamily: string,
  onSeriesClick: (seriesId: string) => void,
};

type Props = {
  ...DefaultProps,
  isDisabled: boolean,
  fontSize: string,
  seriesId: string,
  seriesLabel: string,
  seriesColor: string,
};

export default class SeriesRow extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    onSeriesClick: noop,
    fontColor: 'black',
    fontFamily: 'Arial',
  };

  @autobind
  onSeriesClick() {
    const { onSeriesClick, seriesId } = this.props;
    onSeriesClick(seriesId);
  }

  renderColorBlock(): React.Node {
    return (
      <div className="legend-row__color-block">
        <ColorBlock color={this.props.seriesColor} shape="circle" size={12} />
      </div>
    );
  }

  renderSeriesLabel(): React.Node {
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

  render(): React.Node {
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
