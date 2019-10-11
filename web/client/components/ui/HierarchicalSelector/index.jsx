// @flow
import * as React from 'react';
import classNames from 'classnames';
import { Spring, animated, config } from 'react-spring';

import AnimatableColumns from 'components/ui/HierarchicalSelector/MainColumnArea/AnimatableColumns';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import HierarchySearchResults from 'models/ui/HierarchicalSelector/HierarchySearchResults';
import MainColumnArea from 'components/ui/HierarchicalSelector/MainColumnArea';
import SearchBar from 'components/ui/HierarchicalSelector/SearchBar';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import {
  ANIMATION_STEPS,
  DURATION,
  getScaleXTransformValues,
  preloadAnimations,
} from 'components/ui/HierarchicalSelector/util/animationUtil';
import { noop } from 'util/util';

type Props = {
  // eslint-disable-next-line react/no-unused-prop-types
  hierarchyRoot: HierarchyItem,

  /** Used to determine if a loading spinner should be shown. */
  hierarchyLoaded: boolean,

  /**
   * Generates the title of a column
   * @param {HierarchyItem} item The HierarchyItem that produced this column
   * @returns {string} The column title
   */
  columnTitleGenerator: $Prop<MainColumnArea, 'columnTitleGenerator'>,
  columnWidth: number,
  enableSearch: boolean,

  /**
   * Callback for when any item is clicked - regardless of whether it's a
   * leaf or a category
   * @param {HierarchyItem} item The clicked HierarchyItem
   */
  onItemClick: (item: HierarchyItem) => void,
  maxHeight?: number,
  maxWidth: number,
};

export type State = {
  selectedHierarchyItems: ZenArray<HierarchyItem>,
  oldWidth: number,
  paddingWidth?: number,
  prevSelectedHierarchyItems?: ZenArray<HierarchyItem>,
  prevHierarchyRoot?: HierarchyItem,
  prevSearchResults?: HierarchySearchResults,

  // boolean flag to determine when the react-spring animation should
  // be reset with the most up-to-date width calculations.
  resetSpringValues: boolean,
  searchResults?: HierarchySearchResults,
  widthToSet: number,
};

const ANIMATION_CONFIG = {
  ...config.default,
  duration: DURATION,
};

function getInitialState(props: Props): State {
  const { hierarchyRoot } = props;

  // selectedHierarchyItems must be initialized to contain the hierarchy root
  return {
    selectedHierarchyItems: ZenArray.create([hierarchyRoot]),
    prevSelectedHierarchyItems: undefined,
    prevHierarchyRoot: undefined,
    prevSearchResults: undefined,
    resetSpringValues: true,
    searchResults: undefined,
    oldWidth: props.columnWidth,
    widthToSet: props.columnWidth,
    paddingWidth: undefined,
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
export default class HierarchicalSelector extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    columnTitleGenerator: () => '',
    columnWidth: 400,
    enableSearch: false,
    onItemClick: noop,
    hierarchyLoaded: true,
    maxHeight: undefined,
    maxWidth: 1000,
  };

  state = getInitialState(this.props);

  _searchBarRef: $RefObject<typeof SearchBar> = React.createRef();

  static getDerivedStateFromProps(props: Props, state: State) {
    if (state.prevHierarchyRoot !== props.hierarchyRoot) {
      // if the hierarchy root ever changes then we have to reset
      // the entire component
      return {
        ...getInitialState(props),
        prevHierarchyRoot: props.hierarchyRoot,
      };
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
      resetSpringValues,
      oldWidth,
      widthToSet,
      paddingWidth,
      prevSelectedHierarchyItems: selectedHierarchyItems,
      prevSearchResults: searchResults,
    };
  }

  constructor(props: Props) {
    super(props);
    preloadAnimations(props.columnWidth, props.maxWidth);
  }

  @autobind
  onSearchPathChange(path: ZenArray<HierarchyItem>) {
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
      this.setState((prevState: State) => {
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
  onColumnRootsChanged(newColumnRoots: ZenArray<HierarchyItem>) {
    this.setState({
      selectedHierarchyItems: newColumnRoots,
      searchResults: undefined,
    });
    if (this._searchBarRef.current) {
      this._searchBarRef.current.clearText();
    }
  }

  maybeRenderSearchBar() {
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

  /**
   * This column is only rendered when this.state has a `paddingWidth`. This
   * only happens on the edge case where:
   * 1. search results used to be open
   * 2. AND the width of the hierarchical selector is being reduced
   * So we need to render an invisible padding column just to keep our transform
   * calculations from skewing
   */
  maybeRenderPaddingColumn() {
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

  renderColumnArea() {
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
          />
        </div>
        {this.maybeRenderPaddingColumn()}
      </React.Fragment>
    );
  }

  renderMainContainer(
    containerScaleX: Spring$AnimatedValue<string>,
    contentsScaleX: Spring$AnimatedValue<string>,
  ) {
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
        </animated.div>
      </animated.div>
    );
  }

  render() {
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
