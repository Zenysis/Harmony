// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import FieldSetupPageHeaderActions from 'components/FieldSetupApp/FieldSetupPageHeaderActions';
import I18N from 'lib/I18N';
import TableHeader from 'components/FieldSetupApp/UnpublishedFieldsTable/TableHeader';
import UnpublishedFieldTableRows from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows';
import useFilterHierarchy from 'components/DataCatalogApp/common/hooks/useFilterHierarchy';
import useHorizontalScrollbar from 'components/EntityMatchingApp/RecordsTable/RecordsTableRows/useHorizontalScrollbar';
import type { UnpublishedFieldsTableContainerQuery } from './__generated__/UnpublishedFieldsTableContainerQuery.graphql';

type Props = {};

const POLICY = { fetchPolicy: 'store-or-network' };

// Build the state of the checkbox based on how many rows are selected and how
// many rows can possibly be selected.
function buildSelectionState(
  totalSelected: number,
  totalRows: number,
): 'checked' | 'indeterminate' | 'unchecked' {
  if (totalSelected === 0) {
    return 'unchecked';
  }

  return totalSelected === totalRows ? 'checked' : 'indeterminate';
}

const EMPTY_SET: $ReadOnlySet<string> = new Set();

// Unpublished fields table container that wraps the header actions and the
// table.
function UnpublishedFieldsTableContainer(): React.Element<'div'> {
  /* eslint-disable */
  const data = useLazyLoadQuery<UnpublishedFieldsTableContainerQuery>(
    graphql`
      query UnpublishedFieldsTableContainerQuery {
        categoryConnection: category_connection {
          ...useFilterHierarchy_categoryConnection
        }
        fieldConnection: field_connection {
          ...useFilterHierarchy_fieldConnection
        }
        pipelineDatasourceConnection: pipeline_datasource_connection {
          ...FieldSetupPageHeaderActions_pipelineDatasourceConnection
          ...UnpublishedFieldTableRows_pipelineDatasourceConnection
        }
        unpublishedFieldConnection: unpublished_field_connection {
          edges {
            node {
              id
            }
          }
        }
      }
    `,
    {},
    POLICY,
  );

  const [selectedFieldIds, setSelectedFieldIds] = React.useState(EMPTY_SET);

  const {
    categoryConnection,
    fieldConnection,
    pipelineDatasourceConnection,
    unpublishedFieldConnection,
  } = data;

  const [hierarchyRoot] = useFilterHierarchy(
    categoryConnection,
    fieldConnection,
  );

  const [searchText, setSearchText] = React.useState<string>('');

  // NOTE(yitian): We have to manually keep the header scrolling inline with the
  // main table section as the headers have to be part of a separate div with
  // the table header actions (which do not scroll) so they can be stuck to the
  // top of the page together.
  const headerRowRef = React.useRef(null);

  const [
    horizontalScrollPosition,
    setHorizontalScrollPosition,
  ] = React.useState<number>(0);

  React.useLayoutEffect(() => {
    if (headerRowRef && headerRowRef.current) {
      headerRowRef.current.scrollLeft = horizontalScrollPosition;
    }
  }, [horizontalScrollPosition]);

  const [
    mainContentScrollRef,
    ,
    onTableHorizontallScroll,
    ,
  ] = useHorizontalScrollbar(
    horizontalScrollPosition,
    setHorizontalScrollPosition,
  );

  const unpublishedFieldEdges = unpublishedFieldConnection.edges;

  const allFieldIds: $ReadOnlySet<string> = React.useMemo(
    () => new Set(unpublishedFieldEdges.map(({ node }) => node.id)),
    [unpublishedFieldEdges],
  );

  const selectionState = buildSelectionState(
    selectedFieldIds.size,
    allFieldIds.size,
  );

  const onSelectAllToggle = React.useCallback(() => {
    // If we are in the `unchecked` or `indeterminate` states when the user
    // clicks, we need to select all rows.
    if (selectionState === 'unchecked' || selectionState === 'indeterminate') {
      setSelectedFieldIds(allFieldIds);
    } else {
      setSelectedFieldIds(EMPTY_SET);
    }
  }, [allFieldIds, selectionState]);

  const allResults = (
    <I18N numFields={`${allFieldIds.size}`}>%(numFields)s indicators</I18N>
  );

  const numSelected = (
    <I18N numFields={`${selectedFieldIds.size}`}>%(numFields)s selected |</I18N>
  );

  // TODO(yitian): create a fallback component for the UnpublishedFieldTableRows
  return (
    <div className="fs-unpublished-fields-table-container">
      <div className="fs-unpublished-fields-table-container__header-bar">
        <div className="fs-unpublished-fields-table-container__subheader">
          {selectedFieldIds.size > 0 ? numSelected : allResults}
          <FieldSetupPageHeaderActions
            hierarchyRoot={hierarchyRoot}
            onSearchTextChange={setSearchText}
            pipelineDatasourceConnectionRef={pipelineDatasourceConnection}
            searchText={searchText}
            selectedFieldIds={selectedFieldIds}
          />
        </div>
        <div
          className="fs-unpublished-fields-table-container__table-header-wrapper"
          ref={headerRowRef}
        >
          <TableHeader
            onSelectAllToggle={onSelectAllToggle}
            selectionState={selectionState}
          />
        </div>
      </div>
      <div
        className="fs-unpublished-fields-table-wrapper"
        onScroll={onTableHorizontallScroll}
        ref={mainContentScrollRef}
      >
        <React.Suspense fallback="loading...">
          <UnpublishedFieldTableRows
            hierarchyRoot={hierarchyRoot}
            onSelectedFieldsChange={setSelectedFieldIds}
            pipelineDatasourceConnectionRef={pipelineDatasourceConnection}
            searchText={searchText}
            selectedFieldIds={selectedFieldIds}
          />
        </React.Suspense>
      </div>
    </div>
  );
}

export default (React.memo(
  UnpublishedFieldsTableContainer,
): React.AbstractComponent<Props>);
