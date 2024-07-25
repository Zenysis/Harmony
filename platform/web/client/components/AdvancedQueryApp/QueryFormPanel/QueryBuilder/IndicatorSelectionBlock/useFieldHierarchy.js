// @flow
import * as React from 'react';
import Promise from 'bluebird';

import DimensionService from 'services/wip/DimensionService';
import FieldHierarchyService from 'services/AdvancedQueryApp/FieldHierarchyService';
import FieldMetadataService from 'services/wip/FieldMetadataService';
import FieldService from 'services/wip/FieldService';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import patchLegacyServices from 'components/DataCatalogApp/common/patchLegacyServices';
import { cancelPromise } from 'util/promiseUtil';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type LinkedCategory from 'models/core/wip/LinkedCategory';

// Patch services to use GraphQL relay queries instead of potions.
patchLegacyServices();

export default function useFieldHierarchy(): [
  HierarchyItem<LinkedCategory | Field>,
  $ReadOnlyArray<Dimension>,
  (HierarchyItem<Field>) => void,
] {
  const [hierarchy, setHierarchy] = React.useState<
    HierarchyItem<LinkedCategory | Field>,
  >(HierarchyItem.createRoot());

  const [dimensions, setDimensions] = React.useState<$ReadOnlyArray<Dimension>>(
    [],
  );

  // Update the most recently used fields section of the hierarchy tree.
  const trackItemSelected = React.useCallback(
    (item: HierarchyItem<Field>) =>
      setHierarchy(FieldHierarchyService.addSelectedItem(item)),
    [],
  );

  React.useEffect(() => {
    const promise = Promise.all([
      FieldService.getAll(),
      FieldService.getMap(),
      FieldMetadataService.getAll(),
    ]).then(([fields, fieldMap, fieldMetadata]) => {
      const fieldCategoryMapping = {};
      fieldMetadata.forEach(metadata => {
        fieldCategoryMapping[metadata.id()] = metadata.category();
      });
      setHierarchy(
        FieldHierarchyService.initializeFieldHierarchy(
          fields,
          fieldMap,
          fieldCategoryMapping,
        ),
      );
    });
    return () => cancelPromise(promise);
  }, []);

  React.useEffect(() => {
    const promise = DimensionService.getAll().then(setDimensions);
    return () => cancelPromise(promise);
  }, []);

  return [hierarchy, dimensions, trackItemSelected];
}
