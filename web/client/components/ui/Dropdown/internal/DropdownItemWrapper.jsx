// @flow
import * as React from 'react';
import classNames from 'classnames';

import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';
import { stopDropdownClickEvent } from 'components/ui/Dropdown/util';
import type { StyleObject } from 'types/jsCore';

type Props<T> = {
  children: React.Node,
  depth: number, // what level of the dropdown hierarchy this item is in
  isActive: boolean,
  onSelect: (optionValue: T, event: SyntheticEvent<HTMLDivElement>) => void,
  value: T,

  className: string,
  marginPerLevel: ?string,
  multiselect: boolean,
  unselectable: boolean,
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
  static defaultProps = {
    className: '',
    marginPerLevel: null,
    multiselect: false,
    unselectable: false,
  };

  getStyle(): ?StyleObject {
    const { marginPerLevel, depth } = this.props;
    if (marginPerLevel === undefined || marginPerLevel === null) {
      return undefined;
    }
    return {
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

  maybeRenderCheckbox() {
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

  render() {
    const {
      children,
      className,
      depth,
      isActive,
      multiselect,
      unselectable,
    } = this.props;
    const listItemClassName = classNames(
      'zen-dropdown-item-wrapper',
      className,
      {
        'zen-dropdown-item-wrapper--selected': isActive && !multiselect,
        'zen-dropdown-item-wrapper--multiselect-selected':
          isActive && multiselect,
        'zen-dropdown-item-wrapper--unselectable': unselectable,
      },
    );

    const contentClassName = classNames(
      'zen-dropdown-item-wrapper__content',
      `zen-dropdown-item-wrapper__depth-${depth}`,
    );

    return (
      <li className={listItemClassName}>
        <div
          role="button"
          className={contentClassName}
          onClick={this.onItemClick}
          style={this.getStyle()}
        >
          {this.maybeRenderCheckbox()}
          {children}
        </div>
      </li>
    );
  }
}
