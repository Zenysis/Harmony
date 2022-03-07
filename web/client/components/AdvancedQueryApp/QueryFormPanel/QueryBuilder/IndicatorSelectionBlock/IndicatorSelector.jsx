// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import FieldMetadataService from 'services/wip/FieldMetadataService';
import HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import QueryPartSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/QueryPartSelector';
import type Field from 'models/core/wip/Field';
import type LinkedCategory from 'models/core/wip/LinkedCategory';
import type { CustomQueryPartSelectorProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.IndicatorSelectionBlock.IndicatorSelector',
);

type Props = {
  ...CustomQueryPartSelectorProps<Field>,
  hierarchyRoot: HierarchyItem<Field | LinkedCategory>,
  trackItemSelected: (HierarchyItem<Field>) => void,
};

function columnTitleGenerator(
  hierarchyItem: HierarchyItem<Field | LinkedCategory>,
): string {
  return hierarchyItem.isHierarchyRoot() ? TEXT.columnTitle : '';
}

function logMenuOpen() {
  analytics.track('Open Hierarchical Selector ', {
    querySection: 'Indicator Selector',
  });
}

function IndicatorSelector({
  hierarchyRoot,
  onItemSelect,
  trackItemSelected,
}: Props) {
  const onIndicatorItemSelect = React.useCallback(
    (selectedItem: HierarchyItem<Field | LinkedCategory>) => {
      const field = selectedItem.metadata();
      invariant(
        field.tag === 'FIELD',
        'Leaf hierarchy items can only hold Field models',
      );
      const fieldItem = Zen.cast<HierarchyItem<Field>>(selectedItem);
      onItemSelect(fieldItem);
      trackItemSelected(fieldItem);

      // TODO(nina): Does not track whether selection was made in search results
      // or via hierarchical selector
      FieldMetadataService.get(field.originalId()).then(fieldMetadata => {
        if (fieldMetadata) {
          analytics.track('Select AQT Field', {
            selectedField: field.name(),
            selectedDataSource: fieldMetadata.source().name(),
          });
        }
      });
    },
    [onItemSelect, trackItemSelected],
  );

  return (
    <QueryPartSelector
      enableSearch
      onItemSelect={onIndicatorItemSelect}
      onMenuOpen={logMenuOpen}
      hierarchyRoot={hierarchyRoot}
      columnTitleGenerator={columnTitleGenerator}
    />
  );
}

export default (React.memo(IndicatorSelector): React.AbstractComponent<Props>);
