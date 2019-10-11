// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';

type Props = {
  children: React.Node,

  className: string,
  title: React.Node,
};

/**
 * The SettingsBlock component is used to wrap an individual setting section
 * within a setting page.
 */
export default class SettingsBlock extends React.PureComponent<Props> {
  static defaultProps = {
    className: '',
    title: '',
  };

  maybeRenderTitle() {
    const { title } = this.props;
    if (!title) {
      return null;
    }

    return (
      <div className="settings-block__title">
        <Heading size={Heading.Sizes.SMALL}>{title}</Heading>
      </div>
    );
  }

  render() {
    const { className, children } = this.props;
    return (
      <div className={`settings-block ${className}`}>
        {this.maybeRenderTitle()}
        <div className="settings-block__contents">{children}</div>
      </div>
    );
  }
}
