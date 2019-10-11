// @flow
import PropTypes from 'prop-types';

import GraphSearchResults from 'models/ui/common/GraphSearchResults';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import HierarchyItemGraphNodeView from 'models/ui/HierarchicalSelector/HierarchyItemGraphNodeView';
import ZenModel, { def } from 'util/ZenModel';
import memoizeOne from 'decorators/memoizeOne';
import processGraphSearchResults from 'models/ui/HierarchicalSelector/HierarchySearchResults/processGraphSearchResults';
import type { HierarchicalSearchResult } from 'models/ui/HierarchicalSelector/HierarchySearchResults/processGraphSearchResults';

// TODO(pablo): evaluate if this really has to be a ZenModel?
export default class HierarchySearchResults extends ZenModel.withTypes({
  graphSearchResults: def(PropTypes.instanceOf(GraphSearchResults).isRequired),
  searchRoot: def(HierarchyItem.type().isRequired),
}) {
  static fromSearchText(
    searchText: string,
    searchRoot: HierarchyItem,
  ): HierarchySearchResults {
    const graphSearchResults = GraphSearchResults.fromSearchText(
      HierarchyItemGraphNodeView,
      searchText,
      searchRoot.children(),
    );

    return HierarchySearchResults.create({
      graphSearchResults,
      searchRoot,
    });
  }

  @memoizeOne
  resultList(): $ReadOnlyArray<HierarchicalSearchResult> {
    return processGraphSearchResults(
      this.searchRoot(),
      this.graphSearchResults(),
    );
  }
}
