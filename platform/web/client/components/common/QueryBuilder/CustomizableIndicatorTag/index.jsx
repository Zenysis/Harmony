// @flow
import * as React from 'react';

import CustomizableTag from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/SelectionBlock/CustomizableTag';
import I18N from 'lib/I18N';
import IndicatorCustomizationModule from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule';
import IndicatorSelector from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder/IndicatorSelectionBlock/IndicatorSelector';
import type Field from 'models/core/wip/Field';
import type { IconType } from 'components/ui/Icon/types';

// The customization module component passed in much match this shape.
type CustomizationModuleProps = React.ElementConfig<
  typeof IndicatorCustomizationModule,
>;

type Props = {
  className?: string,
  customizationModuleComponent?: React.ComponentType<CustomizationModuleProps>,
  customizationModuleParentElt?: string,

  /** An array of all dimensions this indicator is allowed to be filtered by */
  dimensions: $PropertyType<CustomizationModuleProps, 'dimensions'>,

  /**
   * Mapping from Dimension ID -> dimensionValues for that ID. This is needed to
   * power indicator-level filters.
   */
  dimensionValueMap: $PropertyType<
    CustomizationModuleProps,
    'dimensionValueMap',
  >,

  /**
   * The root of the field hierarchy tree. This is needed to power
   * hierarchical selector.
   */
  fieldHierarchyRoot: $PropertyType<
    React.ElementConfig<typeof IndicatorSelector>,
    'hierarchyRoot',
  >,

  /**
   * The root of the filter hierarchy tree. This is needed to power
   * indicator-level filters.
   */
  filterHierarchyRoot: $PropertyType<
    CustomizationModuleProps,
    'filterHierarchyRoot',
  >,

  /** The field represented by this tag */
  item: Field,

  /**
   * Callback for when the user wants a field's constituents to be added to the
   * query.
   */
  onAddConstituents: $PropertyType<
    CustomizationModuleProps,
    'onAddConstituents',
  >,

  /** Callback for when the user wants the field to be duplicated */
  onDuplicateField: (fieldId: string) => void,

  /** Callback for when this field is customized */
  onItemCustomized: (newItem: Field) => void,

  /** Callback for when this tag is removed */
  onRemoveTagClick: (item: Field) => void,

  /** Callback for when the customization module is closed */
  onRequestCloseCustomizationModule: () => void,

  /** Callback for when the tag is clicked */
  onTagClick: (item: Field) => void,
  showCustomizationModule: boolean,
  trackItemSelected: $PropertyType<
    React.ElementConfig<typeof IndicatorCustomizationModule>,
    'trackItemSelected',
  >,
};

// Certain calculation types should use a different drag icon to make it easier
// for the user to see what calculation type that indicator is using.
const FIELD_TAG_ICONS = {
  default: undefined,
};

function getDragIcon(item: Field): IconType | void {
  return FIELD_TAG_ICONS.default;
}

function CustomizableIndicatorTag({
  dimensionValueMap,
  dimensions,
  fieldHierarchyRoot,
  filterHierarchyRoot,
  item,
  onAddConstituents,
  onDuplicateField,
  onItemCustomized,
  onRequestCloseCustomizationModule,
  onRemoveTagClick,
  onTagClick,
  showCustomizationModule,
  trackItemSelected,
  className = '',
  customizationModuleComponent = IndicatorCustomizationModule,
  customizationModuleParentElt = undefined,
}: Props): React.Node {
  const CustomizationModule = customizationModuleComponent;
  const renderCustomizationModule = React.useCallback(
    () => (
      <CustomizationModule
        dimensions={dimensions}
        dimensionValueMap={dimensionValueMap}
        field={item}
        fieldHierarchyRoot={fieldHierarchyRoot}
        filterHierarchyRoot={filterHierarchyRoot}
        onAddConstituents={onAddConstituents}
        onCloseCustomizationModule={onRequestCloseCustomizationModule}
        onDuplicateField={onDuplicateField}
        onFieldCustomized={onItemCustomized}
        trackItemSelected={trackItemSelected}
      />
    ),
    [
      CustomizationModule,
      dimensionValueMap,
      dimensions,
      fieldHierarchyRoot,
      filterHierarchyRoot,
      item,
      onAddConstituents,
      onDuplicateField,
      onItemCustomized,
      onRequestCloseCustomizationModule,
    ],
  );

  // NOTE: Need to set a smaller z-index for the indicator tag since
  // certain customization modules (like cohort calculation) will spawn a modal
  // that needs to be drawn *on top* of the customization module. However, it
  // still needs to be high enough to be drawn on top of the navbar.
  return (
    <CustomizableTag
      className={className}
      customizationModuleARIAName={I18N.text('Customize indicator')}
      customizationModuleParentElt={customizationModuleParentElt}
      customizationModuleZIndex={6000}
      dragIconType={getDragIcon(item)}
      item={item}
      onCloseCustomizationModuleClick={onRequestCloseCustomizationModule}
      onRemoveTagClick={onRemoveTagClick}
      onTagClick={onTagClick}
      renderCustomizationModule={renderCustomizationModule}
      showCustomizationModule={showCustomizationModule}
      tagName={item.label()}
    />
  );
}

export default (React.memo(
  CustomizableIndicatorTag,
): React.AbstractComponent<Props>);
