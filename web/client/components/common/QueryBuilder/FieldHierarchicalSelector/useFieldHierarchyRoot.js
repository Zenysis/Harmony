// @flow
import { useLazyLoadQuery } from 'react-relay/hooks';

import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import useFieldHierarchy from 'components/DataCatalogApp/common/hooks/aqt/useFieldHierarchy';
import type Field from 'models/core/wip/Field';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type {
  useFieldHierarchyRootQuery,
  useFieldHierarchyRootQueryResponse,
} from './__generated__/useFieldHierarchyRootQuery.graphql';

export default function useFieldHierarchyRoot(): HierarchyItem<
  LinkedCategory | Field,
> {
  const data: useFieldHierarchyRootQueryResponse = useLazyLoadQuery<useFieldHierarchyRootQuery>(
    graphql`
      query useFieldHierarchyRootQuery {
        fieldConnection: field_connection {
          ...useFieldHierarchy_fieldConnection
        }
        categoryConnection: category_connection {
          ...useFieldHierarchy_categoryConnection
        }
      }
    `,
    {},
  );
  const [fieldHierarchyRoot] = useFieldHierarchy(
    data.categoryConnection,
    data.fieldConnection,
  );
  return fieldHierarchyRoot;
}
