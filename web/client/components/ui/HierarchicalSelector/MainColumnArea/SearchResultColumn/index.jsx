// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ColumnWrapper from 'components/ui/HierarchicalSelector/MainColumnArea/ColumnWrapper';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import ResultGroup from 'components/ui/HierarchicalSelector/MainColumnArea/SearchResultColumn/ResultGroup';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import type StringMatcher from 'lib/StringMatcher';
import type { HierarchicalSearchResult } from 'models/ui/HierarchicalSelector/HierarchySearchResults/processGraphSearchResults';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type DefaultProps = {
  height?: number,
  maxHeight?: number,
};

type Props<T> = {
  ...DefaultProps,
  // The StringMatcher instance that was used to determined which search
  // results should be shown.
  matcher: StringMatcher,

  // callback for when any item is clicked - regardless of whether it's a
  // leaf or a category
  onItemClick: (
    item: HierarchyItem<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,

  /**
   * This is called when a category breadcrumb is clicked
   * @param {Zen.Array<HierarchyItem<T>>} path The list of all items leading to
   * the clicked category. NOTE: The path starts at the last column that is
   * open. It does *NOT* start at the root of the entire hierarchical selector.
   */
  onCategoryClick: (path: Zen.Array<HierarchyItem<T>>) => void,
  searchResults: $ReadOnlyArray<HierarchicalSearchResult<T>>,
};

type State = {
  numResultsToShow: number,
};

// how many more results to show whenever we scroll to the end of the column
const RESULTS_INCREMENT = 50;

const TEXT = t('ui.HierarchicalSelector.SearchResults');

export default class SearchResultColumn<
  T: NamedItem,
> extends React.PureComponent<Props<T>, State> {
  static defaultProps: DefaultProps = {
    height: undefined,
    maxHeight: undefined,
  };

  state: State = {
    numResultsToShow: 50,
  };

  @memoizeOne
  getTotalSearchResults(
    searchResults: $ReadOnlyArray<HierarchicalSearchResult<T>>,
  ): number {
    return searchResults.reduce(
      // NOTE(pablo): we add `+ 1` because the result group itself counts
      // as a result to be rendered
      (numResults, { items }) => numResults + items.size() + 1,
      0,
    );
  }

  @autobind
  onScrollToBottom() {
    this.setState((prevState, props) => {
      const { numResultsToShow } = prevState;
      const { searchResults } = props;
      if (this.getTotalSearchResults(searchResults) <= numResultsToShow) {
        // we are already displaying all search results, so do nothing
        return undefined;
      }
      return {
        numResultsToShow: numResultsToShow + RESULTS_INCREMENT,
      };
    });
  }

  renderSearchResults(): React.Node {
    const { onCategoryClick, onItemClick, matcher, searchResults } = this.props;
    const { numResultsToShow } = this.state;

    // we should only render results up to `numResultsToShow`
    // the rest will only become visible when we scroll to the end
    const processedResults = [];
    let currNumResults = 0;

    // we use a for loop instead of forEach just so we can break out
    // of the loop early if necessary
    for (let i = 0; i < searchResults.length; i++) {
      const { key, path, items } = searchResults[i];
      if (currNumResults >= numResultsToShow) {
        break;
      }

      // NOTE(pablo): we add `+ 1` because the result group itself counts
      // as a result to be rendered
      const numItems = items.size() + 1;
      const itemsToAdd =
        currNumResults + numItems >= numResultsToShow
          ? items.slice(0, numResultsToShow - currNumResults)
          : items;
      currNumResults += itemsToAdd.size() + 1;
      processedResults.push(
        <ResultGroup
          expandOnMount
          key={key}
          matcher={matcher}
          path={path}
          items={itemsToAdd}
          onItemClick={onItemClick}
          onCategoryClick={onCategoryClick}
        />,
      );
    }

    return processedResults;
  }

  renderNoSearchResults(): React.Node {
    return (
      <div className="hierarchical-search-no-results">{TEXT.noResults}</div>
    );
  }

  render(): React.Node {
    const { height, maxHeight, searchResults } = this.props;
    const content =
      searchResults.length > 0
        ? this.renderSearchResults()
        : this.renderNoSearchResults();

    return (
      <ColumnWrapper
        height={height}
        maxHeight={maxHeight}
        onScrollToBottom={this.onScrollToBottom}
      >
        {content}
      </ColumnWrapper>
    );
  }
}
