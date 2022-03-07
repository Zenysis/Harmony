// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import MoreLinks from 'components/Navbar/MoreLinks';
import { autobind } from 'decorators';
import type { DropdownOptionEventHandler } from 'components/Navbar/util';
import type { Locale } from 'components/Navbar/MoreLinks';

function onSelection(
  value: DropdownOptionEventHandler,
  e: SyntheticEvent<HTMLElement>,
) {
  // The value stored is an onClick event we want to use.
  value(e);
}

type DefaultProps = {
  children: ?React.ChildrenArray<
    React.Element<Class<Dropdown.Option<DropdownOptionEventHandler>>>,
  >,
  isAdmin: boolean,
  locales: $ReadOnlyArray<Locale>,
  showDataUpload: boolean,
  showDataUpload: boolean,
  showLocales: boolean,
  visibleName: string,
};

type Props = {
  ...DefaultProps,
  isAuthenticated: boolean,
};

// TODO(stephen): Use the memoizeOne decorator all over the place here.
export default class NavigationDropdown extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    children: null,
    isAdmin: false,
    locales: [],
    showDataUpload: false,
    showLocales: false,
    visibleName: '',
  };

  getDropdownButtonDisplayContent(): React.Element<'span'> {
    const { isAuthenticated, visibleName } = this.props;

    return (
      <span
        className="navbar-dropdown-button__main-icon"
        data-testid="more-items-dropdown"
      >
        {isAuthenticated && `${visibleName}`}&nbsp;&nbsp;
        <i className="glyphicon glyphicon-option-horizontal" />
      </span>
    );
  }

  @autobind
  renderDropdown(
    options: React.ChildrenArray<
      React.Element<Class<Dropdown.Option<DropdownOptionEventHandler>>>,
    >,
  ): React.Element<Class<Dropdown<DropdownOptionEventHandler>>> {
    const { children } = this.props;
    return (
      <Dropdown
        buttonClassName="navbar-dropdown-button"
        defaultDisplayContent={this.getDropdownButtonDisplayContent()}
        displayCurrentSelection={false}
        hideCaret
        menuAlignment={Dropdown.Alignments.RIGHT}
        menuClassName="navbar-dropdown-menu navbar-navigation-dropdown"
        onSelectionChange={onSelection}
        value={undefined}
      >
        {children}
        {options}
      </Dropdown>
    );
  }

  render(): React.Node {
    const { visibleName, ...moreLinksProps } = this.props;
    return <MoreLinks {...moreLinksProps}>{this.renderDropdown}</MoreLinks>;
  }
}
