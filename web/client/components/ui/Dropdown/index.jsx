// @flow
import * as React from 'react';

import BaseDropdown, {
  ALIGNMENTS,
  INTENTS,
} from 'components/ui/Dropdown/internal/BaseDropdown';
import Caret from 'components/ui/Caret';
import DropdownOptionsList from 'components/ui/Dropdown/DropdownOptionsList';
import MultiselectDropdown from 'components/ui/Dropdown/MultiselectDropdown';
import Option from 'components/ui/Dropdown/Option';
import OptionsGroup from 'components/ui/Dropdown/OptionsGroup';
import UncontrolledDropdown from 'components/ui/Dropdown/UncontrolledDropdown';
import type { CaretType } from 'components/ui/Caret';
import type { DropdownChildType } from 'components/ui/Dropdown/internal/BaseDropdown';
import type { StyleObject } from 'types/jsCore';

const TEXT = t('ui.Dropdown');

type SingleSelectControlledProps<T> = {|
  /**
   * **Required for a controlled Dropdown.** This is the currently selected
   * value. Pass `undefined` if there is no selection.
   */
  value: T | void,

  /**
   * **Required for a controlled Dropdown.**
   * Callback for when the selection changes.
   */
  onSelectionChange: (
    selectedValue: T,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  /**
   * **Single-select prop:** a render prop that returns the contents to display
   * in the dropdown button.
   */
  renderButtonLabel?: (selectedValue: T) => React.Node,
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

type Props<T> = {|
  ...SingleSelectControlledProps<T>,
  ...BaseProps<T>,
|};

/**
 * This is the basic Dropdown component. This is a controlled component.
 *
 * For the uncontrolled version, use
 * [`<Dropdown.Uncontrolled>`](#uncontrolleddropdown).
 *
 * This component only supports selecting a single value at a time. If you want
 * to enable multiselect, you must use
 * [`<Dropdown.Multiselect>`](#multiselectdropdown). For the
 * uncontrolled version of the multiselect, use
 * [`<Dropdown.Multiselect.Uncontrolled>`](#multiselectuncontrolleddropdown).
 *
 */
export default class Dropdown<T> extends React.PureComponent<Props<T>> {
  static Alignments = ALIGNMENTS;
  static Intents = INTENTS;
  static Option = Option;
  static OptionsList = DropdownOptionsList;
  static OptionsGroup = OptionsGroup;
  static Uncontrolled = UncontrolledDropdown;
  static Multiselect = MultiselectDropdown;

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
    expandSearchResults: true,
    hideCaret: false,
    marginPerLevel: '1.25em',
    menuAlignment: 'left',
    menuMaxHeight: undefined,
    menuMinWidth: undefined,
    menuWidth: undefined,
    noOptionsContent: TEXT.noOptions,
    noAsyncSearchContent: TEXT.noSearch,
    onAsyncSearch: undefined,
    onOpenDropdownClick: undefined,
    renderButtonLabel: undefined,
    searchDebounceTimeoutMs: 300,
    searchInputPlaceholder: TEXT.searchPlaceholder,
    valueStyle: undefined,
  };

  render() {
    return <BaseDropdown isControlled isMultiselect={false} {...this.props} />;
  }
}

export type { DropdownChildType };
