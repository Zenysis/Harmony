// @flow
import type { RecordSourceSelectorProxy } from 'relay-runtime';

import removeOldMappingLinks from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/relayStoreUpdaters/removeOldMappingLinks';

// Update the relay in-memory store and remove the old field category mappings
// between the original category and the fields provided.
export default function removeOldFieldCategoryMappingLinks(
  store: RecordSourceSelectorProxy,
  originalCategoryId: string,
  fieldIds: $ReadOnlyArray<string>,
) {
  removeOldMappingLinks(
    store,
    originalCategoryId,
    fieldIds,
    'field_category_mappings',
    'field',
  );
}
