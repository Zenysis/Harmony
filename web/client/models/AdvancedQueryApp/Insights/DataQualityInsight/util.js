// @flow
import { getDQLURL } from 'components/DataQualityApp/util';
import { onLinkClicked } from 'components/Navbar/util';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';
import type { TabName } from 'components/DataQualityApp/util';

export function openDQLTabUrl(
  fieldId: string,
  tabName: TabName,
  filters: $ReadOnlyArray<QueryFilterItem>,
): void {
  const url = getDQLURL(fieldId, tabName, filters);
  onLinkClicked(url, {}, true);
}
