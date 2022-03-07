// @flow
import * as React from 'react';
import classNames from 'classnames';
import { Spring, animated, config } from 'react-spring/renderprops';

import * as Zen from 'lib/Zen';
import AnimatableColumns from 'components/ui/HierarchicalSelector/MainColumnArea/AnimatableColumns';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import HierarchySearchResults from 'models/ui/HierarchicalSelector/HierarchySearchResults';
import MainColumnArea from 'components/ui/HierarchicalSelector/MainColumnArea';
import SearchBar from 'components/ui/HierarchicalSelector/SearchBar';
import {
  ANIMATION_STEPS,
  DURATION,
  getScaleXTransformValues,
  preloadAnimations,
} from 'components/ui/HierarchicalSelector/util/animationUtil';
import { autobind, memoizeOne } from 'decorators';
import { noop } from 'util/util';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type SpringAnimatedString = $AllowAny;

type DefaultProps<T> = {
  /**
   * Generates the title of a column
   * @param {HierarchyItem} item The HierarchyItem that produced this column
   * @returns {React.Node} The column title
   */
  columnTitleGenerator: ((HierarchyItem<T>) => React.Node) | void,
  columnWidth: number,
  enableSearch: boolean,

  /** Custom element to render at the bottom of the HierarchicalSelector */
  footer: React.Node,

  /**
   * Callback for when any item is clicked - regardless of whether it's a
   * leaf or a category
   * @param {HierarchyItem} item The clicked HierarchyItem
   */
  onItemClick: (
    item: HierarchyItem<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  /**
   * Callback issued whenever the last item in the currently selected hierarchy
   * items changes.
   */
  onHierarchyPathTailChange: (tailItem: HierarchyItem<T>) => void,

  /** Used to determine if a loading spinner should be shown. */
  hierarchyLoaded: boolean,
  maxHeight?: number,
  maxWidth: number,

  /**
   * An optional callback that can be used to indicate whether an item in the
   * selector is selctable. This option works well if you have a large list of
   * items that cannot be selected and don't want to construct the
   * `unselectableHierarchyItems` array.
   */
  testItemSelectable: ((item: HierarchyItem<T>) => boolean) | void,

  /**
   * A list of ids that represent items that have already been selected and
   * cannot be selected again. Unless the parent component maintains a list
   * of unselectable items, this feature will be ignored due to defaulting to
   * an empty list.
   */
  unselectableHierarchyItems: Zen.Array<string>,
};

type Props<T> = {
  ...DefaultProps<T>,

  // eslint-disable-next-line react/no-unused-prop-types
  hierarchyRoot: HierarchyItem<T>,
};

export type State<T> = {
  selectedHierarchyItems: Zen.Array<HierarchyItem<T>>,
  oldWidth: number,
  paddingWidth?: number,
  prevSelectedHierarchyItems?: Zen.Array<HierarchyItem<T>>,
  prevHierarchyRoot?: HierarchyItem<T>,
  prevSearchResults?: HierarchySearchResults<T>,

  // boolean flag to determine when the react-spring animation should
  // be reset with the most up-to-date width calculations.
  resetSpringValues: boolean,
  searchResults?: HierarchySearchResults<T>,
  widthToSet: number,
};

const ANIMATION_CONFIG = {
  ...config.default,
  duration: DURATION,
};

function getInitialState<T>(props: Props<T>): State<T> {
  const { hierarchyRoot } = props;

  // selectedHierarchyItems must be initialized to contain the hierarchy root
  return {
    selectedHierarchyItems: Zen.Array.create([hierarchyRoot]),
    prevSelectedHierarchyItems: undefined,
    prevHierarchyRoot: undefined,
    prevSearchResults: undefined,
    resetSpringValues: true,
    searchResults: undefined,
    oldWidth: props.columnWidth,
    paddingWidth: undefined,
    widthToSet: props.columnWidth,
  };
}

/**
 * Update the selected items array when the root changes. Use the ID of the
 * selected item to find the corresponding item in the new tree.
 */
function synchronizeSelectedItems<T: NamedItem>(
  selectedItems: Zen.Array<HierarchyItem<T>>,
  newRoot: HierarchyItem<T>,
): Zen.Array<HierarchyItem<T>> {
  const output = [];
  selectedItems.forEach(item => {
    // NOTE(stephen): This could be non-performant on deeply selected nodes or
    // when nodes are removed from the tree (since all branches will be searched
    // recursively for a node that does not exist).
    // We could exploit the ordering of `selectedItems` to more efficiently
    // search for matches, since the order is:
    // root -> level 1 (parent is previous) -> level 2 (parent is previous) ...
    const newItem = newRoot.findItemById(item.id());
    if (newItem !== undefined) {
      output.push(newItem);
    }
  });

  return Zen.Array.create(output);
}

/**
 * Update the state after the root of the tree has changed. Keep all state
 * variables that reference parts of the tree in sync with the new tree.
 */
function getStateAfterRootChange<T: NamedItem>(
  props: Props<T>,
  state: State<T>,
): State<T> {
  const { hierarchyRoot } = props;
  const {
    prevHierarchyRoot,
    prevSelectedHierarchyItems,
    selectedHierarchyItems,
  } = state;

  // If the previous or current root are undefined, we have to reset the state.
  if (prevHierarchyRoot === undefined || hierarchyRoot === undefined) {
    return {
      ...getInitialState(props),
      prevHierarchyRoot: props.hierarchyRoot,
    };
  }

  const selectedItems = synchronizeSelectedItems(
    selectedHierarchyItems,
    hierarchyRoot,
  );

  // If the previously selected and currently selected are supposed to be
  // equivalent, maintain this equivalence. If they are supposed to be
  // different, maintain their difference. This ensures we will not need to
  // reset the animation state.
  let prevSelectedItems;
  if (prevSelectedHierarchyItems !== undefined) {
    prevSelectedItems =
      prevSelectedHierarchyItems === selectedHierarchyItems
        ? selectedItems
        : synchronizeSelectedItems(prevSelectedHierarchyItems, hierarchyRoot);
  }

  return {
    ...state,
    selectedHierarchyItems: selectedItems,
    prevSelectedHierarchyItems: prevSelectedItems,
    prevHierarchyRoot: props.hierarchyRoot,
  };
}

/**
 * The HierarchicalSelector is a powerful UI component to search and select
 * items in a hierarchical tree.
 *
 * In order to use this component it involves some pre-processing where you
 * will have to create a tree using HierarchyItem models. Each HierarchyItem
 * must contain a `metadata` object which must implement a `name()` function
 * from which the HierarchyItem will derive its name.
 */
export default class HierarchicalSelector<
  T: NamedItem,
> extends React.PureComponent<Props<T>, State<T>> {
  static defaultProps: DefaultProps<T> = {
    columnTitleGenerator: undefined,
    columnWidth: 400,
    enableSearch: false,
    footer: null,
    onItemClick: noop,
    onHierarchyPathTailChange: noop,
    hierarchyLoaded: true,
    maxHeight: undefined,
    maxWidth: 1000,
    testItemSelectable: undefined,
    unselectableHierarchyItems: Zen.Array.create<string>(),
  };

  state: State<T> = getInitialState<T>(this.props);

  _searchBarRef: $ElementRefObject<Class<SearchBar<T>>> = React.createRef();

  static getDerivedStateFromProps<V: NamedItem>(
    props: Props<V>,
    state: State<V>,
  ): State<V> {
    if (state.prevHierarchyRoot !== props.hierarchyRoot) {
      return getStateAfterRootChange<V>(props, state);
    }

    // Calculate and set the new width of the hierarchical selector
    // based on the current columns and search results.
    const { columnWidth, maxWidth } = props;
    const { selectedHierarchyItems, searchResults, prevSearchResults } = state;
    const widthToSet = AnimatableColumns.getHierarchicalSelectorWidth(
      selectedHierarchyItems,
      !!searchResults,
      columnWidth,
      maxWidth,
    );

    const oldWidth = state.widthToSet;
    const resetSpringValues =
      selectedHierarchyItems !== state.prevSelectedHierarchyItems ||
      !!searchResults;

    let { paddingWidth } = state;
    if (resetSpringValues) {
      // if the search results are removed, we need to calculate how much width
      // was lost so that we can render an invisible placeholder column, just to
      // keep the scale animation from skewing.
      paddingWidth =
        oldWidth > widthToSet && !!prevSearchResults
          ? oldWidth - widthToSet
          : undefined;
    }

    return {
      ...state,
      resetSpringValues,
      oldWidth,
      widthToSet,
      paddingWidth,
      prevSelectedHierarchyItems: selectedHierarchyItems,
      prevSearchResults: searchResults,
    };
  }

  constructor(props: Props<T>): void {
    super(props);
    preloadAnimations(props.columnWidth, props.maxWidth);
  }

  componentDidUpdate() {
    // HACK(stephen): Seeing really, really weird animation failures when a
    // rerender is triggered *during* an animation. The animation kind of just
    // quits. By watching for `resetSpringValues` to turn `false`, we can make
    // sure we call the function after animation has completed. This comes at a
    // cost to responsiveness, though.
    // TODO(stephen): Figure out how to make the call to
    // `onHierarchyPathTailChange` immediately. There is no guarantee
    // around whether it willtrigger a rerender or not, and the bug lies in the
    // HierarchicalSelector (or deeper).
    if (!this.state.resetSpringValues) {
      this.onHierarchyPathTailChange(
        this.state.selectedHierarchyItems.last(),
        this.props.onHierarchyPathTailChange,
      );
    }
  }

  // Build a callback that will be regenerated each time the props
  // `unselectableHierarchyItems` or `testItemSelectable` change. This is needed
  // since we support two ways of testing for selectability of items as props.
  @memoizeOne
  buildTestItemSelectableCallback(
    testItemSelectable: ((HierarchyItem<T>) => boolean) | void,
    unselectableHierarchyItems: Zen.Array<string>,
  ): (HierarchyItem<T>) => boolean {
    // Fast path: if there are no unselectable hierarchy items and the user has
    // not specified a callback to test with, just return true always.
    if (
      unselectableHierarchyItems.isEmpty() &&
      testItemSelectable === undefined
    ) {
      return () => true;
    }

    return (item: HierarchyItem<T>) => {
      if (unselectableHierarchyItems.includes(item.id())) {
        return false;
      }

      if (testItemSelectable !== undefined) {
        return testItemSelectable(item);
      }

      return true;
    };
  }

  getTestItemSelectableCallback(): (HierarchyItem<T>) => boolean {
    const { testItemSelectable, unselectableHierarchyItems } = this.props;
    return this.buildTestItemSelectableCallback(
      testItemSelectable,
      unselectableHierarchyItems,
    );
  }

  @memoizeOne
  onHierarchyPathTailChange(
    tailItem: HierarchyItem<T>,
    onHierarchyPathTailChange: (HierarchyItem<T>) => void,
  ) {
    onHierarchyPathTailChange(tailItem);
  }

  @autobind
  onSearchPathChange(path: Zen.Array<HierarchyItem<T>>) {
    // when the search path changes we should set the selectedHierarchyItems
    // to be equal to it, and move focus to the SearchBar
    this.setState({
      selectedHierarchyItems: path,
      searchResults: undefined,
    });

    const selectionValue = path.last().id();
    // TODO(nina): Does not track whether clicked in search results or not
    analytics.track('Breadcrumb Click', {
      selectionValue,
    });
    if (this._searchBarRef.current) {
      this._searchBarRef.current.clearText();
    }
    if (this._searchBarRef.current) {
      this._searchBarRef.current.focus();
    }
  }

  @autobind
  onSearchTextChange(searchText: string) {
    analytics.track('Search in Hierarchical Selector', {
      searchText,
    });
    if (searchText === '') {
      this.setState({ searchResults: undefined });
    } else {
      this.setState((prevState: State<T>) => {
        const { selectedHierarchyItems } = prevState;
        const searchRoot = selectedHierarchyItems.last();
        const searchResults = HierarchySearchResults.fromSearchText(
          searchText,
          searchRoot,
        );

        return { searchResults };
      });
    }
  }

  @autobind
  onColumnRootsChanged(newColumnRoots: Zen.Array<HierarchyItem<T>>) {
    this.setState({
      selectedHierarchyItems: newColumnRoots,
      searchResults: undefined,
    });
    if (this._searchBarRef.current) {
      this._searchBarRef.current.clearText();
    }
  }

  maybeRenderSearchBar(): React.Node {
    if (this.props.enableSearch) {
      // if we are resetting the spring values (i.e. we're animating), then
      // the search bar width should be auto instead of explicitly set
      const searchBarWidth = this.state.resetSpringValues
        ? undefined
        : this.state.widthToSet;
      return (
        <div style={{ width: searchBarWidth }}>
          <SearchBar
            onChange={this.onSearchTextChange}
            onSearchPathChange={this.onSearchPathChange}
            searchPath={this.state.selectedHierarchyItems}
            ref={this._searchBarRef}
          />
        </div>
      );
    }
    return null;
  }

  maybeRenderFooter(): React.Node {
    const { footer } = this.props;
    if (!footer) {
      return null;
    }
    // If we are resetting the spring values (i.e. we're animating), then
    // the search bar width should be auto instead of explicitly set
    const searchBarWidth = this.state.resetSpringValues
      ? undefined
      : this.state.widthToSet;

    return <div style={{ width: searchBarWidth }}>{footer}</div>;
  }

  /**
   * This column is only rendered when this.state has a `paddingWidth`. This
   * only happens on the edge case where:
   * 1. search results used to be open
   * 2. AND the width of the hierarchical selector is being reduced
   * So we need to render an invisible padding column just to keep our transform
   * calculations from skewing
   */
  maybeRenderPaddingColumn(): React.Node {
    const { paddingWidth } = this.state;
    if (paddingWidth !== undefined) {
      return (
        <div
          className="hierarchical-selector__padding-column"
          style={{ width: paddingWidth }}
        />
      );
    }
    return null;
  }

  renderColumnArea(): React.Node {
    const { paddingWidth, selectedHierarchyItems, searchResults } = this.state;
    const {
      columnWidth,
      columnTitleGenerator,
      hierarchyLoaded,
      maxHeight,
      maxWidth,
      onItemClick,
    } = this.props;
    const baseClass = 'hierarchical-selector__column-area-container';
    const columnContainerClassName = classNames(baseClass, {
      [`${baseClass}--padded`]: paddingWidth !== undefined,
    });

    return (
      <React.Fragment>
        <div className={columnContainerClassName}>
          <MainColumnArea
            hierarchyItems={selectedHierarchyItems}
            hierarchyLoaded={hierarchyLoaded}
            columnTitleGenerator={columnTitleGenerator}
            columnWidth={columnWidth}
            maxHeight={maxHeight}
            maxWidth={maxWidth}
            onItemClick={onItemClick}
            onColumnRootsChanged={this.onColumnRootsChanged}
            searchResults={searchResults}
            testItemSelectable={this.getTestItemSelectableCallback()}
          />
        </div>
        {this.maybeRenderPaddingColumn()}
      </React.Fragment>
    );
  }

  renderMainContainer(
    containerScaleX: SpringAnimatedString,
    contentsScaleX: SpringAnimatedString,
  ): React.Node {
    const { maxWidth } = this.props;
    return (
      <animated.div
        className="hierarchical-selector"
        style={{
          maxWidth,
          overflow: 'hidden',
          transformOrigin: 'left',
          transform: containerScaleX,
        }}
      >
        <animated.div
          style={{ transformOrigin: 'left', transform: contentsScaleX }}
        >
          {this.maybeRenderSearchBar()}
          {this.renderColumnArea()}
          {this.maybeRenderFooter()}
        </animated.div>
      </animated.div>
    );
  }

  render(): React.Node {
    const { oldWidth, widthToSet, resetSpringValues } = this.state;
    const [containerScaleXs, contentsScaleXs] = getScaleXTransformValues(
      oldWidth,
      widthToSet,
    );

    return (
      <Spring
        native
        reset={resetSpringValues}
        config={ANIMATION_CONFIG}
        from={{ x: 0 }}
        to={{ x: 100 }}
        onRest={() => this.setState({ resetSpringValues: false })}
      >
        {props => {
          const containerScaleX = props.x
            .interpolate(ANIMATION_STEPS, containerScaleXs)
            .interpolate(x => `scaleX(${x})`);
          const contentsScaleX = props.x
            .interpolate(ANIMATION_STEPS, contentsScaleXs)
            .interpolate(x => `scaleX(${x})`);
          return this.renderMainContainer(containerScaleX, contentsScaleX);
        }}
      </Spring>
    );
  }
}
