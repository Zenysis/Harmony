// @flow
import * as React from 'react';

import useBoolean from 'lib/hooks/useBoolean';

/**
 * Custom hook used in the admin app to track unsaved changes in the
 * GroupViewModal, RoleViewModal, UserViewModals.
 * @param {boolean} isDataLoaded Whether the state variables have been initialized
 * so that we can begin tracking unsaved changes.
 * @param {$ReadOnlyArray<mixed>} markAsUnsavedWhen A list of dependencies that
 * determine when to set unsaved changes to true.
 * @param {$ReadOnlyArray<mixed>} markAsSavedWhen A list of dependencies that
 * determine when to set unsaved changes to false.
 * @returns {[boolean, () => void]} The unsavedChanges value, detailing if there
 * are unsaved changes and a function setUnsavedChangesFalse that updates this
 * value to false
 */
export default function useSavedChangesTracker({
  isDataLoaded,
  markAsUnsavedWhen,
  markAsSavedWhen,
}: {
  isDataLoaded: boolean,
  markAsUnsavedWhen: $ReadOnlyArray<mixed>,
  markAsSavedWhen: $ReadOnlyArray<mixed>,
}): [boolean, () => void] {
  const [
    unsavedChanges,
    setUnsavedChangesTrue,
    setUnsavedChangesFalse,
  ] = useBoolean(false);
  React.useEffect(() => {
    if (isDataLoaded) {
      setUnsavedChangesTrue();
    }
    // NOTE(yitian): Disabling the two lines below because the linter is
    // warning that it can't verify the correct dependencies with a spread
    // operator. The dependencies used in the hook are always present so it's
    // safe to disable this warning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...markAsUnsavedWhen, isDataLoaded, setUnsavedChangesTrue]);

  React.useEffect(() => {
    if (isDataLoaded) {
      setUnsavedChangesFalse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...markAsSavedWhen, isDataLoaded, setUnsavedChangesFalse]);

  return [unsavedChanges, setUnsavedChangesFalse];
}
