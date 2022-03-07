// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import CustomizableIndicatorTag from 'components/common/QueryBuilder/CustomizableIndicatorTag';
import IndicatorSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/IndicatorSelectionBlock/IndicatorSelector';
import SelectionBlock from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type Field from 'models/core/wip/Field';
import type {
  CustomQueryPartSelectorProps,
  SelectionProps,
} from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock';
import type { CustomizableTagProps } from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/ExpandableTagList';

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.IndicatorSelectionBlock',
);

type Props = {
  ...SelectionProps<Field>,
  dimensionValueMap: $PropertyType<
    React.ElementConfig<typeof CustomizableIndicatorTag>,
    'dimensionValueMap',
  >,
  dimensions: $PropertyType<
    React.ElementConfig<typeof CustomizableIndicatorTag>,
    'dimensions',
  >,
  filterHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof CustomizableIndicatorTag>,
    'filterHierarchyRoot',
  >,
  hierarchyRoot: $PropertyType<
    React.ElementConfig<typeof IndicatorSelector>,
    'hierarchyRoot',
  >,
  trackItemSelected: $PropertyType<
    React.ElementConfig<typeof IndicatorSelector>,
    'trackItemSelected',
  >,
  customizationModuleComponent?: $PropertyType<
    React.ElementConfig<typeof CustomizableIndicatorTag>,
    'customizationModuleComponent',
  >,
};

function logFieldRemoval(item: Field) {
  analytics.track('Remove AQT Field', {
    selectedField: item.name(),
  });
}

// When the user requests a field to be duplicated, clone the current field
// they are inspecting and insert the duplicated field immediately after it.
function duplicateField(
  fieldId: string,
  selectedFields: Zen.Array<Field>,
): Zen.Array<Field> {
  const fieldIdx = selectedFields.findIndex(field => field.id() === fieldId);
  if (fieldIdx === -1) {
    return selectedFields;
  }

  const fieldToDuplicate = selectedFields.get(fieldIdx);
  const newField = fieldToDuplicate
    .userDefinedLabel(`Copy of ${fieldToDuplicate.label()}`)
    .customize();
  return selectedFields.insertAt(fieldIdx + 1, newField);
}

function IndicatorSelectionBlock({
  dimensionValueMap,
  dimensions,
  filterHierarchyRoot,
  hierarchyRoot,
  onSelectedItemsChanged,
  selectedItems,
  trackItemSelected,

  customizationModuleComponent = undefined,
}: Props) {
  const onDuplicateField = React.useCallback(
    fieldId => onSelectedItemsChanged(duplicateField(fieldId, selectedItems)),
    [onSelectedItemsChanged, selectedItems],
  );

  const onAddConstituents = React.useCallback(
    (fieldId, constituents) => {
      const field = selectedItems.find(item => item.id() === fieldId);
      if (field !== undefined && constituents.length > 0) {
        // We call customize() on each constituent indicator in order to
        // give it a unique ID before adding it to our list of selected
        // items. This is most useful when users add the same indicator
        // multiple times.
        onSelectedItemsChanged(
          selectedItems.concat(constituents.map(c => c.customize())),
        );
      }
    },
    [onSelectedItemsChanged, selectedItems],
  );

  const renderCustomizableTag = React.useCallback(
    (props: CustomizableTagProps<Field>) => (
      <CustomizableIndicatorTag
        className="aqt-customizable-indicator-tag"
        customizationModuleComponent={customizationModuleComponent}
        // NOTE(david): In the dashboard app QueryEditView, we render the query
        // tool in a fullscreen modal. This causes the customizationModule to be
        // hidden as we deliberately set a z-index on it of less than our modals
        // in order to show other modals on top of it. To avoid this issue, we
        // set a popover parentElt of the app root.
        customizationModuleParentElt="advanced-query-app"
        dimensionValueMap={dimensionValueMap}
        dimensions={dimensions}
        fieldHierarchyRoot={hierarchyRoot}
        filterHierarchyRoot={filterHierarchyRoot}
        onAddConstituents={onAddConstituents}
        onDuplicateField={onDuplicateField}
        trackItemSelected={trackItemSelected}
        {...props}
      />
    ),
    [
      customizationModuleComponent,
      dimensionValueMap,
      dimensions,
      filterHierarchyRoot,
      hierarchyRoot,
      onAddConstituents,
      onDuplicateField,
    ],
  );

  const renderQueryPartSelector = React.useCallback(
    (props: CustomQueryPartSelectorProps<Field>) => (
      <IndicatorSelector
        hierarchyRoot={hierarchyRoot}
        trackItemSelected={trackItemSelected}
        {...props}
      />
    ),
    [hierarchyRoot, trackItemSelected],
  );

  return (
    <SelectionBlock
      title={TEXT.title}
      helpText={TEXT.helpText}
      onRemoveTag={logFieldRemoval}
      onSelectedItemsChanged={onSelectedItemsChanged}
      renderCustomizableTag={renderCustomizableTag}
      renderCustomQueryPartSelector={renderQueryPartSelector}
      selectedItems={selectedItems}
    />
  );
}

export default (React.memo(
  IndicatorSelectionBlock,
): React.AbstractComponent<Props>);
