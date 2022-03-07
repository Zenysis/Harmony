// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';
import Spacing from 'components/ui/Spacing';

type DefaultProps = {
  className: string,
  title: React.Node,
};

type Props = {
  ...DefaultProps,
  children: React.Node,
};

/**
 * The SettingsBlock component is used to wrap an individual setting section
 * within a setting page.
 */
export default class SettingsBlock extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
    title: '',
  };

  render(): React.Node {
    const { className, children, title } = this.props;
    return (
      <Spacing className={className} marginBottom="l">
        {title && <Heading.Small>{title}</Heading.Small>}
        <Spacing marginTop="xs">{children}</Spacing>
      </Spacing>
    );
  }
}
