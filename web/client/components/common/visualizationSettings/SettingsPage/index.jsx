// @flow
import * as React from 'react';

type DefaultProps = {
  className: string,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

// TODO(pablo): change this to a functional component
/**
 * The SettingsPage component is used for grouping all the pieces of a
 * specific setting together.
 */
export default class SettingsPage extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
  };

  render(): React.Node {
    const { children, className } = this.props;
    return (
      <div className={`settings-page ${className}`}>
        <div className="settings-page__contents">{children}</div>
      </div>
    );
  }
}
