// @flow
import * as React from 'react';
import classNames from 'classnames';

import Caret from 'components/ui/Caret';
import DropdownItemWrapper from 'components/ui/Dropdown/internal/DropdownItemWrapper';
import type OptionsGroup from 'components/ui/Dropdown/OptionsGroup';

type DefaultProps = {
  ariaName: string | void,
  contentClassName: string,
  isActive: boolean,
  marginPerLevel: ?string,
  testId?: string,
  wrapperClassName: string,
};

type Props<T> = {
  ...DefaultProps,
  children: React.Element<Class<OptionsGroup<T>>>,
  depth: number, // what level of the dropdown hierarchy this item is in
  isOpen: boolean,
  onSelect: (value: string, event: SyntheticEvent<HTMLDivElement>) => void,
};

const { DOWN, RIGHT } = Caret.Directions;

export default class OptionsGroupWrapper<T> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    contentClassName: '',
    isActive: false,
    marginPerLevel: null,
    wrapperClassName: '',
  };

  getId(): string {
    return this.props.children.props.id;
  }

  render(): React.Element<typeof DropdownItemWrapper> {
    const {
      ariaName,
      children,
      contentClassName,
      depth,
      isActive,
      isOpen,
      marginPerLevel,
      onSelect,
      testId,
      wrapperClassName,
    } = this.props;
    const className = classNames(
      wrapperClassName,
      'zen-dropdown-options-group-wrapper',
      { 'zen-dropdown-options-group-wrapper--open': isOpen },
    );

    const caretDirection = isOpen ? DOWN : RIGHT;
    const ariaNameToUse = ariaName || children.props.label;
    return (
      <DropdownItemWrapper
        ariaName={ariaNameToUse}
        contentClassName={contentClassName}
        depth={depth}
        isActive={isActive}
        marginPerLevel={marginPerLevel}
        onSelect={onSelect}
        testId={testId}
        value={this.getId()}
        wrapperClassName={className}
      >
        <Caret
          className="zen-dropdown-options-group-wrapper__caret"
          direction={caretDirection}
        />
        <div className="zen-dropdown-options-group-wrapper__label">
          {children}
        </div>
      </DropdownItemWrapper>
    );
  }
}
