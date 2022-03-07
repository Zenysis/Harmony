// @flow
import * as React from 'react';
import { Spring, Transition, animated, config } from 'react-spring/renderprops';

import * as Zen from 'lib/Zen';
import AnimatableColumns from 'components/ui/HierarchicalSelector/MainColumnArea/AnimatableColumns';
import HierarchyColumn from 'components/ui/HierarchicalSelector/MainColumnArea/HierarchyColumn';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import SearchResultColumn from 'components/ui/HierarchicalSelector/MainColumnArea/SearchResultColumn';
import SearchResultColumnData from 'models/ui/HierarchicalSelector/SearchResultColumnData';
import Spacing from 'components/ui/Spacing';
import { arrayEquality } from 'util/arrayUtil';
import { autobind } from 'decorators';
import type HierarchySearchResults from 'models/ui/HierarchicalSelector/HierarchySearchResults';
import type { AnimatableColumn } from 'components/ui/HierarchicalSelector/MainColumnArea/AnimatableColumns';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';
import type { StyleObject } from 'types/jsCore';

type SpringAnimatedNumber = $AllowAny;

type DefaultProps<T> = {
  maxHeight?: number,
  searchResults?: HierarchySearchResults<T>,
};

type Props<T> = {
  ...DefaultProps<T>,
  hierarchyItems: Zen.Array<HierarchyItem<T>>,
  hierarchyLoaded: boolean,
  columnTitleGenerator: ((HierarchyItem<T>) => React.Node) | void,
  columnWidth: number,
  maxWidth: number,

  // callback for when any item is clicked - regardless of whether it's a
  // leaf or a category
  onItemClick: (
    item: HierarchyItem<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  onColumnRootsChanged: (Zen.Array<HierarchyItem<T>>) => void,
  testItemSelectable: (HierarchyItem<T>) => boolean,
};

type State<T> = {
  // boolean flag to tell us when we are animating the scroll container
  animatingScroll: boolean,
  columnHeight?: number,

  // All columns slide in/out as their default transition, *except* when a
  // column is being replaced, in that case it should fade out, and the new
  // one should fade in.
  columnToFadeIn?: HierarchyItem<T> | SearchResultColumnData<T>,
  columnToFadeOut?: HierarchyItem<T> | SearchResultColumnData<T>,

  // This is where we store the columns to animate. THIS IS NOT THE SAME AS
  // THE HIERARCHYITEM LIST WE GET FROM PROPS. `hierarchyItems` stores only
  // the HierarchyItems that are part of our hierarchy.
  // `columnsToAnimate` is more internal, and keeps track of intermediate
  // states, meaning it might have some items that are not actually visible
  // to the user.
  // For example, when we fade columns, there's an intermediate state where
  // the columnToFadeIn has been added but the columnToFadeOut has not been
  // removed yet. Or when we want to show a SearchResultColumn, this is not
  // a part of our hierarchy at all, but we still render it as our last column
  // in the DOM, so it is still an animatable column we need to track.
  columnsToAnimate: Zen.Array<AnimatableColumn<T>>,
  prevHierarchyItems?: Zen.Array<HierarchyItem<T>>,
  prevSearchResults?: HierarchySearchResults<T>,

  // the search result column that represents the current searchResults from
  // props
  searchColumn?: SearchResultColumnData<T>,

  // scroll px we want to set our scrollable area to
  scrollLeft: number,
};

// drop the precision of the animation just a bit (default is 0.01)
// to get a small performance boost without harming how the animation looks
const ANIMATION_CONFIG = { ...config.default, precision: 0.05, clamp: true };

const TEXT = t('ui.HierarchicalSelector.MainColumnArea');

export default class MainColumnArea<T: NamedItem> extends React.PureComponent<
  Props<T>,
  State<T>,
> {
  static defaultProps: DefaultProps<T> = {
    maxHeight: undefined,
    searchResults: undefined,
  };

  state: State<T> = {
    animatingScroll: false,
    columnHeight: undefined,
    columnToFadeIn: undefined,
    columnToFadeOut: undefined,
    columnsToAnimate: this.props.hierarchyItems,
    prevHierarchyItems: undefined,
    prevSearchResults: undefined,
    searchColumn: undefined,
    scrollLeft: 0,
  };

  _scrollableContainerElt: $ElementRefObject<'div'> = React.createRef();

  static getDerivedStateFromProps<V: NamedItem>(
    nextProps: Props<V>,
    prevState: State<V>,
  ): ?$Shape<State<V>> {
    const { hierarchyItems, searchResults } = nextProps;
    const {
      prevSearchResults,
      prevHierarchyItems,
      columnsToAnimate,
      searchColumn,
    } = prevState;
    const prevData = {
      prevHierarchyItems: hierarchyItems,
      prevSearchResults: searchResults,
    };

    // Check if the hierarchy items have changed. We want to change the columns
    // to animate in this case. The only exception is if the searchColumn is
    // open, sometimes the hierarchy items array may have changed reference, but
    // the contents are still the same. So we need to do an O(n) array check to
    // compare item ids.
    if (
      prevHierarchyItems !== hierarchyItems &&
      !(
        searchColumn &&
        prevHierarchyItems !== undefined &&
        arrayEquality(
          hierarchyItems.arrayView(),
          prevHierarchyItems.arrayView(),
          item => item.id(),
        )
      )
    ) {
      let newColumnsToAnimate = hierarchyItems;

      // if we removed a column, or altered the hierarchy items while we had
      // a search column visible, we need to do something weird:
      // We want our new columnsToAnimate to be equal to the new hierarchy
      // items. BUT we still need to keep columnsToAnimate at the
      // same length as before, otherwise our scale transform animations
      // will mess up due to the change in width. So we calculate the
      // `leftOverItems` and insert those to the end of our new items.
      // These leftOverItems will not be visible (due to overflow: hidden),
      // but we still need them in the DOM to keep the width the same as
      // before so our transform animation looks right.
      if (
        prevHierarchyItems &&
        (searchColumn || hierarchyItems.size() < prevHierarchyItems.size())
      ) {
        // get the previous hierarchy items and replace the last column
        // with our search column (if we had one)
        const prevItems = prevHierarchyItems.apply(
          prevHierarchyItems.size() - 1,
          col => searchColumn || col,
        );

        // get all items that go after our newly selected items
        const leftOverItems = prevItems.slice(hierarchyItems.size());

        // concatenate our newly selected items with the leftOverItems
        newColumnsToAnimate = hierarchyItems.concat(leftOverItems);
      }

      return { columnsToAnimate: newColumnsToAnimate, ...prevData };
    }

    // If the search results have changed we need to manage the fading in/out
    // of the search result column depending on if we're adding new search
    // results, replacing existing ones, or removing the search results.
    if (searchResults !== prevSearchResults) {
      if (searchResults !== undefined) {
        // we are either adding new search results or replacing existing ones
        const newSearchColumn = SearchResultColumnData.create({
          searchResults,
          parentItem: hierarchyItems.last(),
        });
        const columnToFadeIn = newSearchColumn;
        const columnToFadeOut = searchColumn || hierarchyItems.last();

        // set things up for a fade: columnToFadeIn goes at n-1, and
        // columnToFadeOut goes at nth position
        const newColumnsToAnimate = hierarchyItems
          .set(hierarchyItems.size() - 1, columnToFadeIn)
          .push(columnToFadeOut);
        return {
          columnToFadeIn,
          columnToFadeOut,
          columnsToAnimate: newColumnsToAnimate,
          searchColumn: columnToFadeIn,
          ...prevData,
        };
      }

      // There are no current search results, so this means we are removing
      // the search result column. We should fade it out and fade in the
      // last hierarchy item.
      return {
        columnsToAnimate: columnsToAnimate.insertAt(
          columnsToAnimate.size() - 1,
          hierarchyItems.last(),
        ),
        columnToFadeIn: hierarchyItems.last(),
        columnToFadeOut: searchColumn,
        ...prevData,
      };
    }

    return null;
  }

  componentDidUpdate(prevProps: Props<T>) {
    this.recalculateHeight(prevProps);
    this.switchFadedItemColumns();
    this.removeSearchColumn(prevProps);
    this.setNewScrollPosition(prevProps);
  }

  recalculateHeight(prevProps: Props<T>) {
    this.setState((state, props) => {
      // if the hierarchy items changed, it's possible the height has changed,
      // so we reset it to `undefined` so we can recalculate.
      if (props.hierarchyItems !== prevProps.hierarchyItems) {
        return { columnHeight: undefined };
      }

      // if the columnHeight is undefined, it means the newest columns have
      // rendered already and we can get the new height of the container.
      const scrollableDiv = this._scrollableContainerElt.current;
      if (state.columnHeight === undefined && scrollableDiv) {
        return { columnHeight: scrollableDiv.offsetHeight };
      }

      return undefined;
    });
  }

  setNewScrollPosition(prevProps: Props<T>) {
    // we do this calculation in `componentDidUpdate` because we need access
    // to the scroll container ref. That's why we can't do this in
    // getDerivedStateFromProps.
    this.setState((state, props) => {
      const { searchResults, hierarchyItems } = props;
      const addedColumn =
        hierarchyItems.size() > prevProps.hierarchyItems.size();

      // if the search results changed, or if we just added a new column and
      // are about to overflow, or if we just removed a column
      if (
        searchResults !== prevProps.searchResults ||
        (addedColumn && this.willColumnsOverflowContainer()) ||
        hierarchyItems.size() < prevProps.hierarchyItems.size()
      ) {
        return {
          scrollLeft: this.getExpectedScrollPosition(),
          animatingScroll: true,
        };
      }
      return undefined;
    });
  }

  switchFadedItemColumns() {
    this.setState(state => {
      const { columnsToAnimate, columnToFadeOut, columnToFadeIn } = state;

      // If we are fading in search results, but the column to fade out
      // is still in the array, then its time to remove it so that we can
      // trigger the fade out animation.
      if (
        columnToFadeOut !== undefined &&
        columnToFadeIn instanceof SearchResultColumnData &&
        columnsToAnimate.includes(columnToFadeOut)
      ) {
        const idx = columnsToAnimate.indexOf(columnToFadeIn);
        return { columnsToAnimate: columnsToAnimate.slice(0, idx + 1) };
      }

      // If the columnToFadeOut has been removed from the array, but we
      // still track the fade columns in state, then its time to unset them.
      // The reason we remove from the array first and THEN set to undefined
      // is because we need one render cycle first to update the animation
      // styles for fade outs (their absolute position needs to change).
      if (
        columnToFadeIn !== undefined &&
        columnToFadeOut !== undefined &&
        !columnsToAnimate.includes(columnToFadeOut)
      ) {
        return {
          columnToFadeIn: undefined,
          columnToFadeOut: undefined,
        };
      }

      return undefined;
    });
  }

  /**
   * If search results were removed, we need to remove the searchColumn from our
   * state. We do this hear instead of in getDerivedStateFromProps because we
   * need to remove the searchColumn *after* all fade in/out transitions have
   * been set and calculated.
   */
  removeSearchColumn(prevProps: Props<T>) {
    if (!this.props.searchResults && prevProps.searchResults) {
      this.setState({ searchColumn: undefined });
    }
  }

  getSearchColumnWidth(): number {
    const { maxWidth, columnWidth } = this.props;
    return AnimatableColumns.getSearchColumnWidth(columnWidth, maxWidth);
  }

  getExpectedScrollPosition(): number {
    const { maxWidth, columnWidth, hierarchyItems, searchResults } = this.props;
    if (this.willColumnsOverflowContainer()) {
      const fullWidth = AnimatableColumns.getTotalColumnWidth(
        hierarchyItems,
        !!searchResults,
        columnWidth,
        maxWidth,
      );
      return fullWidth - maxWidth;
    }
    return 0;
  }

  getStartingTransitionStyle(col: AnimatableColumn<T>): StyleObject {
    return col === this.state.columnToFadeIn ? { opacity: 0 } : { opacity: 1 };
  }

  getLeavingTransitionStyle(col: AnimatableColumn<T>): StyleObject {
    const { columnWidth } = this.props;
    const { columnToFadeIn, columnToFadeOut, columnsToAnimate } = this.state;
    if (col === columnToFadeOut && columnToFadeIn !== undefined) {
      // we need to overlap the colToFadeIn, so we use colToFadeIn's index
      const colIndex = columnsToAnimate.indexOf(columnToFadeIn);
      return {
        left: colIndex * columnWidth,
        opacity: 0,
        position: 'absolute',
      };
    }
    return { position: 'static' };
  }

  /**
   * Check if the current hierarchy items and search results column will
   * overflow the hierarchical selector container.
   */
  willColumnsOverflowContainer(): boolean {
    const { maxWidth, columnWidth, hierarchyItems, searchResults } = this.props;
    const fullWidth = AnimatableColumns.getTotalColumnWidth(
      hierarchyItems,
      !!searchResults,
      columnWidth,
      maxWidth,
    );
    return fullWidth > maxWidth;
  }

  /**
   * After a hierarchy item is clicked, if it was a Category item we need
   * to update the selected hierarcy items. In case we are replacing a column
   * (meaning that this will trigger a fade animation), its not enough
   * to just update the selected items, we also need to set things up for
   * the fade in/out animation.
   * @param {HierarchyItem<T>} hierarchyItem The clicked hierarchy item
   * @param {number} columnIndex The index of the column that was clicked
   */
  @autobind
  onHierarchyItemClick(
    hierarchyItem: HierarchyItem<T>,
    columnIndex: number,
    event: SyntheticEvent<HTMLElement>,
  ) {
    const { hierarchyItems, onColumnRootsChanged, onItemClick } = this.props;

    if (hierarchyItem.isCategoryItem()) {
      const addingNewColumn = !hierarchyItems.includes(hierarchyItem);
      const clickedOnLastColumn = columnIndex === hierarchyItems.size() - 1;
      const replacingColumn = addingNewColumn && !clickedOnLastColumn;
      let newHierarchyItems = hierarchyItems;

      if (replacingColumn) {
        const columnToFadeOutIndex = columnIndex + 1;
        this.setState(prevState => {
          const { columnsToAnimate } = prevState;

          // the column to fade in should always be inserted right before the
          // column to fade out
          return {
            columnsToAnimate: columnsToAnimate.insertAt(
              columnToFadeOutIndex,
              hierarchyItem,
            ),
            columnToFadeOut: columnsToAnimate.get(columnToFadeOutIndex),
            columnToFadeIn: hierarchyItem,
          };
        });

        newHierarchyItems = hierarchyItems
          .slice(0, columnToFadeOutIndex)
          .push(hierarchyItem);
      } else if (addingNewColumn) {
        newHierarchyItems = hierarchyItems.push(hierarchyItem);
      } else {
        // deselecting everything after the clicked column
        newHierarchyItems = hierarchyItems.slice(0, columnIndex + 1);
      }
      onColumnRootsChanged(newHierarchyItems);
    }
    onItemClick(hierarchyItem, event);
  }

  @autobind
  onSearchColumnCategoryClicked(categoryPath: Zen.Array<HierarchyItem<T>>) {
    const { hierarchyItems, onColumnRootsChanged } = this.props;
    const newColumnRoots = hierarchyItems.concat(categoryPath.tail());

    this.setState(prevState => {
      const { searchColumn, columnsToAnimate } = prevState;

      // prepare to fade out the search column and display the new columns
      return {
        columnsToAnimate: columnsToAnimate.insertAt(
          hierarchyItems.size() - 1,
          categoryPath.first(),
        ),
        columnToFadeIn: categoryPath.first(),
        columnToFadeOut: searchColumn,
      };
    });

    onColumnRootsChanged(newColumnRoots);
  }

  @autobind
  onUserManuallyScrolls() {
    // when a user manually scrolls the container, we should force the
    // scrollable column area to persist the DOM's scroll position.
    // We also set `animatingScroll` to false to cancel any existing
    // scroll animations, otherwise we'll get some very weird movement.
    const scrollableArea = this._scrollableContainerElt.current;
    this.setState(({ scrollLeft }) => {
      if (scrollableArea && scrollableArea.scrollLeft !== scrollLeft) {
        return {
          animatingScroll: false,
          scrollLeft: scrollableArea.scrollLeft,
        };
      }
      return undefined;
    });
  }

  @autobind
  onScrollableAreaIsScrolled() {
    // there are lots of ways the scrollable area can be scrolled.
    // Either user-activated or programmatically (by react-spring).
    // If the scroll event happened because of our animation, then
    // we want to ignore this event.
    if (!this.state.animatingScroll) {
      this.onUserManuallyScrolls();
    }
  }

  /**
   * Event called when the scrollable container finishes scrolling
   */
  @autobind
  onScrollEnd() {
    if (this.willColumnsOverflowContainer()) {
      this.setState({ animatingScroll: false });
    }
  }

  maybeRenderColumnTitlesRow(): React.Node {
    const { columnWidth, columnTitleGenerator } = this.props;
    const { columnsToAnimate } = this.state;

    if (columnTitleGenerator === undefined) {
      return null;
    }

    // We intentionally render the column titles separately (without putting
    // them inside the <HierarchyColumn /> component, because it caused
    // different CSS issues when we did that
    const titles = columnsToAnimate.map(item => (
      <div
        key={item.id()}
        className="hierarchical-selector__column-title"
        style={{ width: columnWidth }}
      >
        {item instanceof HierarchyItem ? columnTitleGenerator(item) : ''}
      </div>
    ));

    return <div className="hierarchical-selector__title-row">{titles}</div>;
  }

  renderSearchResultColumn(item: SearchResultColumnData<T>): React.Node {
    const { maxHeight, onItemClick } = this.props;
    const { columnHeight } = this.state;
    const searchResults = item.searchResults();
    return (
      <SearchResultColumn
        matcher={searchResults.graphSearchResults().matcher}
        onItemClick={onItemClick}
        onCategoryClick={this.onSearchColumnCategoryClicked}
        searchResults={searchResults.resultList()}
        maxHeight={maxHeight}
        height={columnHeight}
      />
    );
  }

  renderItemColumn(hierarchyItem: HierarchyItem<T>): React.Node {
    const children = hierarchyItem.children();
    if (children === undefined) {
      return null;
    }

    // TODO(pablo, toshi): expecting an '_mru' id is business-logic dependent
    // and is unpredictable behavior by just reading the HierarchicalSelector's
    // props. Make this more generic so user's can know how to work with MRU
    // items
    if (hierarchyItem.id() === '__mru' && children.size() === 0) {
      return (
        <div className="hierarchical-selector__empty-mru-text">
          {TEXT.emptyMruText}
        </div>
      );
    }
    const { maxHeight, hierarchyItems, testItemSelectable } = this.props;
    const { columnHeight } = this.state;

    // for this column, figure out if there is a next column. We need
    // this to know if there is any item on *this* column that should
    // be active (i.e. highlighted).
    const itemIndex = hierarchyItems.indexOf(hierarchyItem);
    let nextColumn =
      itemIndex === -1 ? undefined : hierarchyItems.get(itemIndex + 1);

    // if the next is the SearchColumn, then we need to get the
    // search column's `parentItem` to figure out which item to highlight.
    if (nextColumn instanceof SearchResultColumnData) {
      nextColumn = nextColumn.parentItem();
    }

    return (
      <HierarchyColumn
        activeItem={nextColumn}
        columnIndex={itemIndex}
        height={columnHeight}
        items={children}
        maxHeight={maxHeight}
        onItemClick={this.onHierarchyItemClick}
        testItemSelectable={testItemSelectable}
      />
    );
  }

  renderColumns(): React.Node {
    const { columnWidth, hierarchyLoaded } = this.props;
    const { columnsToAnimate } = this.state;

    // we use a react-spring Transition to handle any fading in/out of columns
    return (
      <Transition
        unique
        native
        items={columnsToAnimate.arrayView()}
        keys={col => col.id()}
        from={col => this.getStartingTransitionStyle(col)}
        enter={{ opacity: 1 }}
        leave={col => this.getLeavingTransitionStyle(col)}
      >
        {(column, state) => props => (
          <animated.div
            className="hierarchical-selector__column-transition-wrapper"
            style={{
              ...props,
              left: state === 'leave' ? props.left : undefined,
              overflow: 'hidden',
              pointerEvents: state === 'leave' ? 'none' : undefined,
              position: state === 'leave' ? props.position : undefined,
              width:
                column instanceof SearchResultColumnData
                  ? this.getSearchColumnWidth()
                  : columnWidth,
            }}
          >
            {!hierarchyLoaded && (
              <Spacing padding="xs" flex justifyContent="center">
                <LoadingSpinner />
              </Spacing>
            )}
            {column instanceof SearchResultColumnData
              ? this.renderSearchResultColumn(column)
              : this.renderItemColumn(column)}
          </animated.div>
        )}
      </Transition>
    );
  }

  renderScrollableArea(scrollLeft: SpringAnimatedNumber): React.Node {
    const { animatingScroll, columnsToAnimate } = this.state;
    const { searchResults, hierarchyItems, maxWidth, columnWidth } = this.props;
    const willColumnsOverflow = this.willColumnsOverflowContainer();

    const visibleColumns =
      animatingScroll || searchResults ? columnsToAnimate : hierarchyItems;
    const viewWindowWidth = AnimatableColumns.getTotalColumnWidth(
      visibleColumns,
      AnimatableColumns.hasSearchColumn(visibleColumns),
      columnWidth,
      maxWidth,
    );

    // We add an `onMouseDown` event handler because the user might click on an
    // item mid-scroll, or might even click on the scroll bar itself. In either
    // case we want to stop the scroll animation and persist the scroll position
    // which we handle in the `onUserManuallyScrolls` function.
    return (
      <animated.div
        ref={this._scrollableContainerElt}
        scrollLeft={scrollLeft}
        className="hierarchical-selector__scrollable-container"
        onWheel={this.onUserManuallyScrolls}
        onMouseDown={this.onUserManuallyScrolls}
        onScroll={this.onScrollableAreaIsScrolled}
        style={{
          overflowX: willColumnsOverflow ? 'auto' : 'hidden',
          width: willColumnsOverflow ? maxWidth : undefined,
        }}
      >
        <div
          style={{
            overflowX: willColumnsOverflow ? 'hidden' : undefined,
            width: willColumnsOverflow ? viewWindowWidth : undefined,
          }}
        >
          {this.maybeRenderColumnTitlesRow()}
          {this.renderColumns()}
        </div>
      </animated.div>
    );
  }

  render(): React.Node {
    const { animatingScroll, scrollLeft } = this.state;
    return (
      <Spring
        native
        config={ANIMATION_CONFIG}
        immediate={!animatingScroll}
        to={{ scrollLeft }}
        onRest={this.onScrollEnd}
      >
        {props => this.renderScrollableArea(props.scrollLeft)}
      </Spring>
    );
  }
}
