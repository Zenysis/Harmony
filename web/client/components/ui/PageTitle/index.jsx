// @flow
import * as React from 'react';
import classNames from 'classnames';

import type { StyleObject } from 'types/jsCore';

type Props = {|
  title: string,

  className: string,
  subtitle: string,
  style?: StyleObject,
|};

/**
 * This component is deprecated. Do not use it anymore for any new purposes.
 *
 * This is a bar that extends the entire width of a page.
 * @deprecated
 */
export default class PageTitle extends React.PureComponent<Props> {
  static defaultProps = {
    subtitle: '',
    className: '',
    style: undefined,
  };

  maybeRenderSubtitle() {
    if (this.props.subtitle) {
      return (
        <div className="zen-page-title__subtitle">{this.props.subtitle}</div>
      );
    }
    return null;
  }

  renderTitle() {
    return <div className="zen-page-title__title">{this.props.title}</div>;
  }

  render() {
    const className = classNames('zen-page-title', this.props.className);
    return (
      <div className={className} style={this.props.style}>
        {this.renderTitle()}
        {this.maybeRenderSubtitle()}
      </div>
    );
  }
}
