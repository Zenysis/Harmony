// @flow
import type { RecordSourceSelectorProxy } from 'relay-runtime';

// Update the relay in-memory store and remove links between the original parent
// item and the provided child items.
// NOTE(stephen): Right now, this method requires tha the original parent item
// have a single mapping field inside it that leads to the child field.
// Example: parent { parent_to_child_mapping { child { id } } }
// NOTE(stephen): You should not call this method if your mutation has remapped
// the child item to the *same parent*. This method cannot know whether that has
// happened.
export default function removeOldMappingLinks(
  store: RecordSourceSelectorProxy,
  originalParentId: string,
  childIds: $ReadOnlyArray<string>,
  mappingFieldName: string,
  childFieldName: string,
) {
  // Find the category object in the cache.
  const originalParent = store.get(originalParentId);

  // NOTE(stephen): This should not normally happen, but we need to be really
  // safe when updating the store.
  if (!originalParent) {
    return;
  }

  // These are the fields that are currently linked to the original item before
  // the mutation was applied.
  const originalMappingRecords = originalParent.getLinkedRecords(
    mappingFieldName,
  );
  if (!originalMappingRecords || originalMappingRecords.length === 0) {
    return;
  }

  // Build a list of mapping records that should still be linked to the original
  // parent item. This will be the original set *excluding* the field specified.
  const updatedMappingRecords = originalMappingRecords.filter(record => {
    // NOTE(stephen): Allowing null/undefined records to be preserved since this
    // is how some of the internal relay update methods work.
    if (!record) {
      return true;
    }

    // The record we are iterating over is a `mappingFieldName` type. We need to
    // extract the `childFieldName` specified inside that mapping.
    const linkedField = record.getLinkedRecord(childFieldName);

    // If the linked field ID is not in the list of child IDs to remove, then it
    // will be preserved inside the current mapping.
    // NOTE(stephen): Same comment as preserving null/undefined records as
    // above.
    return !linkedField || !childIds.includes(linkedField.getDataID());
  });

  // Update the original parent item's child mapping with the filtered set built
  // above. This will remove the selected items from being linked to that
  // parent via the mapping.
  if (updatedMappingRecords.length !== originalMappingRecords.length) {
    originalParent.setLinkedRecords(updatedMappingRecords, mappingFieldName);
  }
}
