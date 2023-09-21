// @flow
import * as React from 'react';
import { useLazyLoadQuery } from 'react-relay/hooks';

import FieldCustomizationModule from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/FieldCustomizationModule';
import QueryBuilderPanel from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/QueryBuilderPanel';
import useDimensionList from 'components/DataCatalogApp/common/hooks/aqt/useDimensionList';
import useDimensionValueMap from 'components/common/QueryBuilder/FilterSelector/useDimensionValueMap';
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

  // Maintain displayedDimensionSet to pass as QueryBuilderPanel.supportedGroupingDimensions prop.
  // displayedDimensionSet has the same contents as supportedDimensions, but while the
  // object reference for supportedDimensions changes every time that querySelections
  // changes, the displayedDimensionSet ref only changes when the actual dimension values
  // contained in fieldToSupportedDimensionsMap change.
  const [displayedDimensionSet, setDisplayedDimensionSet] = React.useState([]);
  React.useEffect(() => {
    const sameDimensionsInSet =
      displayedDimensionSet.length === supportedDimensions.length &&
      displayedDimensionSet.every(
        (element, index) => element === supportedDimensions[index],
      );
    if (!sameDimensionsInSet) {
      setDisplayedDimensionSet(supportedDimensions);
    }
  }, [displayedDimensionSet, supportedDimensions]);

  return (
    <QueryBuilderPanel
      dimensions={dimensions}
      dimensionValueMap={dimensionValueMap}
      fieldCustomizationModuleComponent={FieldCustomizationModule}
      fieldHierarchyRoot={fieldHierarchyRoot}
      filterHierarchyRoot={filterHierarchyRoot}
      groupingHierarchyRoot={groupingHierarchyRoot}
      onQuerySelectionsChange={onQuerySelectionsChange}
      querySelections={querySelections}
      supportedGroupingDimensions={displayedDimensionSet}
      trackFieldSelected={trackFieldSelected}
    />
  );
}

export default (React.memo(QueryBuilder): React.AbstractComponent<Props>);
