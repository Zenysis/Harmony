// @flow
import * as React from 'react';

import AddEntityDropdown from 'components/visualizations/MapViz/EntityLayer/EntitySelectionPanel/AddEntityDropdown';
import Checkbox from 'components/ui/Checkbox';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import LabelWrapper from 'components/ui/LabelWrapper';
import OverlayOptionButton from 'components/visualizations/MapViz/common/OverlayOptionButton';
import type EntityLayerProperties from 'models/visualizations/MapViz/EntityLayerProperties';
import type {
  EntityNode,
  GroupedEntityMap,
} from 'models/visualizations/MapViz/types';

type Props = {
  // This is easier than creating a function specifically
  // for the hacked controls we need to change
  controls: EntityLayerProperties,

  /** Whether the entities that are selected should be shown on the map. */
  enableEntityDisplay: boolean,

  /** All selected entity values grouped by entity type. */
  entitySelections: GroupedEntityMap,

  /**
   * A tree representing all possible entity types to select, grouped by entity
   * type.
   */
  groupedEntityTree: GroupedEntityMap,

  /** Update the selected entity values after a user action. */
  onEntitySelectionsChange: GroupedEntityMap => void,

  /** Update the selected entity type to display. */
  onEntityTypeChange: string => void,

  // This is easier than creating a function specifically
  // for the hacked controls we need to change
  onSettingsChange: EntityLayerProperties => void,

  /** Toggle whether all selected entities should be shown on the map. */
  onToggleEntityDisplay: boolean => void,

  /** The current entity type being displayed */
  selectedEntityType: string,
};

const TEXT = t('visualizations.MapViz.EntityLayer.EntitySelectionPanel');

/**
 * The EntitySelectionPanel is an on-map control that allows a user to control
 * the currently displayed list of entities.
 */
function EntitySelectionPanel({
  controls,
  enableEntityDisplay,
  entitySelections,
  groupedEntityTree,
  onEntitySelectionsChange,
  onEntityTypeChange,
  onSettingsChange,
  onToggleEntityDisplay,
  selectedEntityType,
}: Props) {
  const onSelectedEntitiesChange = React.useCallback(
    (newSelectedValues: $ReadOnlyArray<EntityNode>, entityType: string) => {
      onEntitySelectionsChange({
        ...entitySelections,
        [entityType]: newSelectedValues,
      });
    },
    [entitySelections, onEntitySelectionsChange],
  );

  const entityDropdowns = [];
  const entityTypeOptions = [];
  Object.keys(groupedEntityTree).forEach(entityType => {
    entityDropdowns.push(
      <AddEntityDropdown
        entities={groupedEntityTree[entityType]}
        entityType={entityType}
        key={entityType}
        onSelectedValuesChange={onSelectedEntitiesChange}
        selectedValues={entitySelections[entityType]}
      />,
    );
    entityTypeOptions.push(
      <Dropdown.Option key={entityType} value={entityType}>
        {entityType}
      </Dropdown.Option>,
    );
  });

  return (
    <OverlayOptionButton
      buttonClassName="entity-selection-panel__map-button"
      buttonIconType="option-horizontal"
      buttonTooltipText={TEXT.buttonTooltip}
    >
      <div className="entity-selection-panel">
        <div className="entity-selection-panel__item">
          <LabelWrapper boldLabel label={TEXT.addEntities}>
            <Group.Vertical>{entityDropdowns}</Group.Vertical>
          </LabelWrapper>
        </div>
        <div className="entity-selection-panel__item">
          <LabelWrapper boldLabel label={TEXT.selectDisplayType}>
            <Dropdown
              defaultDisplayContent={selectedEntityType}
              value={selectedEntityType}
              buttonWidth="100%"
              menuWidth="100%"
              onSelectionChange={onEntityTypeChange}
            >
              {entityTypeOptions}
            </Dropdown>
          </LabelWrapper>
        </div>
        <div className="entity-selection-panel__item">
          <Checkbox
            label={TEXT.showEntities}
            onChange={onToggleEntityDisplay}
            value={enableEntityDisplay}
          />
        </div>
      </div>
    </OverlayOptionButton>
  );
}

export default (React.memo(
  EntitySelectionPanel,
): React.AbstractComponent<Props>);
