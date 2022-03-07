// @flow
import * as React from 'react';
import classNames from 'classnames';

import DropdownItemWrapper from 'components/ui/Dropdown/internal/DropdownItemWrapper';
import type Option from 'components/ui/Dropdown/Option';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  contentClassName: string,
  isActive: boolean,
  marginPerLevel: ?string,
  multiselect: boolean,
  style: StyleObject | void,
  title: string | void,
  unselectable: boolean,
  wrapperClassName: string,
  testId?: string,
};

type Props<T> = {
  ...DefaultProps,
  ariaName: string | void,
  children: React.Element<Class<Option<T>>>,
  depth: number,
  onSelect: (value: T, event: SyntheticEvent<HTMLDivElement>) => void,
};

export default class OptionWrapper<T> extends React.PureComponent<Props<T>> {
  static defaultProps: DefaultProps = {
    contentClassName: '',
    isActive: false,
    marginPerLevel: null,
    multiselect: false,
    style: undefined,
    title: undefined,
    unselectable: false,
    wrapperClassName: '',
    testId: undefined,
  };

  getValue(): T {
    return this.props.children.props.value;
  }

  render(): React.Element<typeof DropdownItemWrapper> {
    const {
      ariaName,
      children,
      contentClassName,
      depth,
      isActive,
      marginPerLevel,
      multiselect,
      onSelect,
      unselectable,
      style,
      title,
      testId,
    } = this.props;
    const wrapperClassName = classNames(
      'zen-dropdown-option-wrapper',
      this.props.wrapperClassName,
    );

    const contents = children.props.children;
    const ariaNameToUse =
      ariaName ||
      (typeof contents === 'string' || typeof contents === 'number'
        ? String(contents)
        : undefined);

    return (
      <DropdownItemWrapper
        ariaName={ariaNameToUse}
        wrapperClassName={wrapperClassName}
        contentClassName={contentClassName}
        depth={depth}
        isActive={isActive}
        marginPerLevel={marginPerLevel}
        multiselect={multiselect}
        onSelect={onSelect}
        unselectable={unselectable}
        value={this.getValue()}
        style={style}
        title={title}
        testId={testId}
      >
        {children}
      </DropdownItemWrapper>
    );
  }
}
