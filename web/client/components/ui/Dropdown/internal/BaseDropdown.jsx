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
import Popover from 'components/ui/Popover';
import Spacing from 'components/ui/Spacing';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { stopDropdownClickEvent } from 'components/ui/Dropdown/util';
import type { CaretType } from 'components/ui/Caret';
import type { Intent } from 'components/ui/Dropdown/internal/DropdownButton';
import type { StyleObject } from 'types/jsCore';

const TEXT = t('ui.Dropdown');

// The time (in ms) that that the search text has to not change before a
// search request is made.
const ASYNC_SEARCH_DELAY = 2000;

export type DropdownChildType<T> =
  | React.Element<Class<Option<T>>>
  | React.Element<Class<OptionsGroup<T>>>;

type Alignment = 'left' | 'right';

type IntentsMap = {
  DEFAULT: 'default',
  PLAIN: 'plain',
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
  PLAIN: 'plain',
  PRIMARY: 'primary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
};

type SingleSelectControlledRequiredProps<T> = {
  isControlled: true,
  isMultiselect: false,
  value: void | T,
  onSelectionChange: (
    selectedValue: T,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  // function to call to determine what to display on the button
  renderButtonLabel?: (selectedValue: T) => React.Node,
};

type SingleSelectUncontrolledRequiredProps<T> = {
  isControlled: false,
  isMultiselect: false,
  initialValue: void | T,
  onSelectionChange?: (
    selectedValue: T,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  // function to call to determine what to display on the button
  renderButtonLabel?: (selectedValue: T) => React.Node,
};

type MultiselectControlledRequiredProps<T> = {
  isControlled: true,
  isMultiselect: true,
  value: $ReadOnlyArray<T>,
  onSelectionChange: (
    selectedValues: $ReadOnlyArray<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  // function to call to determine what to display on the button
  renderButtonLabel?: (selectedValues: $ReadOnlyArray<T>) => React.Node,
};

type MultiselectUncontrolledRequiredProps<T> = {
  isControlled: false,
  isMultiselect: true,
  initialValue: $ReadOnlyArray<T>,
  onSelectionChange?: (
    selectedValues: $ReadOnlyArray<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  // function to call to determine what to display on the button
  renderButtonLabel?: (selectedValues: $ReadOnlyArray<T>) => React.Node,
};

type DefaultProps<T> = {
  ariaName?: string,
  asyncSelectedOptions?: $ReadOnlyArray<React.Element<Class<Option<T>>>>,
  blurType?: 'overlay' | 'document',
  buttonClassName: string,
  buttonMinWidth?: number,
  buttonIntent: Intent,
  buttonWidth?: string | number,
  caretType: CaretType,
  children: React.ChildrenArray<
    ?React.Element<Class<Option<T>>> | ?React.Element<Class<OptionsGroup<T>>>,
  >,
  className: string,

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

  // Option to select all of the options in the dropdown
  enableSelectAll: boolean,
  hideCaret: boolean,
  isSameValue: (valA: T, valB: T) => boolean,

  // The margin-left to add at each level of the dropdown hierarchy. If we're
  // using OptionGroups,  this is useful so that each level can be indented.
  // The margin must be in 'em' or 'px'
  marginPerLevel: string,
  menuAlignment: Alignment,
  menuClassName: string,
  menuMaxHeight?: number,
  menuMaxWidth?: string | number,
  menuMinWidth?: string | number,
  menuWidth?: string | number,
  multiselectSelectionLabel: string,

  // dropdown contents to show when there are no options
  noOptionsContent: React.Node,
  noAsyncSearchContent: React.Node,
  onAsyncSearch?: (searchText: string, callback: () => void) => void,
  onDropdownClose?: () => void,
  onOpenDropdownClick?: () => void,

  // Optionally surface a loading spinner to indicate the dropdown options are
  // loading.
  optionsLoading: boolean,

  /**
   * If set to true then the selected options will be pinned at the top of the
   * dropdown. The pinned items are updated when the dropdown is closed and
   * reopened. This only works for dropdowns with a flat array of options (no
   * options groups)
   */
  pinSelectedOptions: boolean,
  searchDebounceTimeoutMs: number,
  searchInputPlaceholder: string,
  showButtonContentsOnHover: boolean,
  valueStyle?: StyleObject,
  testId: string,

  /**
   * An object mapping window edges to their thresholds, meaning how close
   * the dropdown is allowed to get to a window edge before adjusting its
   * position.
   */
  windowEdgeThresholds?: {
    bottom?: number,
    left?: number,
    right?: number,
    top?: number,
  },
};

type Props<T> =
  | { ...DefaultProps<T>, ...SingleSelectControlledRequiredProps<T> }
  | { ...DefaultProps<T>, ...SingleSelectUncontrolledRequiredProps<T> }
  | { ...DefaultProps<T>, ...MultiselectControlledRequiredProps<T> }
  | { ...DefaultProps<T>, ...MultiselectUncontrolledRequiredProps<T> };

type State<T> = {
  asyncSearchLoading: boolean,
  asyncSearchText: string,
  dropdownButtonElt: HTMLButtonElement | void,
  dropdownButtonWidth: number,
  isOpen: boolean,
  openGroups: $ReadOnlySet<string>,
  menuWidth: string | number | void,

  /**
   * This is used to pin selected options to the top of the dropdown when the
   * pinSelectedOptions prop is enabled. The difference between this and
   * selectedOptionValues is that pinnedValues is only updated when the dropdown
   * is closed and re-opened so as not to re-order the options when the user is
   * still interacting with the dropdown menu.
   */
  pinnedValues: $ReadOnlyArray<T>,
  searchText: string,
  searchResults: GraphSearchResults<string, T>,
  selectedOptionValues: $ReadOnlyArray<T>,
};

// check if a css dimension (e.g. '10px', '50%'), is a percentage
function isPercentageStr(dimensionStr: string | number | void): boolean {
  if (typeof dimensionStr === 'string') {
    return dimensionStr.charAt(dimensionStr.length - 1) === '%';
  }
  return false;
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


// TODO(david): Currently all versions of the dropdown (multiselect/singleselect
// and controlled/uncontrolled) use this BaseDropdown component. This leads this
// to be quite complex as it contains the superset of functionalities of each
// type of dropdown. When we convert the Dropdown to a function component, we
// should change how this works. We could have separate, simpler, controlled
// multiselect and singleselect dropdown components. We would handle shared
// logic and UI through shared sub-components and custom hooks (e.g. a
// useDropdownSearch hook). Uncontrolled versions could simply be a thin wrapper
// around the controlled components like we have for the Tabs component.
// TODO(david): We should add UI tests before doing a big refactor of a complex
// component like this.
export default class BaseDropdown<T> extends React.PureComponent<
  Props<T>,
  State<T>,
> {
  static defaultProps: DefaultProps<T> = {
    ariaName: undefined,
    asyncSelectedOptions: undefined,
    blurType: 'document',
    buttonClassName: '',
    buttonMinWidth: undefined,
    buttonIntent: INTENTS.DEFAULT,
    buttonWidth: undefined,
    caretType: Caret.Types.TRIANGLE,
    children: null,
    className: '',
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
    isSameValue: (valA: mixed, valB: mixed) => valA === valB,
    marginPerLevel: '1.25em',
    menuAlignment: ALIGNMENTS.LEFT,
    menuClassName: '',
    menuMaxHeight: undefined,
    menuMaxWidth: undefined,
    menuMinWidth: undefined,
    menuWidth: undefined,
    multiselectSelectionLabel: TEXT.selected,
    noOptionsContent: TEXT.noOptions,
    noAsyncSearchContent: TEXT.noSearch,
    onAsyncSearch: undefined,
    onDropdownClose: undefined,
    onOpenDropdownClick: undefined,
    optionsLoading: false,
    pinSelectedOptions: false,
    searchDebounceTimeoutMs: 300,
    searchInputPlaceholder: TEXT.searchPlaceholder,
    showButtonContentsOnHover: false,
    valueStyle: undefined,
    windowEdgeThresholds: undefined,
    testId: '',
  };

  _asyncSearchTimer: TimeoutID | void = undefined;
  _menuRef: $ElementRefObject<'div'> = React.createRef();
  _dropdownRef: $ElementRefObject<'div'> = React.createRef();
  _searchInputRef: $ElementRefObject<
    typeof InputText.Uncontrolled,
  > = React.createRef();

  state: State<T> = {
    asyncSearchLoading: false,
    asyncSearchText: '',
    dropdownButtonElt: undefined,
    dropdownButtonWidth: 0,
    isOpen: false,
    openGroups: new Set(),
    menuWidth: this.props.menuWidth,
    pinnedValues: _getInitialSelectedOptionValues(this.props),
    searchText: '',
    searchResults: new GraphSearchResults(),
    selectedOptionValues: _getInitialSelectedOptionValues(this.props),
  };

  componentDidUpdate(prevProps: Props<T>) {
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

  @memoizeOne
  _areAllChildrenSelectedHelper(
    selectedValues: $ReadOnlyArray<T>,
    children: React.ChildrenArray<?DropdownChildType<T>>,
  ): boolean {
    return (
      selectedValues.length ===
      this.getSelectableOptionChildrenValues(children).length
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

  // Returns a flattened array of all children options that have not
  // been marked as unselectable by recursively iterating through OptionsGroups.
  @memoizeOne
  getSelectableOptionChildrenValues(
    children: React.ChildrenArray<?DropdownChildType<T>>,
  ): Array<T> {
    const childrenValues = [];
    GraphIterator.create(children, new DropdownGraphNodeView()).forEach(
      child => {
        if (child) {
          if (child.type === Option) {
            const opt: React.Element<Class<Option<T>>> = (child: $Cast);
            if (!opt.props.unselectable) {
              childrenValues.push(opt.props.value);
            }
          } else {
            const optGroup: React.Element<
              Class<OptionsGroup<T>>,
            > = (child: $Cast);
            childrenValues.concat(
              this.getSelectableOptionChildrenValues(optGroup.props.children),
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
    const { onAsyncSearch } = this.props;
    this.setState({
      isOpen: true,
      pinnedValues: this.getSelectedValues(),
      searchText: '',
    });

    if (onAsyncSearch) {
      onAsyncSearch('', () => this.setState({ asyncSearchText: '' }));
    }
  }

  @autobind
  hideDropdown(): void {
    const { onDropdownClose } = this.props;
    this.setState({ isOpen: false });
    if (onDropdownClose !== undefined) {
      onDropdownClose();
    }
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
    const { menuMaxHeight, menuMinWidth, menuMaxWidth } = this.props;
    const { dropdownButtonWidth, menuWidth } = this.state;

    // if the menu widths are percentages, they should be calculated as a
    // percentage of the button width
    const width = isPercentageStr(menuWidth)
      ? (parseInt(menuWidth, 10) * dropdownButtonWidth) / 100
      : menuMinWidth;
    const minWidth = isPercentageStr(menuMinWidth)
      ? (parseInt(menuMinWidth, 10) * dropdownButtonWidth) / 100
      : menuMinWidth;
    const maxWidth = isPercentageStr(menuMaxWidth)
      ? (parseInt(menuMaxWidth, 10) * dropdownButtonWidth) / 100
      : menuMaxWidth;
    return {
      width,
      minWidth,
      maxWidth,
      maxHeight: menuMaxHeight,
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
      isSameValue,
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
      if (count > 1) {
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
      let option = GraphIterator.create(
        children,
        new DropdownGraphNodeView(),
      ).findAny(child => {
        if (!!child && child.type === Option) {
          const opt: React.Element<Class<Option<T>>> = (child: $Cast);
          return isSameValue(opt.props.value, selectedValue);
        }
        return false;
      });

      // search for a selectedOption that matches the selectedValue if no
      // option was found. Used for async dropdowns when not all options are
      // loaded.
      if (
        this.props.isMultiselect &&
        (option === undefined || (option && option.type !== Option))
      ) {
        if (this.props.onAsyncSearch) {
          invariant(
            this.props.asyncSelectedOptions,
            'When using an async search dropdown, the asyncSelectedOptions prop must be provided',
          );
        }

        option = GraphIterator.create(
          this.props.asyncSelectedOptions,
          new DropdownGraphNodeView(),
        ).findAny(child => {
          if (!!child && child.type === Option) {
            const opt: React.Element<Class<Option<T>>> = (child: $Cast);
            return isSameValue(opt.props.value, selectedValue);
          }
          return false;
        });
      }

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

  @autobind
  findMatchingSelectedValue(value: T): [boolean, T | void] {
    const selectedValues = this.getSelectedValues();
    return this.findMatchingValue(value, selectedValues);
  }

  findMatchingPinnedValue(value: T): [boolean, T | void] {
    const { pinnedValues } = this.state;
    return this.findMatchingValue(value, pinnedValues);
  }

  /**
   * Given a value, find a matching value from an array if one exists. This uses
   * the isSameValue prop for the equality check. Used in case we end up in a
   * state (e.g. after a page reload) where we are handling different copies of
   * the same value. We return a tuple of [foundMatchingValue, matchingValue]
   * to account for the case where undefined is a valid selectedValue.
   */
  findMatchingValue(
    value: T,
    valuesToMatch: $ReadOnlyArray<T>,
  ): [boolean, T | void] {
    const { isSameValue } = this.props;

    // eslint-disable-next-line no-restricted-syntax
    for (const valueToMatch of valuesToMatch) {
      if (isSameValue(valueToMatch, value)) {
        return [true, valueToMatch];
      }
    }
    return [false, undefined];
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

  // callback for when the popover is ready to have its DOM accessed
  @autobind
  onPopoverOpened() {
    if (this.props.enableSearch && this._searchInputRef.current) {
      this._searchInputRef.current.focus();
    }
  }

  @autobind
  onMenuToggle(event: SyntheticEvent<HTMLButtonElement>) {
    // the button just got clicked, so let's first set the button-related
    // information for the popover:
    const buttonElt = event.currentTarget;
    this.setState({
      dropdownButtonElt: buttonElt,
      dropdownButtonWidth: buttonElt.offsetWidth,
    });

    // now let's handle opening/closing the menu
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
      optionValue === '__selectAll__'
    ) {
      if (this.areAllChildrenSelected()) {
        this.onSelectionChange([], event);
      } else {
        this.onSelectionChange(
          this.getSelectableOptionChildrenValues(children),
          event,
        );
      }
      return;
    }

    // If multiselect is enabled, we need to test if the clicked option was
    // already selected previously. If it was, remove it from the selected
    // options. Otherwise, add it.
    const [foundMatchingValue, matchingValue] = this.findMatchingSelectedValue(
      optionValue,
    );
    if (foundMatchingValue) {
      this.onSelectionChange(
        selectedValues.filter(v => v !== matchingValue),
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

  maybeRenderSearchBar(): React.Node {
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

  maybeRenderMenu(): React.Node {
    const { isOpen, menuWidth, dropdownButtonElt } = this.state;
    const {
      menuAlignment,
      menuClassName,
      windowEdgeThresholds,
      blurType,
    } = this.props;
    const className = classNames('zen-dropdown__menu', menuClassName, {
      'zen-dropdown__menu--wrap-words': !!menuWidth,
    });

    const anchorOrigin =
      menuAlignment === ALIGNMENTS.LEFT
        ? Popover.Origins.BOTTOM_LEFT
        : Popover.Origins.BOTTOM_RIGHT;
    const popoverOrigin =
      menuAlignment === ALIGNMENTS.LEFT
        ? Popover.Origins.TOP_LEFT
        : Popover.Origins.TOP_RIGHT;

    if (isOpen) {
      return (
        <Popover
          anchorElt={dropdownButtonElt}
          anchorOrigin={anchorOrigin}
          popoverOrigin={popoverOrigin}
          onRequestClose={this.hideDropdown}
          isOpen={isOpen}
          containerType={Popover.Containers.NONE}
          anchorOuterSpacing={3}
          onPopoverOpened={this.onPopoverOpened}
          windowEdgeThresholds={windowEdgeThresholds}
          blurType={blurType}
        >
          <div
            className={className}
            style={this.getMenuStyle()}
            ref={this._menuRef}
          >
            {this.maybeRenderSearchBar()}
            {this.renderDropdownOptionsList()}
          </div>
        </Popover>
      );
    }
    return null;
  }

  renderButton(): React.Node {
    const {
      ariaName,
      buttonClassName,
      hideCaret,
      caretType,
      buttonIntent,
      disableSelect,
      dataContent,
      valueStyle,
      showButtonContentsOnHover,
      testId,
    } = this.props;

    return (
      <DropdownButton
        ariaName={ariaName}
        buttonIntent={buttonIntent}
        className={buttonClassName}
        disabled={disableSelect}
        hideCaret={hideCaret}
        caretType={caretType}
        onButtonClick={this.onMenuToggle}
        dataContent={dataContent}
        valueStyle={valueStyle}
        showContentsOnHover={showButtonContentsOnHover}
        testId={testId}
      >
        {this.getButtonLabel()}
      </DropdownButton>
    );
  }

  renderDropdownOptionsList(): React.Node {
    const {
      asyncSelectedOptions,
      children,
      displayCurrentSelection,
      emptyOptionsGroupContent,
      enableSearch,
      marginPerLevel,
      onAsyncSearch,
      noOptionsContent,
      noAsyncSearchContent,
      optionsLoading,
    } = this.props;
    const {
      asyncSearchLoading,
      asyncSearchText,
      openGroups,
      searchText,
      searchResults,
    } = this.state;

    if (asyncSearchLoading || optionsLoading) {
      return (
        <Spacing padding="xs" flex justifyContent="center">
          <LoadingSpinner />
        </Spacing>
      );
    }

    if (onAsyncSearch) {
      invariant(
        this.props.asyncSelectedOptions,
        'When using an async search dropdown, the asyncSelectedOptions prop must be provided',
      );
    }

    const shouldRenderSelectedOptions = onAsyncSearch && asyncSearchText === '';

    const optionsToRender = shouldRenderSelectedOptions
      ? asyncSelectedOptions
      : children;

    const preOptionsContent =
      shouldRenderSelectedOptions &&
      asyncSelectedOptions &&
      asyncSelectedOptions.length > 0
        ? TEXT.asyncNoSearchTerm
        : null;

    const selectableOptions = this.getSelectableOptionChildrenValues(
      optionsToRender,
    );

    const selectedOptionValues = selectableOptions.filter(value => {
      const [isValueSelected] = this.findMatchingSelectedValue(value);
      return isValueSelected;
    });

    const pinnedOptionValues = this.props.pinSelectedOptions
      ? selectableOptions.filter(value => {
          const [isValuePinned] = this.findMatchingPinnedValue(value);
          return isValuePinned;
        })
      : [];

    const noOptionsContentDisplayed =
      enableSearch && onAsyncSearch && asyncSearchText === ''
        ? noAsyncSearchContent
        : noOptionsContent;

    const enableSelectAll = this.props.isMultiselect
      ? this.props.enableSelectAll
      : undefined;

    return (
      <DropdownOptionsList
        allChildrenSelected={this.areAllChildrenSelected()}
        displayCurrentSelection={displayCurrentSelection}
        emptyOptionsGroupContent={emptyOptionsGroupContent}
        preOptionsContent={preOptionsContent}
        marginPerLevel={marginPerLevel}
        noOptionsContent={noOptionsContentDisplayed}
        openGroups={openGroups}
        onOptionClick={this.onSingleOptionClick}
        onOptionsGroupClick={this.onOptionsGroupClick}
        pinnedValues={pinnedOptionValues}
        selectedValues={selectedOptionValues}
        searchText={searchText}
        useSearch={enableSearch}
        searchResults={searchResults}
        multiselect={this.props.isMultiselect}
        enableSelectAll={enableSelectAll}
      >
        {optionsToRender}
      </DropdownOptionsList>
    );
  }

  render(): React.Element<'div'> {
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
        {this.maybeRenderMenu()}
      </div>
    );
  }
}
