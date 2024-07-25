// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';

type DefaultProps = {
  className: string,
  title: string,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

export default class InsightsSubsection extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
    title: '',
  };

  maybeRenderTitle(): React.Element<typeof Heading.Small> | null {
    const { title } = this.props;
    if (title.length === 0) {
      return null;
    }
    return (
      <Heading.Small className="insights-subsection__title">
        {title}
      </Heading.Small>
    );
  }

  render(): React.Element<'div'> {
    const { children, className } = this.props;
    return (
      <div className={`insights-subsection ${className}`}>
        {this.maybeRenderTitle()}
        {children}
      </div>
    );
  }
}
