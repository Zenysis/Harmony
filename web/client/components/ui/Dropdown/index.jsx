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
import type { StyleObject } from 'types/jsCore';

const TEXT = t('ui.Dropdown');

type DefaultProps<T> = {
  /**
   * The accessibility name for this dropdown that will be assigned to the
   * main button.
   */
  ariaName?: string,

  /**
   * This prop should be used sparringly, only when you want to change the way
   * a dropdown blur should trigger. Read the `blurType` prop explanation in
   * [Popover](#popover) to understand what this does.
   */
  blurType?: 'overlay' | 'document',

  /**
   * The currently selected options for a dropdown. Used for async search
   * dropdowns to render the selected options when no search text is specified.
   * It is also used to render the button label when the selected option does
   * not match the current search and is therefore not in the children prop.
   */
  asyncSelectedOptions?: $ReadOnlyArray<React.Element<Class<Option<T>>>>,

  /** CSS class name for the dropdown button */
  buttonClassName: string,

  /** Minimum width (in pixels) for the dropdown button */
  buttonMinWidth?: number,

  /**
   * Changes the color of the dropdown button based on intent. Can be specified
   * using `Dropdown.Intents`
   */
  buttonIntent:
    | 'default'
    | 'plain'
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

  /** The class name for the dropdown container */
  className: string,

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
   * Function to check for value equality. Is used to work which option is
   * selected. Should be provided if we cannot guarantee that the selectedValue
   * and the value held in the dropdown hold references to the same objects.
   */
  isSameValue: (valA: T, valB: T) => boolean,

  /**
   * The margin-left to add at each level off the dropdown hierarchy, if we
   * have OptionGroups. This is useful so that each nested level can be
   * indented. The margin must be in 'em' or 'px'.
   */
  marginPerLevel: string,

  /** Align the menu to the right or left */
  menuAlignment: 'left' | 'right',

  /** The class name to give to the dropdown menu div */
  menuClassName: string,

  /** The maximum height (in pixels) for the dropdown menu. */
  menuMaxHeight?: number,

  /** The maximum width for the dropdown menu. */
  menuMaxWidth?: string | number,

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

  /** Callback for when the dropdown menu is closed */
  onDropdownClose?: () => void,

  /** Callback for when the dropdown menu is opened */
  onOpenDropdownClick?: () => void,

  // Optionally surface a loading spinner to indicate the dropdown options are
  // loading.
  optionsLoading: boolean,

  /**
   * **Single-select prop:** a render prop that returns the contents to display
   * in the dropdown button.
   */
  renderButtonLabel?: (selectedValue: T) => React.Node,

  /** Debounce time (in ms) for the search input */
  searchDebounceTimeoutMs: number,

  /** Placeholder text for the search input box */
  searchInputPlaceholder: string,

  /**
   * Show the full button contents on hover. This is useful for dropdowns that
   * have very long options, and when selected they get cut off by an ellipsis
   * because they don't fit in the dropdown button. Setting this to true allows
   * the user to hover over the button to see the full contents. This only works
   * if your options are strings or numbers and not more complex React Nodes.
   */
  showButtonContentsOnHover: boolean,

  /** CSS styles to set on the dropdown button content */
  valueStyle?: StyleObject,

  /** testId is used to add data-testid attribute to element */
  testId?: string,

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

type Props<T> = {
  ...DefaultProps<T>,
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
};

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
  static defaultProps: DefaultProps<T> = {
    ariaName: undefined,
    asyncSelectedOptions: undefined,
    blurType: 'document',
    buttonClassName: '',
    buttonMinWidth: undefined,
    buttonIntent: 'default',
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
    expandSearchResults: true,
    hideCaret: false,
    isSameValue: (valA: mixed, valB: mixed) => valA === valB,
    marginPerLevel: '1.25em',
    menuAlignment: 'left',
    menuClassName: '',
    menuMaxHeight: undefined,
    menuMaxWidth: undefined,
    menuMinWidth: undefined,
    menuWidth: undefined,
    noOptionsContent: TEXT.noOptions,
    noAsyncSearchContent: TEXT.noSearch,
    onAsyncSearch: undefined,
    onDropdownClose: undefined,
    onOpenDropdownClick: undefined,
    optionsLoading: false,
    renderButtonLabel: undefined,
    searchDebounceTimeoutMs: 300,
    searchInputPlaceholder: TEXT.searchPlaceholder,
    showButtonContentsOnHover: false,
    valueStyle: undefined,
    windowEdgeThresholds: undefined,
    testId: undefined,
  };

  static Alignments: typeof ALIGNMENTS = ALIGNMENTS;
  static Intents: typeof INTENTS = INTENTS;
  static Option: typeof Option = Option;
  static OptionsList: typeof DropdownOptionsList = DropdownOptionsList;
  static OptionsGroup: typeof OptionsGroup = OptionsGroup;
  static Uncontrolled: typeof UncontrolledDropdown = UncontrolledDropdown;
  static Multiselect: typeof MultiselectDropdown = MultiselectDropdown;
  static CaretTypes: typeof Caret.Types = Caret.Types;

  render(): React.Element<typeof BaseDropdown> {
    return <BaseDropdown isControlled isMultiselect={false} {...this.props} />;
  }
}
