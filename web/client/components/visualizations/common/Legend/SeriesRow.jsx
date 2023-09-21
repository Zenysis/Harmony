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
  fontSize: string,
  isDisabled: boolean,
  seriesColor: string,
  seriesId: string,
  seriesLabel: string,
};

export default class SeriesRow extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    fontColor: 'black',
    fontFamily: 'Arial',
    onSeriesClick: noop,
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
    const { fontColor, fontFamily, fontSize, seriesLabel } = this.props;

    const style: StyleObject = {
      fontFamily,
      fontSize,
      color: fontColor,
      lineHeight: fontSize,
    };

    return (
      <div
        className="legend-row__text"
        onClick={this.onSeriesClick}
        role="link"
        style={style}
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
