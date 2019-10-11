// @flow
import * as React from 'react';

import BaseDropdown from 'components/ui/Dropdown/internal/BaseDropdown';
import Caret from 'components/ui/Caret';
import Option from 'components/ui/Dropdown/Option';
import OptionsGroup from 'components/ui/Dropdown/OptionsGroup';
import type { CaretType } from 'components/ui/Caret';
import type { StyleObject } from 'types/jsCore';

const TEXT = t('ui.Dropdown');

type MultiselectControlledProps<T> = {|
  /**
   * **Multiselect prop:** determines if `selectAll` option should be displayed.
   */
  enableSelectAll: boolean,

  /**
   * **Required for an ucontrolled Dropdown.** An array of selected values. The
   * array is empty if there is no selection.
   */
  initialValue: $ReadOnlyArray<T>,

  /**
   * **Multiselect prop:** the label to show when multiple options are selected.
   * The dropdown will produce a string like '2 selected' where `selected` is
   * the `multiselectSelectionLabel`.
   */
  multiselectSelectionLabel: string,

  /**
   * **Multiselect prop:** a render prop that returns the contents to display
   * in the dropdown button. **NOTE:** This function will never receive an
   * empty array. If no selections are made, the content to render is handled
   * by the `defaultDisplayContent` prop.
   */
  renderButtonLabel?: (selectedValues: $ReadOnlyArray<T>) => React.Node,

  /**
   * **Multiselect prop:** if `selectedOptions` are provided then these will be
   * shown at the top of the dropdown. They will be separated by a dividing line
   * and will be shown regardless of the search term.
   */
  selectedOptions: $ReadOnlyArray<React.Element<Class<Option<T>>>>,

  /**
   * **Optional for an controlled Dropdown.**
   * Callback for when the selection changes.
   */
  onSelectionChange?: (
    selectedValues: $ReadOnlyArray<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
|};

type BaseProps<T> = {|
  /** CSS class name for the dropdown button */
  buttonClassName: string,

  /** Minimum width (in pixels) for the dropdown button */
  buttonMinWidth?: number,

  /** Changes the color of the dropdown button based on intent */
  buttonIntent:
    | 'default'
    | 'primary'
    | 'success'
    | 'danger'
    | 'info'
    | 'warning',

  /** Width (in pixels or as a string) for the dropdown button */
  buttonWidth?: string | number,

  /** The type of caret to use on the dropdown button */
  caretType: CaretType,
  children: React.ChildrenArray<
    ?React.Element<Class<Option<T>>> | ?React.Element<Class<OptionsGroup<T>>>,
  >,

  /** The class name to give to the top-level dropdown div */
  className: string,

  /**
   * Whether or not dropdown position should be auto-controlled based on if
   * it will overflow past the window dimensions.
   */
  controlDropDownPosition: boolean,

  /** Used to show tooltips on the dropdown.  */
  dataContent?: string,

  /** Controls if we should debounce the search text input */
  debounceSearch: boolean,

  /** Default contents to show on the button when no selection is made */
  defaultDisplayContent: React.Node,

  /** Disable ability to select options */
  disableSelect: boolean,

  /**
   * Whether or not the current selection should be displayed.
   * If false, the current selection will not be shown either on the dropdown
   * button or on the dropdown menu.
   */
  displayCurrentSelection: boolean,

  /** Contents to show when a group with no options is expanded */
  emptyOptionsGroupContent: React.Node,

  /** Enables the ability to search for options in the dropdown menu */
  enableSearch: boolean,

  /**
   * Auto-expands the search results, so any option groups that contain
   * results that pass the search text will auto-expand to show the children
   * options. If false, the user would have to manually click on the group
   * to expand it and see the children options.
   */
  expandSearchResults: boolean,

  /** Hides the caret on the dropdown button */
  hideCaret: boolean,

  /**
   * The margin-left to add at each level off the dropdown hierarchy, if we
   * have OptionGroups. This is useful so that each nested level can be
   * indented. The margin must be in 'em' or 'px'.
   */
  marginPerLevel: string,

  /** Align the menu to the right or left */
  menuAlignment: 'left' | 'right',

  /** The maximum height (in pixels) for the dropdown menu. */
  menuMaxHeight?: number,

  /** The minimum width for the dropdown menu. */
  menuMinWidth?: string | number,

  /** The width to set on the dropdown menu. */
  menuWidth?: string | number,

  /** Dropdown contents to show when there are no options to render. */
  noOptionsContent: React.Node,

  /** Contents to show when the async search returns no results */
  noAsyncSearchContent: React.Node,

  /** Callback to perform an asynchronous search */
  onAsyncSearch?: (searchText: string, callback: () => void) => void,

  /** Callback for when the dropdown menu is opened */
  onOpenDropdownClick?: () => void,

  /** Debounce time (in ms) for the search input */
  searchDebounceTimeoutMs: number,

  /** Placeholder text for the search input box */
  searchInputPlaceholder: string,

  /** CSS styles to set on the dropdown button content */
  valueStyle?: StyleObject,
|};

type Props<T> = {
  ...MultiselectControlledProps<T>,
  ...BaseProps<T>,
};

/**
 * This is a multiselect Dropdown component. This is an uncontrolled component.
 *
 * For the controlled version, use
 * [`<Dropdown.Multiselect>`](#multiselectdropdown).
 *
 * This component supports selecting multiple values at a time. If you want to
 * limit to only a single selection, use
 * [`<Dropdown.Uncontrolled>`](#uncontrolleddropdown) instead.
 * For the controlled version of the single selection dropdown, use
 * [`<Dropdown>`](#dropdown).
 *
 * @visibleName Dropdown.Multiselect.Uncontrolled
 */
export default class MultiselectUncontrolledDropdown<
  T,
> extends React.PureComponent<Props<T>> {
  static defaultProps = {
    buttonClassName: '',
    buttonMinWidth: undefined,
    buttonIntent: 'default',
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
    menuAlignment: 'left',
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

  _dropdownRef: $RefObject<typeof BaseDropdown> = React.createRef();

  /**
   * Get the currently selected values. The array will be empty if there are no
   * values selected.
   * @public
   * @returns $ReadOnlyArray<T>
   */
  getValue(): $ReadOnlyArray<T> {
    if (this._dropdownRef.current) {
      return this._dropdownRef.current.getMultipleValues();
    }
    throw new Error(
      '[UncontrolledDropdown] Could not call `getValue` because the ref is not defined',
    );
  }

  render() {
    return (
      <BaseDropdown
        ref={this._dropdownRef}
        isControlled={false}
        isMultiselect
        {...this.props}
      />
    );
  }
}
