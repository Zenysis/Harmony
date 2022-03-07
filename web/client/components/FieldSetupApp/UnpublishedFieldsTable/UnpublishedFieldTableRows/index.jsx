// @flow
import * as React from 'react';
import {
  useFragment,
  useLazyLoadQuery,
  usePaginationFragment,
  useSubscribeToInvalidationState,
} from 'react-relay/hooks';

import EmptyTableBanner from 'components/common/EmptyTableBanner';
import I18N from 'lib/I18N';
import UnpublishedFieldRow from 'components/FieldSetupApp/UnpublishedFieldsTable/UnpublishedFieldTableRows/UnpublishedFieldRow';
import type { UnpublishedFieldTableRowsQuery } from './__generated__/UnpublishedFieldTableRowsQuery.graphql';
import type { UnpublishedFieldTableRows_pipelineDatasourceConnection$key } from './__generated__/UnpublishedFieldTableRows_pipelineDatasourceConnection.graphql';
import type { UnpublishedFieldTableRows_unpublishedField$key } from './__generated__/UnpublishedFieldTableRows_unpublishedField.graphql';

type Props = {
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof UnpublishedFieldRow>,
    'hierarchyRoot',
  >,
  onSelectedFieldsChange: ($ReadOnlySet<string>) => void,
  pipelineDatasourceConnectionRef: UnpublishedFieldTableRows_pipelineDatasourceConnection$key,
  searchText: string,
  selectedFieldIds: $ReadOnlySet<string>,
};

const PAGE_SIZE = 50;
const POLICY = { fetchPolicy: 'store-or-network' };

function UnpublishedFieldTableRows({
  hierarchyRoot,
  onSelectedFieldsChange,
  pipelineDatasourceConnectionRef,
  searchText,
  selectedFieldIds,
}: Props): React.Element<'div'> {
  // Format search text to a string that supports the graphql 'ilike' expression.
  const formattedSearchText = React.useMemo(() => `%${searchText}%`, [
    searchText,
  ]);
  const queryData = useLazyLoadQuery<UnpublishedFieldTableRowsQuery>(
    graphql`
      query UnpublishedFieldTableRowsQuery(
        $pageSize: Int!
        $searchText: String!
      ) {
        ...UnpublishedFieldTableRows_unpublishedField
          @arguments(first: $pageSize, searchText: $searchText)
      }
    `,
    { pageSize: PAGE_SIZE, searchText: formattedSearchText },
    POLICY,
  );

  const datasources = useFragment(
    graphql`
      fragment UnpublishedFieldTableRows_pipelineDatasourceConnection on pipeline_datasourceConnection {
        ...UnpublishedFieldRow_pipelineDatasourceConnection
      }
    `,
    pipelineDatasourceConnectionRef,
  );

  // Fragment is defined separate from the query so that we can use
  // usePaginationFragment. We are also performing a case insensitive search
  // across field properties that contains the searchText string.
  const {
    data,
    hasNext,
    isLoadingNext,
    loadNext,
    refetch,
  } = usePaginationFragment<
    UnpublishedFieldTableRowsQuery,
    UnpublishedFieldTableRows_unpublishedField$key,
  >(
    graphql`
      fragment UnpublishedFieldTableRows_unpublishedField on query_root
        @argumentDefinitions(
          after: { type: "String", defaultValue: null }
          first: { type: "Int!" }
          searchText: { type: "String!" }
        )
        @refetchable(queryName: "UnpublishedFieldTableRowsPaginationQuery") {
        unpublishedFieldConnection: unpublished_field_connection(
          where: {
            _or: [
              { id: { _ilike: $searchText } }
              { name: { _ilike: $searchText } }
              { short_name: { _ilike: $searchText } }
              { description: { _ilike: $searchText } }
              {
                unpublished_field_category_mappings: {
                  category: { name: { _ilike: $searchText } }
                }
              }
              {
                unpublished_field_pipeline_datasource_mappings: {
                  pipeline_datasource: { name: { _ilike: $searchText } }
                }
              }
            ]
          }
          first: $first
          after: $after
        )
          @connection(
            key: "UnpublishedFieldTableRows_unpublishedFieldConnection"
          ) {
          edges {
            node {
              id
              ...UnpublishedFieldRow_unpublishedField
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    queryData,
  );

  const { unpublishedFieldConnection } = data;

  const unpublishedFieldConnectionEdges = unpublishedFieldConnection.edges;

  const unpublishedFieldIds = React.useMemo(
    () => unpublishedFieldConnectionEdges.map(({ node }) => node.id),
    [unpublishedFieldConnectionEdges],
  );

  // Refetch query whenever we detect an update from one of the unpublished
  // fields.
  useSubscribeToInvalidationState(unpublishedFieldIds, () => {
    refetch({});
  });

  const maybeLoadMoreFields = React.useCallback(() => {
    const scrolledtoBottom =
      document.body !== null &&
      window.innerHeight + window.scrollY + 100 >= document.body.scrollHeight;
    if (scrolledtoBottom && hasNext && !isLoadingNext) {
      loadNext(PAGE_SIZE);
    }
  }, [hasNext, isLoadingNext, loadNext]);

  React.useEffect(() => {
    window.addEventListener('scroll', maybeLoadMoreFields);
    return () => window.removeEventListener('scroll', maybeLoadMoreFields);
  }, [maybeLoadMoreFields]);

  const totalRows = unpublishedFieldConnectionEdges.length;

  return (
    <div className="fs-unpublished-fields-table-rows" role="table">
      {data.unpublishedFieldConnection.edges.map(({ node }) => (
        <UnpublishedFieldRow
          key={node.id}
          hierarchyRoot={hierarchyRoot}
          onSelectedFieldsChange={onSelectedFieldsChange}
          pipelineDatasourceConnection={datasources}
          selectedFieldIds={selectedFieldIds}
          unpublishedFieldRef={node}
        />
      ))}
      <EmptyTableBanner
        show={totalRows === 0}
        subTitle={I18N.text('There are no indicators to triage')}
        title={I18N.text('No indicators found')}
      />
    </div>
  );
}

export default (React.memo(
  UnpublishedFieldTableRows,
): React.AbstractComponent<Props>);
