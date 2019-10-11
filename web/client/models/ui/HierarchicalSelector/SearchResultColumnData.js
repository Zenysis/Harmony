// @flow
import PropTypes from 'prop-types';

import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import HierarchySearchResults from 'models/ui/HierarchicalSelector/HierarchySearchResults';
import ZenModel, { def } from 'util/ZenModel';
import memoizeOne from 'decorators/memoizeOne';
import { uniqueId } from 'util/util';

const SEARCH_COLUMN_ID = '__search-column__';

// TODO(pablo): evaluate if this really has to be a ZenModel?
export default class SearchResultColumnData extends ZenModel.withTypes({
  /** The HierarchyItem under which we searched for results */
  parentItem: def(HierarchyItem.type().isRequired),

  /** All search results to show in the column */
  searchResults: def(HierarchySearchResults.type().isRequired),

  id: def(PropTypes.string, undefined, ZenModel.PRIVATE),
}) {
  // TODO(pablo): eventually this should be unnecessary when we make ZenModel
  // track its own internal id, and update it whenever it's modified
  @memoizeOne
  _getId() {
    return `${SEARCH_COLUMN_ID}${uniqueId()}`;
  }
}
