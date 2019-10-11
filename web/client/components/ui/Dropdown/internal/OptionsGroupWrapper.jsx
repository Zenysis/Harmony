// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';
import DropdownItemWrapper from 'components/ui/Dropdown/internal/DropdownItemWrapper';
import type OptionsGroup from 'components/ui/Dropdown/OptionsGroup';

type Props<T> = {
  children: React.Element<Class<OptionsGroup<T>>>,
  depth: number, // what level of the dropdown hierarchy this item is in
  isOpen: boolean,
  onSelect: (value: string, event: SyntheticEvent<HTMLDivElement>) => void,

  className: string,
  isActive: boolean,
  marginPerLevel: ?string,
};

const { DOWN, RIGHT } = Caret.Directions;

export default class OptionsGroupWrapper<T> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps = {
    className: '',
    isActive: false,
    marginPerLevel: null,
  };

  getId(): string {
    return this.props.children.props.id;
  }

  render() {
    const { isActive, isOpen, depth, onSelect, marginPerLevel } = this.props;
    const className = classNames(
      this.props.className,
      'zen-dropdown-options-group-wrapper',
      { 'zen-dropdown-options-group-wrapper--open': isOpen },
    );

    const caretDirection = isOpen ? DOWN : RIGHT;

    return (
      <DropdownItemWrapper
        isActive={isActive}
        depth={depth}
        onSelect={onSelect}
        className={className}
        value={this.getId()}
        marginPerLevel={marginPerLevel}
      >
        <Caret
          className="zen-dropdown-options-group-wrapper__caret"
          direction={caretDirection}
        />
        <div className="zen-dropdown-options-group-wrapper__label">
          {this.props.children}
        </div>
      </DropdownItemWrapper>
    );
  }
}
