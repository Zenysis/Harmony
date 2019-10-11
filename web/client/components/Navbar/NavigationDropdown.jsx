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

type Props = {|
  isAuthenticated: boolean,
  visibleName: string,

  isAdmin: boolean,
  showLocales: boolean,
  locales: $ReadOnlyArray<Locale>,
  children: ?React.ChildrenArray<
    React.Element<Class<Dropdown.Option<DropdownOptionEventHandler>>>,
  >,
|};

// TODO(stephen): Use the memoizeOne decorator all over the place here.
export default class NavigationDropdown extends React.PureComponent<Props> {
  static defaultProps = {
    children: null,
    isAdmin: false,
    showLocales: false,
    locales: [],
    visibleName: '',
  };

  getDropdownButtonDisplayContent() {
    const { isAuthenticated, visibleName } = this.props;

    return (
      <span className="navbar-dropdown__main-icon">
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
        hideCaret
        className="navbar-dropdown navbar-navigation-dropdown"
        defaultDisplayContent={this.getDropdownButtonDisplayContent()}
        displayCurrentSelection={false}
        onSelectionChange={onSelection}
        menuAlignment={Dropdown.Alignments.RIGHT}
        value={undefined}
      >
        {children}
        {options}
      </Dropdown>
    );
  }

  render() {
    const { visibleName, ...moreLinksProps } = this.props;
    return <MoreLinks {...moreLinksProps}>{this.renderDropdown}</MoreLinks>;
  }
}
