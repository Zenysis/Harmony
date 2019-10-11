// @flow
import * as React from 'react';

type Props = {
  children: React.Node,

  className: string,
};

/**
 * The SettingsPage component is used for grouping all the pieces of a
 * specific setting together.
 */
export default class SettingsPage extends React.PureComponent<Props> {
  static defaultProps = {
    title: '',
    className: '',
    helpText: '',
  };

  render() {
    const { children, className } = this.props;
    return (
      <div className={`settings-page ${className}`}>
        <div className="settings-page__contents">{children}</div>
      </div>
    );
  }
}
