// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import FieldCustomizationModule from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FieldCustomizationModule';
import QueryBuilderPanel from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/QueryBuilderPanel';
import useDimensionList from 'components/DataCatalogApp/common/hooks/aqt/useDimensionList';
import useDimensionValueMap from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useDimensionValueMap';
import useFieldHierarchy from 'components/DataCatalogApp/common/hooks/aqt/useFieldHierarchy';
import useFilterHierarchy from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FilterSelectionBlock/useFilterHierarchy';
import useGroupingHierarchy from 'components/DataCatalogApp/common/hooks/aqt/useGroupingHierarchy';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type {
  QueryBuilderQuery,
  QueryBuilderQueryResponse,
} from './__generated__/QueryBuilderQuery.graphql';

type Props = {
  onQuerySelectionsChange: QuerySelections => void,
  querySelections: QuerySelections,
};

// This is an optimized QueryBuilder tailored for DataCatalog models and query
// patterns. It does not use any of the potion services, and it uses fragments
// and graphql queries heavily. This is a much better experience for a site
// where DataCatalog is enabled compared to the default experience that uses
// patched services. This optimization does come at a small cost, though, in
// that we have to duplicate some code from the regular QueryBuilder.
function QueryBuilder({ onQuerySelectionsChange, querySelections }: Props) {
  const data: QueryBuilderQueryResponse = useLazyLoadQuery<QueryBuilderQuery>(
    graphql`
      query QueryBuilderQuery {
        dimensionConnection: dimension_connection {
          ...useGroupingHierarchy_dimensionConnection
        }
        fieldConnection: field_connection {
          ...useFieldHierarchy_fieldConnection
        }
        categoryConnection: category_connection {
          ...useFieldHierarchy_categoryConnection
        }
        dimensionConnection: dimension_connection {
          ...useDimensionList_dimensionConnection
        }
      }
    `,
    {},
  );

  const [
    fieldHierarchyRoot,
    trackFieldSelected,
    fieldToSupportedDimensionsMap,
  ] = useFieldHierarchy(data.categoryConnection, data.fieldConnection);
  const groupingHierarchyRoot = useGroupingHierarchy(data.dimensionConnection);
  const filterHierarchyRoot = useFilterHierarchy();
  const dimensionValueMap = useDimensionValueMap();

  const dimensions = useDimensionList(data.dimensionConnection);

  // Build an array of dimension IDs that can support the selected indicators.
  const supportedDimensions = React.useMemo(() => {
    const dimensionIds = new Set();
    querySelections.fields().forEach(field => {
      const supportedDimensionsForField =
        fieldToSupportedDimensionsMap[field.originalId()] || [];

      supportedDimensionsForField.forEach(d => dimensionIds.add(d));
    });

    return [...dimensionIds];
  }, [fieldToSupportedDimensionsMap, querySelections]);

  return (
    <QueryBuilderPanel
      dimensionValueMap={dimensionValueMap}
      dimensions={dimensions}
      fieldCustomizationModuleComponent={FieldCustomizationModule}
      fieldHierarchyRoot={fieldHierarchyRoot}
      filterHierarchyRoot={filterHierarchyRoot}
      groupingHierarchyRoot={groupingHierarchyRoot}
      onQuerySelectionsChange={onQuerySelectionsChange}
      querySelections={querySelections}
      supportedGroupingDimensions={supportedDimensions}
      trackFieldSelected={trackFieldSelected}
    />
  );
}

export default (React.memo(QueryBuilder): React.AbstractComponent<Props>);
