// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import LabelWrapper from 'components/ui/LabelWrapper';
import type { EntityNode } from 'models/visualizations/MapViz/types';

type Props = {
  /** All entity values for this entity type. */
  entities: $ReadOnlyArray<EntityNode>,

  /** The entity type for this dropdown */
  entityType: string,

  /** Parent function to call after setting value state */
  onSelectedValuesChange: (
    newSelectedValues: $ReadOnlyArray<EntityNode>,
    entityType: string,
  ) => void,

  /** Selected values from this dropdown */
  selectedValues: $ReadOnlyArray<EntityNode>,
};

// HACK(stephen): There is no guarantee that each level of the Entity hierarchy
// will have unique values. Unfortunately, this makes our logic a lot more
// complicated, since we need there to be a separate node for each path in the
// tree, even though specific names might collide. An example showing
// Type of Facility -> SubType -> Service Type -> Service Offered
//            Primary School               Primary Education
//         /                  \          /
// Schools                      Education
//         \                  /          \
//           Secondary School              Secondary Education
// Multiple SubTypes can have the same Service Type. However, we cannot
// represent this ServiceType as a single node in the tree since the unique
// Service Offered needs to point to a Service Type that can then lead to the
// correct SubType parent. If the `Education` Service Type was represented by a
// single node, then if the user filtered only for `Primary School` then both
// `Primary Education` and `Secondary Education` might be incorrectly enabled.
function buildUniqueEntitiesWorkaround(
  entities: $ReadOnlyArray<EntityNode>,
  selectedValues: $ReadOnlyArray<EntityNode>,
): {
  // Mapping from unique EntityNode that is displayed to the additional
  // EntityNodes that should be included when the unique node is selected.
  nonUniqueMap: $ReadOnlyMap<EntityNode, $ReadOnlyArray<EntityNode>>,

  // List of unique EntityNodes to display as options.
  uniqueEntities: $ReadOnlyArray<EntityNode>,

  // List of unique EntityNodes that should be marked as selected.
  visibleSelectedValues: $ReadOnlyArray<EntityNode>,
} {
  const nonUniqueMap = new Map();
  const nameToEntity = {};
  const uniqueEntities = [];
  const visibleSelectedValues = new Set(selectedValues);
  entities.forEach(entity => {
    // If this entity name has already been seen before, add it to the
    // non-unique map instead of displaying it as a separate option.
    const collision = nameToEntity[entity.name];
    if (collision !== undefined) {
      visibleSelectedValues.delete(entity);

      // NOTE(stephen): It is annoying that Flow cannot refine a `.has` call.
      // Instead, we have to `get` and then optionally `set`.
      const additionalEntities = nonUniqueMap.get(collision) || [];
      additionalEntities.push(entity);
      nonUniqueMap.set(collision, additionalEntities);
    } else {
      // Otherwise, if this name is unique, we add it to the visible list.
      nameToEntity[entity.name] = entity;
      uniqueEntities.push(entity);
    }
  });

  return {
    nonUniqueMap,
    uniqueEntities,
    visibleSelectedValues: Array.from(visibleSelectedValues),
  };
}

function AddEntityDropdown({
  entities,
  entityType,
  onSelectedValuesChange,
  selectedValues,
}: Props) {
  const {
    nonUniqueMap,
    uniqueEntities,
    visibleSelectedValues,
  } = React.useMemo(
    () => buildUniqueEntitiesWorkaround(entities, selectedValues),
    [entities, selectedValues],
  );

  const onSelectionChange = React.useCallback(
    newValues => {
      const fullNewValues = [];
      newValues.forEach(entity => {
        fullNewValues.push(entity);
        fullNewValues.push(...(nonUniqueMap.get(entity) || []));
      });
      onSelectedValuesChange(fullNewValues, entityType);
    },
    [entityType, onSelectedValuesChange, nonUniqueMap],
  );

  const options = uniqueEntities.map(entity => (
    <Dropdown.Option key={entity.id} value={entity}>
      {entity.name}
    </Dropdown.Option>
  ));
  return (
    <LabelWrapper boldLabel label={entityType}>
      <Dropdown.Multiselect
        defaultDisplayContent={t(
          'query_result.map.entity_layer_panel.no_selections',
        )}
        value={visibleSelectedValues}
        buttonWidth="100%"
        menuWidth="100%"
        onSelectionChange={onSelectionChange}
        enableSelectAll
      >
        {options}
      </Dropdown.Multiselect>
    </LabelWrapper>
  );
}

export default (React.memo(AddEntityDropdown): React.AbstractComponent<Props>);
