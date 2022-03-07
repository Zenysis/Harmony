// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import EditableCategoryValue from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/CategoryRow/EditableCategoryValue';
import FieldDetailsListItem from 'components/DataCatalogApp/FieldDetailsPage/FieldDetailsSection/FieldDetailsListItem';
import useFilterHierarchy from 'components/DataCatalogApp/common/hooks/useFilterHierarchy';
import useParentCategoryChangeForFieldMutation from 'components/DataCatalogApp/DirectoryPage/hooks/ParentCategoryChange/useParentCategoryChangeForFieldMutation';
import type { CategoryRow_categoryConnection$key } from './__generated__/CategoryRow_categoryConnection.graphql';
import type { CategoryRow_field$key } from './__generated__/CategoryRow_field.graphql';
import type { CategoryRow_fieldConnection$key } from './__generated__/CategoryRow_fieldConnection.graphql';

type Props = {
  categoryConnection: CategoryRow_categoryConnection$key,
  field: CategoryRow_field$key,
  fieldConnection: CategoryRow_fieldConnection$key,
};

const TEXT = {
  title: 'Location',
};

export default function CategoryRow({
  categoryConnection,
  field,
  fieldConnection,
}: Props): React.Node {
  const data = useFragment(
    graphql`
      fragment CategoryRow_field on field {
        id
        ...EditableCategoryValue_field
      }
    `,
    field,
  );

  const categories = useFragment(
    graphql`
      fragment CategoryRow_categoryConnection on categoryConnection {
        ...useFilterHierarchy_categoryConnection
      }
    `,
    categoryConnection,
  );

  const fields = useFragment(
    graphql`
      fragment CategoryRow_fieldConnection on fieldConnection {
        ...useFilterHierarchy_fieldConnection
      }
    `,
    fieldConnection,
  );

  const commit = useParentCategoryChangeForFieldMutation();

  const [hierarchyRoot] = useFilterHierarchy(categories, fields);

  const onCategoriesChange = React.useCallback(
    newCategoryMapping => {
      // NOTE(stephen): I don't actually know what happens if you call `commit` in
      // a loop. I don't have a test case right now...
      // TODO(stephen): Investigate a batch mutation instead of using a loop.
      // Right now it is not a big deal because fields only have one parent. In
      // the future, this will not be true.
      // eslint-disable-next-line no-restricted-syntax
      for (const mapping of newCategoryMapping) {
        const [originalParentCategoryId, newParentCategoryId] = mapping;
        commit({
          variables: {
            fieldId: data.id,
            newParentCategoryId,
            originalParentCategoryId,
          },
        });
        analytics.track('Edit row in indicator details page', {
          row: 'category',
        });
      }
    },
    [commit, data],
  );

  return (
    <FieldDetailsListItem title={TEXT.title}>
      <EditableCategoryValue
        fragmentRef={data}
        hierarchyRoot={hierarchyRoot}
        onCategoriesChange={onCategoriesChange}
      />
    </FieldDetailsListItem>
  );
}
