// @flow
import * as React from 'react';
import classNames from 'classnames';

import DropdownItemWrapper from 'components/ui/Dropdown/internal/DropdownItemWrapper';
import type Option from 'components/ui/Dropdown/Option';

type Props<T> = {
  children: React.Element<Class<Option<T>>>,
  depth: number,
  onSelect: (value: T, event: SyntheticEvent<HTMLDivElement>) => void,

  className: string,
  isActive: boolean,
  marginPerLevel: ?string,
  multiselect: boolean,
  unselectable: boolean,
};

export default class OptionWrapper<T> extends React.PureComponent<Props<T>> {
  static defaultProps = {
    className: '',
    isActive: false,
    marginPerLevel: null,
    multiselect: false,
    unselectable: false,
  };

  getValue(): T {
    return this.props.children.props.value;
  }

  render() {
    const {
      depth,
      isActive,
      marginPerLevel,
      multiselect,
      onSelect,
      unselectable,
    } = this.props;
    const className = classNames(
      'zen-dropdown-option-wrapper',
      this.props.className,
    );

    return (
      <DropdownItemWrapper
        className={className}
        depth={depth}
        isActive={isActive}
        marginPerLevel={marginPerLevel}
        multiselect={multiselect}
        onSelect={onSelect}
        unselectable={unselectable}
        value={this.getValue()}
      >
        {this.props.children}
      </DropdownItemWrapper>
    );
  }
}
