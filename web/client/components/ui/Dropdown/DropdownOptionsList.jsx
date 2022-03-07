// @flow
import * as React from 'react';

import Option from 'components/ui/Dropdown/Option';
import OptionWrapper from 'components/ui/Dropdown/internal/OptionWrapper';
import OptionsGroup from 'components/ui/Dropdown/OptionsGroup';
import OptionsGroupWrapper from 'components/ui/Dropdown/internal/OptionsGroupWrapper';
import autobind from 'decorators/autobind';
import { uniqueId } from 'util/util';
import type GraphSearchResults from 'models/ui/common/GraphSearchResults';
import type { DropdownChildType } from 'components/ui/Dropdown/types';

const TEXT = t('ui.Dropdown');

type DropdownChildTypeWrapper<T> =
  | React.Element<Class<OptionWrapper<T>>>
  | React.Element<Class<OptionsGroupWrapper<T>>>;

type DefaultProps<T> = {
  enableSelectAll: boolean,
  preOptionsContent: React.Node,
  pinnedValues: $ReadOnlyArray<T>,
};

type Props<T> = {
  ...DefaultProps<T>,

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

  /** Used to determine which values should be shown as selected. */
  selectedValues: $ReadOnlyArray<T>,
  useSearch: boolean,
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
/**
 * @visibleName Dropdown.OptionsList
 */
export default class DropdownOptionsList<T> extends React.PureComponent<
  Props<T>,
> {
  static defaultProps: DefaultProps<T> = {
    enableSelectAll: false,
    pinnedValues: [],
    preOptionsContent: null,
  };

  @autobind
  pinnedOptionFilter(option: DropdownChildType<T>): boolean {
    const { pinnedValues } = this.props;
    if (option.type !== Option) {
      // Don't pin options groups
      return false;
    }

    const castOption: React.Element<Class<Option<T>>> = (option: $Cast);
    const { value } = castOption.props;
    return pinnedValues.includes(value);
  }

  @autobind
  unpinnedOptionFilter(option: DropdownChildType<T>): boolean {
    return !this.pinnedOptionFilter(option);
  }

  isOptionsGroupOpen(groupVal: string): boolean {
    return this.props.openGroups.has(groupVal);
  }

  maybeRenderNoOptionsContent(): ?React.Element<Class<OptionWrapper<T>>> {
    const { children, noOptionsContent } = this.props;

    if (React.Children.toArray(children).length === 0) {
      return this.renderSingleOption(
        makeUnselectableOption(noOptionsContent),
        0,
        true,
      );
    }

    return null;
  }

  maybeRenderEmptySearchResultsContent(): ?React.Element<
    Class<OptionWrapper<T>>,
  > {
    const { searchResults, searchText, useSearch } = this.props;

    if (useSearch && searchText !== '' && searchResults.hasNoMatches()) {
      return this.renderSingleOption(
        makeUnselectableOption(
          t('ui.Dropdown.emptySearchResults', { searchText }),
        ),
        0,
        true,
      );
    }

    return null;
  }

  maybeRenderPreOptionsContent(): ?React.Element<Class<OptionWrapper<T>>> {
    const { preOptionsContent } = this.props;
    if (preOptionsContent === null) {
      return null;
    }

    return this.renderSingleOption(
      makeUnselectableOption(preOptionsContent),
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
      <Option key="__selectAll__" value="__selectAll__">
        {TEXT.selectAll}
      </Option>
    );
    const isActive = displayCurrentSelection && allChildrenSelected;

    return (
      <OptionWrapper
        key={_getKey(option)}
        ariaName={TEXT.selectAll}
        contentClassName="zen-dropdown__select-all-option"
        depth={0}
        isActive={isActive}
        marginPerLevel={marginPerLevel}
        multiselect={multiselect}
        onSelect={onOptionClick}
        unselectable={false}
        testId={_getKey(option).toString()}
      >
        {option}
      </OptionWrapper>
    );
  }

  renderSingleOption(
    option: React.Element<Class<Option<T>>>,
    depth: number,
    forceRender: boolean,
  ): React.Element<Class<OptionWrapper<T>>> | null {
    const {
      displayCurrentSelection,
      marginPerLevel,
      multiselect,
      onOptionClick,
      selectedValues,
      searchResults,
    } = this.props;
    const {
      unselectable,
      value,
      wrapperClassName,
      className,
      ariaName,
      maxOptionCharacterCount,
      searchableText,
      style,
    } = option.props;

    if (
      forceRender ||
      unselectable ||
      searchResults.someLeafMatchesValue(value)
    ) {
      const isActive =
        displayCurrentSelection && selectedValues.includes(value);
      return (
        <OptionWrapper
          key={_getKey(option)}
          ariaName={ariaName}
          wrapperClassName={wrapperClassName}
          contentClassName={className}
          depth={depth}
          isActive={isActive}
          marginPerLevel={marginPerLevel}
          multiselect={multiselect}
          onSelect={onOptionClick}
          unselectable={unselectable}
          style={style}
          title={
            maxOptionCharacterCount !== undefined &&
            searchableText.length > maxOptionCharacterCount
              ? searchableText
              : undefined
          }
          testId={_getKey(option).toString()}
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
    const { id, ariaName, wrapperClassName, className } = optGroup.props;
    const items = [];
    if (forceRender || searchResults.someParentOrChildMatchesValue(id)) {
      items.push(
        <OptionsGroupWrapper
          key={_getKey(optGroup)}
          ariaName={ariaName}
          onSelect={onOptionsGroupClick}
          wrapperClassName={wrapperClassName}
          contentClassName={className}
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
    filter: (option: DropdownChildType<T>) => boolean = () => true,
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

      if (filter(option)) {
        if (option.type === Option) {
          const castOption: React.Element<Class<Option<T>>> = (option: $Cast);
          options.push(this.renderSingleOption(castOption, depth, forceRender));
        } else if (option.type === OptionsGroup) {
          const castOptGroup: React.Element<
            Class<OptionsGroup<T>>,
          > = (option: $Cast);
          const items = this.renderOptionsGroup(
            castOptGroup,
            depth,
            forceRender,
          );
          options.push(...items);
        }
      }
    });

    return options;
  }

  render(): React.Element<'ul'> {
    const { children, useSearch } = this.props;
    const items = React.Children.toArray(children);

    const options = [
      this.maybeRenderSelectAll(),
      this.maybeRenderNoOptionsContent(),
      this.maybeRenderEmptySearchResultsContent(),
      this.maybeRenderPreOptionsContent(),
      this.renderOptions(items, 0, !useSearch, this.pinnedOptionFilter),
      this.renderOptions(items, 0, !useSearch, this.unpinnedOptionFilter),
    ];

    return (
      <ul role="listbox" className="zen-dropdown__option-list">
        {options}
      </ul>
    );
  }
}
