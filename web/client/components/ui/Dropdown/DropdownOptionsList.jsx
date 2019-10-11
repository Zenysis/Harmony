// @flow
import * as React from 'react';

import Option from 'components/ui/Dropdown/Option';
import OptionWrapper from 'components/ui/Dropdown/internal/OptionWrapper';
import OptionsGroup from 'components/ui/Dropdown/OptionsGroup';
import OptionsGroupWrapper from 'components/ui/Dropdown/internal/OptionsGroupWrapper';
import { uniqueId } from 'util/util';
import type GraphSearchResults from 'models/ui/common/GraphSearchResults';
import type { DropdownChildType } from 'components/ui/Dropdown';

const TEXT = t('ui.Dropdown');

type DropdownChildTypeWrapper<T> =
  | React.Element<Class<OptionWrapper<T>>>
  | React.Element<Class<OptionsGroupWrapper<T>>>;

type Props<T> = {
  // if all children including option children of groups are selected
  allChildrenSelected: boolean,
  children: React.ChildrenArray<?DropdownChildType<T>>,
  displayCurrentSelection: boolean,
  emptyOptionsGroupContent: React.Node,
  marginPerLevel: string,
  multiselect: boolean,
  noOptionsContent: React.Node,
  openGroups: $ReadOnlySet<string>,
  onOptionClick: (value: T, event: SyntheticEvent<HTMLDivElement>) => void,
  onOptionsGroupClick: (
    value: string,
    event: SyntheticEvent<HTMLDivElement>,
  ) => void,
  searchResults: GraphSearchResults<string, T>,
  searchText: string,
  selectedValues: $ReadOnlyArray<T>,
  useSearch: boolean,

  enableSelectAll: boolean,
  selectedOptions: $ReadOnlyArray<React.Element<Class<Option<T>>>>,
};

function makeUnselectableOption(
  content: React.Node,
  className: string = '',
): React.Element<Class<Option<$AllowAny>>> {
  return (
    <Option
      className={className}
      disableSearch
      key={uniqueId()}
      value="__not_selectable__"
      unselectable
    >
      {content}
    </Option>
  );
}

function _getKey<T>(
  element:
    | React.Element<Class<Option<T>>>
    | React.Element<Class<OptionsGroup<T>>>,
  isSelectedOption: boolean = false,
): React.Key {
  if (element.key !== undefined && element.key !== null) {
    return element.key;
  }
  if (element.type === OptionsGroup) {
    const optGroup: React.Element<Class<OptionsGroup<T>>> = (element: $Cast);
    return optGroup.props.id;
  }

  const option: React.Element<Class<Option<T>>> = (element: $Cast);
  const { value } = option.props;
  const keyType = typeof value;
  const key =
    keyType === 'string' || keyType === 'number' ? String(value) : uniqueId();
  return isSelectedOption ? `${key}_selected` : key;
}

export default class DropdownOptionsList<T> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps = {
    enableSelectAll: false,
    selectedOptions: [],
  };

  isOptionsGroupOpen(groupVal: string): boolean {
    return this.props.openGroups.has(groupVal);
  }

  maybeRenderSelectedOptions(): $ReadOnlyArray<?DropdownChildTypeWrapper<T>> {
    const { selectedOptions } = this.props;
    if (selectedOptions.length === 0) {
      return [];
    }

    return this.renderOptions(
      [
        ...selectedOptions,
        makeUnselectableOption('', 'zen-dropdown__dividing-line'),
      ],
      0,
      true,
    );
  }

  maybeRenderSelectAll(): ?React.Element<Class<OptionWrapper<$AllowAny>>> {
    const {
      allChildrenSelected,
      displayCurrentSelection,
      enableSelectAll,
      marginPerLevel,
      multiselect,
      onOptionClick,
      searchText,
    } = this.props;

    if (!enableSelectAll || searchText !== '') {
      return null;
    }

    const option = (
      <Option
        key="__selectAll__"
        value="__selectAll__"
        className="zen-dropdown__select-all-option"
      >
        {TEXT.selectAll}
      </Option>
    );
    const { unselectable, wrapperClassName } = option.props;
    const isActive = displayCurrentSelection && allChildrenSelected;

    return (
      <OptionWrapper
        key={_getKey(option)}
        className={wrapperClassName}
        depth={0}
        isActive={isActive}
        marginPerLevel={marginPerLevel}
        multiselect={multiselect}
        onSelect={onOptionClick}
        unselectable={unselectable}
      >
        {option}
      </OptionWrapper>
    );
  }

  renderSingleOption(
    option: React.Element<Class<Option<T>>>,
    depth: number,
    forceRender: boolean,
  ): ?React.Element<Class<OptionWrapper<T>>> {
    const {
      displayCurrentSelection,
      marginPerLevel,
      multiselect,
      onOptionClick,
      selectedValues,
      searchResults,
    } = this.props;
    const { unselectable, value, wrapperClassName } = option.props;
    if (
      forceRender ||
      unselectable ||
      searchResults.someLeafMatchesValue(value)
    ) {
      const isActive =
        displayCurrentSelection && selectedValues.includes(value);

      return (
        // $FlowSuppressError - flow doesn't realize this is of valid type
        <OptionWrapper
          key={_getKey(option)}
          className={wrapperClassName}
          depth={depth}
          isActive={isActive}
          marginPerLevel={marginPerLevel}
          multiselect={multiselect}
          onSelect={onOptionClick}
          unselectable={unselectable}
        >
          {option}
        </OptionWrapper>
      );
    }
    return null;
  }

  renderOptionsGroup(
    optGroup: React.Element<Class<OptionsGroup<T>>>,
    depth: number,
    forceRender: boolean,
  ): $ReadOnlyArray<?DropdownChildTypeWrapper<T>> {
    const { marginPerLevel, searchResults, onOptionsGroupClick } = this.props;
    const { id, wrapperClassName } = optGroup.props;
    const items = [];
    if (forceRender || searchResults.someParentOrChildMatchesValue(id)) {
      items.push(
        <OptionsGroupWrapper
          key={_getKey(optGroup)}
          onSelect={onOptionsGroupClick}
          className={wrapperClassName}
          isOpen={this.isOptionsGroupOpen(id)}
          depth={depth}
          marginPerLevel={marginPerLevel}
        >
          {optGroup}
        </OptionsGroupWrapper>,
      );

      // if the OptionsGroup is open, render the children
      if (this.isOptionsGroupOpen(id)) {
        const subOptions = React.Children.toArray(optGroup.props.children);

        // if there are no children add the default emptyOptionsGroupContent
        if (subOptions.length === 0) {
          const { emptyOptionsGroupContent } = this.props;
          subOptions.push(makeUnselectableOption(emptyOptionsGroupContent));
        }

        const renderAllChildren =
          forceRender || searchResults.someParentMatchesValue(id);

        items.push(
          ...this.renderOptions(subOptions, depth + 1, renderAllChildren),
        );
      }
    }

    // $FlowSuppressError - flow doesn't realize this array is of valid type
    return items;
  }

  /**
   * Recursive function to render all <Option> and <OptionsGroup> children.
   * `depth` keeps track of how deep into the hierarchy we are, so this can
   * be passed as a prop to the OptionWrapper when we render them.
   *
   * Every Option is tested against the search results to see if we should
   * render it (unless `renderEverything` is true). If there is no searchText,
   * it renders by default.
   */
  renderOptions(
    childrenArray: $ReadOnlyArray<?DropdownChildType<T>>,
    depth: number,
    renderEverything: boolean,
  ): $ReadOnlyArray<?DropdownChildTypeWrapper<T>> {
    const { searchText } = this.props;
    const options = [];

    childrenArray.forEach(option => {
      if (!option) {
        return;
      }

      const { disableSearch } = option.props;
      const forceRender =
        renderEverything || disableSearch || searchText === '';

      if (option.type === Option) {
        const castOption: React.Element<Class<Option<T>>> = (option: any);
        options.push(this.renderSingleOption(castOption, depth, forceRender));
      } else if (option.type === OptionsGroup) {
        const castOptGroup: React.Element<
          Class<OptionsGroup<T>>,
        > = (option: any);
        const items = this.renderOptionsGroup(castOptGroup, depth, forceRender);
        options.push(...items);
      }
    });

    return options;
  }

  render() {
    const {
      children,
      noOptionsContent,
      searchResults,
      searchText,
      useSearch,
    } = this.props;
    const items = React.Children.toArray(children);
    if (items.length === 0) {
      items.push(makeUnselectableOption(noOptionsContent));
    }

    if (useSearch && searchText !== '' && searchResults.hasNoMatches()) {
      items.push(
        makeUnselectableOption(
          t('ui.Dropdown.emptySearchResults', { searchText }),
        ),
      );
    }

    const options = [
      this.maybeRenderSelectAll(),
      this.maybeRenderSelectedOptions(),
      this.renderOptions(items, 0, !useSearch),
    ];

    return <ul className="zen-dropdown__option-list">{options}</ul>;
  }
}
