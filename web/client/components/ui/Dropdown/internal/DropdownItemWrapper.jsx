// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';
import normalizeARIAName from 'components/ui/util/normalizeARIAName';
import { stopDropdownClickEvent } from 'components/ui/Dropdown/util';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  ariaName: string | void,
  contentClassName: string,
  marginPerLevel: ?string,
  multiselect: boolean,
  style: StyleObject | void,
  title: string | void,
  unselectable: boolean,
  wrapperClassName: string,
  testId: string,
};

type Props<T> = {
  ...DefaultProps,
  children: React.Node,
  depth: number, // what level of the dropdown hierarchy this item is in
  isActive: boolean,
  onSelect: (optionValue: T, event: SyntheticEvent<HTMLDivElement>) => void,
  value: T,
};

// multiply marginPerLevel * depth, and add the unit 'px' or 'em'
function calculateMargin(marginPerLevel: string, depth: number): ?string {
  if (depth === 0 || marginPerLevel === '') {
    return undefined;
  }

  const margin: number = parseFloat(marginPerLevel);

  // TODO(pablo): this is not safe. slicing last two chars breaks with 'rem'
  // values.
  const unit: string = marginPerLevel.slice(-2);
  if (unit === 'px' || unit === 'em') {
    return `${margin * depth}${unit}`;
  }
  throw new Error("[Dropdown] marginPerLevel string must end in 'em' or 'px'");
}

/**
 * DropdownItemWrapper is a base component used to render both
 * OptionsGroupWrapper and OptionWrapper.
 *
 * OptionsGroupWrapper and OptionWrapper have a lot of shared logic
 * (e.g. calculating margin indentation at a given depth). So both of
 * them compose DropdownItemWrapper which handles the common logic.
 */
export default class DropdownItemWrapper<T> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps: DefaultProps = {
    ariaName: undefined,
    contentClassName: '',
    marginPerLevel: null,
    multiselect: false,
    style: undefined,
    title: undefined,
    unselectable: false,
    wrapperClassName: '',
    testId: '',
  };

  getStyle(): StyleObject | void {
    const { marginPerLevel, depth, style } = this.props;
    if (marginPerLevel === undefined || marginPerLevel === null) {
      return style;
    }
    return {
      ...style,
      marginLeft: calculateMargin(marginPerLevel, depth),
    };
  }

  @autobind
  onItemClick(event: SyntheticEvent<HTMLDivElement>) {
    const { onSelect, unselectable, value } = this.props;
    if (unselectable) {
      stopDropdownClickEvent(event);
    } else {
      onSelect(value, event);
    }
  }

  maybeRenderCheckbox(): React.Element<typeof Icon> | null {
    const { isActive, multiselect } = this.props;
    if (!multiselect || !isActive) {
      return null;
    }

    return (
      <Icon
        ariaHidden
        className="zen-dropdown-item-wrapper__checkbox"
        type="ok"
      />
    );
  }

  render(): React.Element<'li'> {
    const {
      ariaName,
      children,
      depth,
      isActive,
      multiselect,
      unselectable,
      wrapperClassName,
      contentClassName,
      title,
      testId,
    } = this.props;
    const listItemClassName = classNames(
      'zen-dropdown-item-wrapper',
      wrapperClassName,
      {
        'zen-dropdown-item-wrapper--selected': isActive && !multiselect,
        'zen-dropdown-item-wrapper--multiselect-selected':
          isActive && multiselect,
        'zen-dropdown-item-wrapper--unselectable': unselectable,
      },
    );

    const innerClassName = classNames(
      'zen-dropdown-item-wrapper__content',
      `zen-dropdown-item-wrapper__depth-${depth}`,
      contentClassName,
    );

    return (
      <li className={listItemClassName}>
        <div
          aria-label={normalizeARIAName(ariaName)}
          role="option"
          aria-selected={isActive}
          className={innerClassName}
          onClick={this.onItemClick}
          style={this.getStyle()}
          title={title}
          data-testid={testId.replace(/[^a-zA-Z]/g, '')}
        >
          {this.maybeRenderCheckbox()}
          {children}
        </div>
      </li>
    );
  }
}
