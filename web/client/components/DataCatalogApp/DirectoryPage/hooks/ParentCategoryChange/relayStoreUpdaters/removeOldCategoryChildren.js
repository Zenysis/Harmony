// @flow
import type { RecordSourceSelectorProxy } from 'relay-runtime';

// Update the relay in-memory store and remove the child IDs from the original
// category node.
export default function removeOldCategoryChildren(
  store: RecordSourceSelectorProxy,
  originalCategoryId: string,
  childIds: $ReadOnlyArray<string>,
) {
  // Find the category object in the cache.
  const originalParent = store.get(originalCategoryId);

  // NOTE(stephen): This should not normally happen, but we need to be really
  // safe when updating the store.
  if (!originalParent) {
    return;
  }

  const originalChildren = originalParent.getLinkedRecords('children');
  if (!originalChildren || originalChildren.length === 0) {
    return;
  }

  const updatedChildren = originalChildren.filter(
    record => !record || !childIds.includes(record.getDataID()),
  );

  if (updatedChildren.length !== originalChildren.length) {
    originalParent.setLinkedRecords(updatedChildren, 'children');
  }
}
