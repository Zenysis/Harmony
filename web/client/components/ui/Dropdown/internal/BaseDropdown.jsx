// @flow
import * as React from 'react';
import classNames from 'classnames';
import invariant from 'invariant';

import Caret from 'components/ui/Caret';
import DropdownButton from 'components/ui/Dropdown/internal/DropdownButton';
import DropdownGraphNodeView from 'models/ui/Dropdown/DropdownGraphNodeView';
import DropdownOptionsList from 'components/ui/Dropdown/DropdownOptionsList';
import DropdownSearchBar from 'components/ui/Dropdown/internal/DropdownSearchBar';
import GraphIterator from 'util/GraphIterator';
import GraphSearchResults from 'models/ui/common/GraphSearchResults';
import InputText from 'components/ui/InputText';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Option from 'components/ui/Dropdown/Option';
import OptionsGroup from 'components/ui/Dropdown/OptionsGroup';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { stopDropdownClickEvent } from 'components/ui/Dropdown/util';
import type { CaretType } from 'components/ui/Caret';
import type { StyleObject } from 'types/jsCore';

const TEXT = t('ui.Dropdown');

// The time (in ms) that that the search text has to not change before a
// search request is made.
const ASYNC_SEARCH_DELAY = 2000;

export type DropdownChildType<T> =
  | React.Element<Class<Option<T>>>
  | React.Element<Class<OptionsGroup<T>>>;

type Alignment = 'left' | 'right';

type Intent = 'default' | 'primary' | 'success' | 'danger' | 'info' | 'warning';

type IntentsMap = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
};

type AlignmentsMap = {
  LEFT: 'left',
  RIGHT: 'right',
};

export const ALIGNMENTS: AlignmentsMap = {
  LEFT: 'left',
  RIGHT: 'right',
};

export const INTENTS: IntentsMap = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
};

type SingleSelectControlledProps<T> = {
  isControlled: true,
  isMultiselect: false,
  value: T | void,
  onSelectionChange: (
    selectedValue: T,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
  renderButtonLabel?: (selectedValue: T) => React.Node,
};

type SingleSelectUncontrolledProps<T> = {
  isControlled: false,
  isMultiselect: false,
  initialValue: T | void,
  onSelectionChange?: (
    selectedValue: T,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
  renderButtonLabel?: (selectedValue: T) => React.Node,
};

type BaseMultiselectProps<T> = {
  // Option to select all of the options in the dropdown
  enableSelectAll: boolean,
  multiselectSelectionLabel: string,

  // function to call to determine what to display on the button
  renderButtonLabel?: (selectedValues: $ReadOnlyArray<T>) => React.Node,

  // If selectedOptions are provided then these will be shown at the top of the
  // dropdown. They will be seperated by a dividing line and will be shown
  // regardless of the search term.
  selectedOptions: $ReadOnlyArray<React.Element<Class<Option<T>>>>,
};

type MultiselectControlledProps<T> = {
  ...BaseMultiselectProps<T>,
  isControlled: true,
  isMultiselect: true,
  value: $ReadOnlyArray<T>,
  onSelectionChange: (
    selectedValues: $ReadOnlyArray<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
};

type MultiselectUncontrolledProps<T> = {
  ...BaseMultiselectProps<T>,
  isControlled: false,
  isMultiselect: true,
  initialValue: $ReadOnlyArray<T>,
  onSelectionChange?: (
    selectedValues: $ReadOnlyArray<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
};

type BaseProps<T> = {
  buttonClassName: string,
  buttonMinWidth?: number,
  buttonIntent: Intent,
  buttonWidth?: string | number,
  caretType: CaretType,
  children: React.ChildrenArray<
    ?React.Element<Class<Option<T>>> | ?React.Element<Class<OptionsGroup<T>>>,
  >,
  className: string,

  // Added to make control of dropdown position opt out
  controlDropDownPosition: boolean,

  // Used to show tooltips
  // TODO(pablo): Remove this and use a Tooltip wrapper instead
  dataContent?: string,
  debounceSearch: boolean,

  // main contents to show when no selection is displayed
  defaultDisplayContent: React.Node,
  disableSelect: boolean, // disable ability to select options
  displayCurrentSelection: boolean,

  // contents to show when a group with no options is expanded
  emptyOptionsGroupContent: React.Node,
  enableSearch: boolean,
  expandSearchResults: boolean,
  hideCaret: boolean,

  // The margin-left to add at each level of the dropdown hierarchy. If we're
  // using OptionGroups,  this is useful so that each level can be indented.
  // The margin must be in 'em' or 'px'
  marginPerLevel: string,
  menuAlignment: Alignment,
  menuMaxHeight?: number,
  menuMinWidth?: string | number,
  menuWidth?: string | number,

  // dropdown contents to show when there are no options
  noOptionsContent: React.Node,
  noAsyncSearchContent: React.Node,
  onAsyncSearch?: (searchText: string, callback: () => void) => void,
  onOpenDropdownClick?: () => void,
  searchDebounceTimeoutMs: number,
  searchInputPlaceholder: string,
  valueStyle?: StyleObject,
};

type Props<T> =
  | (BaseProps<T> & SingleSelectControlledProps<T>)
  | (BaseProps<T> & SingleSelectUncontrolledProps<T>)
  | (BaseProps<T> & MultiselectControlledProps<T>)
  | (BaseProps<T> & MultiselectUncontrolledProps<T>);

type State<T> = {
  asyncSearchLoading: boolean,
  asyncSearchText: string,
  isOpen: boolean,
  openGroups: $ReadOnlySet<string>,
  menuTop: number | void,
  menuWidth: string | number | void,
  searchText: string,
  searchResults: GraphSearchResults<string, T>,
  selectedOptionValues: $ReadOnlyArray<T>,
};

function _calculateMenuOffset(
  dropdownElt: HTMLDivElement,
  menuElt: HTMLDivElement,
  propsMenuWidth: string | number | void,
): { menuTop?: number, menuWidth?: string | number } {
  const newMenuState = { menuTop: undefined, menuWidth: propsMenuWidth };

  // If the offset parent of the dropdown is scrollable, there is nothing to do.
  // This is because any overflow that occurs because of the dropdown extending
  // too far past the bottom of the screen will be fixed because the offset
  // parent is scrollable.
  // NOTE(stephen): `getComputedStyle` is not very performant. If this function
  // gets called more frequently and there is a notable performance issue,
  // memoize this or change how we detect scrollability of the parent.
  const { getComputedStyle } = dropdownElt.ownerDocument.defaultView;
  const { overflowY } = getComputedStyle(dropdownElt.offsetParent);
  if (!(overflowY === 'scroll' || overflowY === 'auto')) {
    // If the offset parent is *not* scrollable, then if this element extends
    // past the bottom of the screen, some elements will be out of view.
    const MARGIN_BOTTOM = 4;
    const { height, top } = menuElt.getBoundingClientRect();
    const windowHeight = window.innerHeight - MARGIN_BOTTOM;
    if (height > windowHeight - top && height < windowHeight) {
      newMenuState.menuTop = -(height + MARGIN_BOTTOM);
    }
  }

  // If menuWidth is not set in props, then check if this element extends past
  // the right of the screen as some elements would be out of view.
  if (!propsMenuWidth) {
    const MARGIN_RIGHT = 4;
    const { left, width } = menuElt.getBoundingClientRect();
    const windowWidth = window.innerWidth - MARGIN_RIGHT;
    newMenuState.menuWidth =
      width >= windowWidth - left ? windowWidth - left : propsMenuWidth;
  }

  return newMenuState;
}

function _getInitialSelectedOptionValues<T>(
  props: Props<T>,
): $ReadOnlyArray<T> {
  if (props.isControlled) {
    // we never use this value if component is controlled, so just initialize
    // to an empty array
    return [];
  }

  if (props.isMultiselect) {
    return props.initialValue;
  }

  return props.initialValue === undefined ? [] : [props.initialValue];
}

export default class BaseDropdown<T> extends React.PureComponent<
  Props<T>,
  State<T>,
> {
  static defaultProps = {
    buttonClassName: '',
    buttonMinWidth: undefined,
    buttonIntent: INTENTS.DEFAULT,
    buttonWidth: undefined,
    caretType: Caret.Types.TRIANGLE,
    children: null,
    className: '',
    controlDropDownPosition: true,
    dataContent: undefined,
    debounceSearch: false,
    defaultDisplayContent: null,
    disableSelect: false,
    displayCurrentSelection: true,
    emptyOptionsGroupContent: TEXT.emptyGroup,
    enableSearch: false,
    enableSelectAll: false,
    expandSearchResults: true,
    hideCaret: false,
    marginPerLevel: '1.25em',
    menuAlignment: ALIGNMENTS.LEFT,
    menuMaxHeight: undefined,
    menuMinWidth: undefined,
    menuWidth: undefined,
    multiselectSelectionLabel: TEXT.selected,
    noOptionsContent: TEXT.noOptions,
    noAsyncSearchContent: TEXT.noSearch,
    onAsyncSearch: undefined,
    onOpenDropdownClick: undefined,
    onSelectionChange: undefined,
    renderButtonLabel: undefined,
    searchDebounceTimeoutMs: 300,
    searchInputPlaceholder: TEXT.searchPlaceholder,
    selectedOptions: [],
    valueStyle: undefined,
  };

  _asyncSearchTimer: TimeoutID | void = undefined;
  _menuRef: $RefObject<'div'> = React.createRef();
  _dropdownRef: $RefObject<'div'> = React.createRef();
  _searchInputRef: $RefObject<
    typeof InputText.Uncontrolled,
  > = React.createRef();

  state: State<T> = {
    asyncSearchLoading: false,
    asyncSearchText: '',
    isOpen: false,
    openGroups: new Set(),
    menuTop: undefined,
    menuWidth: this.props.menuWidth,
    searchText: '',
    searchResults: new GraphSearchResults(),
    selectedOptionValues: _getInitialSelectedOptionValues(this.props),
  };

  componentDidUpdate(prevProps: Props<T>, prevState: State<T>) {
    this.maybeControlDropdownPosition(prevState);

    if (this.props.children !== prevProps.children) {
      this.onReceiveNewOptions();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.hideDropdown);
    if (this._asyncSearchTimer) {
      clearTimeout(this._asyncSearchTimer);
    }
  }

  maybeControlDropdownPosition(prevState: State<T>) {
    // This is behaviour is good for most of our dropdowns but not all
    // hence you can turn it off by passing controlDropDownPosition prop as
    // false
    if (!this.props.controlDropDownPosition) {
      // do nothing if we don't need to control the dropdown position
      return;
    }

    // Determine if the dropdown contents will overflow the window. If they
    // will, make the dropdown menu to open upwards.
    const { isOpen, openGroups } = this.state;
    if (isOpen && (!prevState.isOpen || prevState.openGroups !== openGroups)) {
      const menuElt = this._menuRef.current;
      const dropdownElt = this._dropdownRef.current;
      if (!menuElt || !dropdownElt) {
        return;
      }
      const menuState = _calculateMenuOffset(
        dropdownElt,
        menuElt,
        this.props.menuWidth,
      );
      this.setState(menuState);
    }
  }

  @memoizeOne
  _areAllChildrenSelectedHelper(
    selectedValues: $ReadOnlyArray<T>,
    children: React.ChildrenArray<?DropdownChildType<T>>,
  ): boolean {
    return (
      selectedValues.length === this.getOptionChildrenValues(children).length
    );
  }

  // Checks if all children options (including those in OptionsGroups)
  // are selected.
  areAllChildrenSelected(): boolean {
    return this._areAllChildrenSelectedHelper(
      this.getSelectedValues(),
      this.props.children,
    );
  }

  // Returns a flattened array of all children options by recursively
  // iterating through OptionsGroups.
  @memoizeOne
  getOptionChildrenValues(
    children: React.ChildrenArray<?DropdownChildType<T>>,
  ): Array<T> {
    const childrenValues = [];
    GraphIterator.create(children, new DropdownGraphNodeView()).forEach(
      child => {
        if (child) {
          if (child.type === Option) {
            const opt: React.Element<Class<Option<T>>> = (child: $Cast);
            childrenValues.push(opt.props.value);
          } else {
            const optGroup: React.Element<
              Class<OptionsGroup<T>>,
            > = (child: $Cast);
            childrenValues.concat(
              this.getOptionChildrenValues(optGroup.props.children),
            );
          }
        }
      },
    );
    return childrenValues;
  }

  isOptionsGroupOpen(groupVal: string): boolean {
    return this.state.openGroups.has(groupVal);
  }

  showDropdown(): void {
    this.setState({ isOpen: true }, () => {
      if (this.props.enableSearch && this._searchInputRef.current) {
        this._searchInputRef.current.focus();
      }
    });
    document.addEventListener('click', this.hideDropdown);
  }

  @autobind
  hideDropdown(): void {
    this.setState({ isOpen: false, menuTop: undefined });
    document.removeEventListener('click', this.hideDropdown);
  }

  getSingleValue(): T | void {
    invariant(
      !this.props.isMultiselect,
      '[BaseDropdown] `getSingleValue` is only for single-select dropdowns',
    );

    return this.props.isControlled
      ? this.props.value
      : this.state.selectedOptionValues[0];
  }

  getMultipleValues(): $ReadOnlyArray<T> {
    invariant(
      this.props.isMultiselect,
      '[BaseDropdown] `getMultipleValues` is only for Multiselect dropdowns',
    );

    return this.props.isControlled
      ? this.props.value
      : this.state.selectedOptionValues;
  }

  /**
   * Get all selected values as an array, regardless of whether this is a
   * single-select or a multiselect dropdown.
   */
  getSelectedValues(): $ReadOnlyArray<T> {
    if (this.props.isMultiselect) {
      return this.getMultipleValues();
    }
    const val = this.getSingleValue();
    return val !== undefined ? [val] : [];
  }

  getMenuStyle(): StyleObject {
    const { menuAlignment, menuMaxHeight, menuMinWidth } = this.props;
    const { menuTop, menuWidth } = this.state;
    return {
      left: menuAlignment === ALIGNMENTS.LEFT ? 0 : 'auto',
      right: menuAlignment === ALIGNMENTS.LEFT ? 'auto' : 0,
      width: menuWidth,
      minWidth: menuMinWidth,
      maxHeight: menuMaxHeight,
      top: menuTop,
    };
  }

  /**
   * Get the CSS styles for the main wrapper div
   */
  getMainDivStyle(): StyleObject {
    const { buttonWidth, buttonMinWidth } = this.props;

    // the button widths should get set to the main div, because other widths
    // (e.g. if the menu widths are specified as percentages) should be
    // calculated based off of this
    return {
      width: buttonWidth,
      minWidth: buttonMinWidth,
    };
  }

  getButtonLabel(): React.Node {
    const {
      children,
      defaultDisplayContent,
      displayCurrentSelection,
    } = this.props;

    const selectedValues = this.getSelectedValues();
    const count = selectedValues.length;

    if (!displayCurrentSelection || count === 0) {
      return defaultDisplayContent;
    }

    if (this.props.isMultiselect) {
      const { renderButtonLabel, multiselectSelectionLabel } = this.props;
      if (renderButtonLabel) {
        return renderButtonLabel(selectedValues);
      }
      if (count > 1 && multiselectSelectionLabel) {
        return `${count} ${multiselectSelectionLabel}`;
      }
    }

    if (count === 1) {
      const selectedValue = selectedValues[0];

      if (!this.props.isMultiselect && this.props.renderButtonLabel) {
        return this.props.renderButtonLabel(selectedValue);
      }

      // search for an Option that matches this selectedValue. Ignore any
      // OptionsGroup elements.
      const option = GraphIterator.create(
        children,
        new DropdownGraphNodeView(),
      ).findAny(child => {
        if (!!child && child.type === Option) {
          const opt: React.Element<Class<Option<T>>> = (child: $Cast);
          return opt.props.value === selectedValue;
        }
        return false;
      });

      // if no Option was found
      if (option === undefined || (option && option.type !== Option)) {
        return defaultDisplayContent;
      }
      const castOpt: React.Element<Class<Option<T>>> = (option: $Cast);
      return castOpt.props.children;
    }
    throw new Error(
      '[BaseDropdown] Invalid combination of `isMultiselect` and number of selected values',
    );
  }

  updateSearchResults(searchText: string): void {
    this.setState((prevState: State<T>, props: Props<T>) => {
      const { children, expandSearchResults } = props;
      const { openGroups } = prevState;
      const searchResults = GraphSearchResults.fromSearchText(
        new DropdownGraphNodeView(),
        searchText,
        children,
      );

      let newOpenGroups = openGroups;
      if (searchText === '') {
        // if searchText has changed and it is now empty, then we reset
        // the dropdown to have no open groups
        newOpenGroups = new Set();
      } else if (expandSearchResults) {
        // if the expandSearchResults prop is set, then the open groups
        // should be the same as the groups that passed the search
        newOpenGroups = searchResults.getAllParents();
      }
      return {
        searchText,
        searchResults,
        openGroups: newOpenGroups,
      };
    });
  }

  @autobind
  onMenuToggle() {
    if (this.state.isOpen) {
      this.hideDropdown();
    } else {
      if (this.props.onOpenDropdownClick) {
        this.props.onOpenDropdownClick();
      }
      this.showDropdown();
    }
  }

  @autobind
  onReceiveNewOptions() {
    this.updateSearchResults('');
    this.setState({ asyncSearchLoading: false });
  }

  @autobind
  onSearchTextChange(searchText: string) {
    const { onAsyncSearch } = this.props;
    if (onAsyncSearch) {
      this.setState({ asyncSearchLoading: true });
      clearTimeout(this._asyncSearchTimer);
      this._asyncSearchTimer = setTimeout(() => {
        onAsyncSearch(searchText, () =>
          this.setState({
            asyncSearchText: searchText,
          }),
        );
      }, ASYNC_SEARCH_DELAY);
    } else {
      this.updateSearchResults(searchText);
    }
  }

  /**
   * Event handler for when an option is selected. If an option category is
   * clicked (i.e. an OptionsGroup node), then the `onOptionsGroupClick` event
   * handler is the one that's called instead of this one.
   */
  @autobind
  onSingleOptionClick(optionValue: T, event: SyntheticEvent<HTMLElement>) {
    stopDropdownClickEvent(event);
    const { children } = this.props;

    // When multiselect is disabled, we can replace the currently selected
    // option with the new option.
    if (!this.props.isMultiselect) {
      this.onSelectionChange([optionValue], event);
      return;
    }

    const { enableSelectAll } = this.props;
    const selectedValues = this.getSelectedValues();

    // If enableSelectAll is true and it was clicked on, check whether it was
    // selected before or not.
    if (
      enableSelectAll &&
      typeof optionValue === 'string' &&
      // $FlowSuppressError
      optionValue === '__selectAll__'
    ) {
      if (this.areAllChildrenSelected()) {
        this.onSelectionChange([], event);
      } else {
        this.onSelectionChange(this.getOptionChildrenValues(children), event);
      }
      return;
    }

    // If multiselect is enabled, we need to test if the clicked option was
    // already selected previously. If it was, remove it from the selected
    // options. Otherwise, add it.
    const alreadySelected = selectedValues.includes(optionValue);
    if (alreadySelected) {
      this.onSelectionChange(
        selectedValues.filter(v => v !== optionValue),
        event,
      );
    } else {
      this.onSelectionChange(selectedValues.concat(optionValue), event);
    }
  }

  onSelectionChange(
    selectedOptionValues: $ReadOnlyArray<T>,
    event: SyntheticEvent<HTMLElement>,
  ) {
    const { disableSelect } = this.props;
    if (disableSelect) {
      return;
    }

    // uncontrolled component has to update internal state
    if (!this.props.isControlled) {
      this.setState({ selectedOptionValues });
    }

    if (this.props.isMultiselect && this.props.onSelectionChange) {
      this.props.onSelectionChange(selectedOptionValues, event);
    } else if (!this.props.isMultiselect && this.props.onSelectionChange) {
      const value = selectedOptionValues[0];
      invariant(
        value !== undefined,
        '[BaseDropdown] `value` cannot be undefined when calling `onSelectionChange`',
      );
      this.props.onSelectionChange(value, event);
    }

    // When changing options inside a multiselect dropdown, it is useful to keep
    // the dropdown open so the user can select multiple elements quickly.
    if (!this.props.isMultiselect) {
      this.hideDropdown();
    }
  }

  @autobind
  onOptionsGroupClick(groupVal: string, event: SyntheticEvent<HTMLDivElement>) {
    stopDropdownClickEvent(event);

    // update the open options groups
    this.setState((prevState: State<T>) => {
      const { openGroups } = prevState;
      const currGroupsArr = [...openGroups];

      if (this.isOptionsGroupOpen(groupVal)) {
        // remove the current group
        return {
          openGroups: new Set(currGroupsArr.filter(val => groupVal !== val)),
        };
      }

      // add the clicked group to the openGroups set
      return {
        openGroups: new Set(currGroupsArr.concat(groupVal)),
      };
    });
  }

  maybeRenderSearchBar() {
    const {
      debounceSearch,
      enableSearch,
      searchInputPlaceholder,
      searchDebounceTimeoutMs,
    } = this.props;
    if (enableSearch) {
      return (
        <DropdownSearchBar
          debounce={debounceSearch}
          debounceTimeoutMs={searchDebounceTimeoutMs}
          onChange={this.onSearchTextChange}
          searchInputPlaceholder={searchInputPlaceholder}
          inputRef={this._searchInputRef}
        />
      );
    }
    return null;
  }

  renderButton() {
    const {
      buttonClassName,
      hideCaret,
      caretType,
      buttonMinWidth,
      buttonIntent,
      buttonWidth,
      disableSelect,
      dataContent,
      valueStyle,
    } = this.props;

    return (
      <DropdownButton
        buttonMinWidth={buttonMinWidth}
        buttonIntent={buttonIntent}
        buttonWidth={buttonWidth}
        className={buttonClassName}
        disabled={disableSelect}
        hideCaret={hideCaret}
        caretType={caretType}
        onButtonClick={this.onMenuToggle}
        dataContent={dataContent}
        valueStyle={valueStyle}
      >
        {this.getButtonLabel()}
      </DropdownButton>
    );
  }

  renderDropdownOptionsList() {
    const {
      children,
      displayCurrentSelection,
      emptyOptionsGroupContent,
      enableSearch,
      marginPerLevel,
      onAsyncSearch,
      noOptionsContent,
      noAsyncSearchContent,
    } = this.props;
    const {
      asyncSearchLoading,
      asyncSearchText,
      openGroups,
      searchText,
      searchResults,
    } = this.state;

    if (asyncSearchLoading) {
      return <LoadingSpinner />;
    }

    const selectedValues = this.getSelectedValues();

    const noOptionsContentDisplayed =
      enableSearch && onAsyncSearch && asyncSearchText === ''
        ? noAsyncSearchContent
        : noOptionsContent;

    const enableSelectAll = this.props.isMultiselect
      ? this.props.enableSelectAll
      : undefined;
    const selectedOptions = this.props.isMultiselect
      ? this.props.selectedOptions
      : undefined;

    return (
      <DropdownOptionsList
        allChildrenSelected={this.areAllChildrenSelected()}
        displayCurrentSelection={displayCurrentSelection}
        emptyOptionsGroupContent={emptyOptionsGroupContent}
        marginPerLevel={marginPerLevel}
        noOptionsContent={noOptionsContentDisplayed}
        openGroups={openGroups}
        onOptionClick={this.onSingleOptionClick}
        onOptionsGroupClick={this.onOptionsGroupClick}
        selectedValues={selectedValues}
        searchText={searchText}
        useSearch={enableSearch}
        searchResults={searchResults}
        multiselect={this.props.isMultiselect}
        enableSelectAll={enableSelectAll}
        selectedOptions={selectedOptions}
      >
        {children}
      </DropdownOptionsList>
    );
  }

  renderMenu() {
    const className = classNames('zen-dropdown__menu', {
      'zen-dropdown__menu--open': this.state.isOpen,
      'zen-dropdown__menu--wrap-words': !!this.state.menuWidth,
    });
    return (
      <div
        className={className}
        style={this.getMenuStyle()}
        ref={this._menuRef}
      >
        {this.maybeRenderSearchBar()}
        {this.renderDropdownOptionsList()}
      </div>
    );
  }

  render() {
    const { className } = this.props;
    const dropdownClassName = classNames('zen-dropdown', className, {
      'zen-dropdown--open': this.state.isOpen,
    });

    return (
      <div
        ref={this._dropdownRef}
        className={dropdownClassName}
        style={this.getMainDivStyle()}
      >
        {this.renderButton()}
        {this.renderMenu()}
      </div>
    );
  }
}
