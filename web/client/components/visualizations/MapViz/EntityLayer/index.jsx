// @flow
import * as React from 'react';
import type Promise from 'bluebird';

import EntityLayerLegend from 'components/visualizations/MapViz/EntityLayer/EntityLayerLegend';
import EntityMarkerLabelLayer from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLabelLayer';
import EntityMarkerLayer from 'components/visualizations/MapViz/EntityLayer/EntityMarkerLayer';
import EntityMarkerPopup from 'components/visualizations/MapViz/EntityLayer/EntityMarkerPopup';
import EntitySelectionPanel from 'components/visualizations/MapViz/EntityLayer/EntitySelectionPanel';
import buildEntityTree from 'components/visualizations/MapViz/EntityLayer/buildEntityTree';
import fetchEntityFeatures from 'components/visualizations/MapViz/EntityLayer/fetchEntityFeatures';
import {
  ENTITY_TYPE_ORDER,
  ENTITY_LABEL_LAYER_ID,
  ENTITY_LABEL_KEY,
} from 'components/visualizations/MapViz/EntityLayer/defaults';
import { autobind, memoizeOne } from 'decorators';
import { cancelPromise } from 'util/promiseUtil';
import type EntityLayerProperties from 'models/visualizations/MapViz/EntityLayerProperties';
import type MapSettings from 'models/visualizations/MapViz/MapSettings';
import type {
  EventFeature,
  Feature,
} from 'components/ui/visualizations/MapCore/types';
import type { GroupedEntityMap } from 'models/visualizations/MapViz/types';
import type { SerializedEntityProperties } from 'components/visualizations/MapViz/EntityLayer/types';

type DefaultProps = {
  enabled: boolean,

  globalFilter: $ReadOnlyArray<mixed> | void,
  legendPlacement: 'bottom-right' | 'bottom-left' | 'bottom-left-offset',
};

type Props = {
  ...DefaultProps,
  /** The feature from this layer on the map the user has clicked. */
  activeFeature: EventFeature<SerializedEntityProperties> | void,
  controls: EntityLayerProperties,
  id: string,
  mapControls: MapSettings,
  onRequestPopupClose: (SyntheticMouseEvent<HTMLElement> | Event) => void,
  onSettingsChange: EntityLayerProperties => void,
  onToggleEntityDisplay: boolean => void,
};

type State = {
  /** List of features */
  entityFeatures: $ReadOnlyArray<Feature>,
  /** All possible selections, grouped */
  groupedEntityTree: GroupedEntityMap,
};

/**
 * The EntityLayer component is used for drawing real-world locations on a map.
 * These locations are categorized with different "entities" (like location
 * type, location subtype, service offered, etc.). Each location can also have
 * additional metadata fields that describe that location (like address, owner,
 * etc.). These metadata fields will be displayed when the user interacts with
 * an entity through a popup.
 *
 * NOTE(stephen): The primary usage of the EntityLayer is with KVAP related
 * projects for mapping service locations in this program (like schools, health
 * facilities, and safe spaces).
 */
export default class EntityLayer extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    enabled: false,
    globalFilter: undefined,
    legendPlacement: 'bottom-left',
  };

  _entityDataRequest: Promise<void>;

  state: State = {
    entityFeatures: [],
    groupedEntityTree: {},
  };

  componentDidMount() {
    this._entityDataRequest = fetchEntityFeatures().then(features => {
      // Initialize the groups that are possible to select and the groups that
      // are currently selected.
      // TODO(stephen): Fix this cast.
      const { groups } = buildEntityTree((features: $Cast));
      this.setState({
        entityFeatures: features,
        groupedEntityTree: groups,
      });
    });
  }

  componentWillUnmount() {
    if (this._entityDataRequest !== undefined) {
      cancelPromise(this._entityDataRequest);
    }
  }

  /**
   * Filter the selected entities down into a list of entities that can actually
   * be displayed based on the selected entities at *every level*. The entity
   * IDs returned are the leaf node's IDs.
   */
  @memoizeOne
  buildVisibleEntityIds(
    entitySelections: GroupedEntityMap,
  ): $ReadOnlyArray<string> {
    const visibleEntityIds = [];
    const visibleParentIds = new Set();
    const leafIdx = ENTITY_TYPE_ORDER.length - 1;
    ENTITY_TYPE_ORDER.forEach((entityType, idx) => {
      const selectedEntities = entitySelections[entityType];
      if (selectedEntities === undefined) {
        return;
      }

      selectedEntities.forEach(entity => {
        const { parent } = entity;
        // NOTE(stephen): This should only happen for the root node.
        if (parent === undefined) {
          return;
        }

        if (idx === 0) {
          visibleParentIds.add(parent.id);
        }

        // If the parent is enabled, then this node can also be marked as
        // enabled.
        if (visibleParentIds.has(parent.id)) {
          if (idx === leafIdx) {
            visibleEntityIds.push(entity.id);
          } else {
            visibleParentIds.add(entity.id);
          }
        }
      });
    });
    return visibleEntityIds;
  }

  getVisibleEntityIds(): $ReadOnlyArray<string> {
    return this.buildVisibleEntityIds(this.getFullSelections());
  }

  /**
   * Convert the stored list of entities into a version we can use to populate
   * this layer. We do this because the stored selections are sparse,
   * only storing selections if NOT all values have been selected. This is
   * the final step in deserializing persisted selections, so we also need to
   * make sure that we're not accidentally persisting selections that no
   * longer exist.
   */
  @memoizeOne
  buildFullSelections(
    storedEntitySelections: { +[EntityType: string]: $ReadOnlyArray<string> },
    groupedEntityTree: GroupedEntityMap,
  ): GroupedEntityMap {
    const fullEntitySelections = {};

    // All dimensions have 'select all' configuration
    if (Object.keys(storedEntitySelections).length === 0) {
      return groupedEntityTree;
    }

    Object.keys(groupedEntityTree).forEach((entityType: string) => {
      const storedFeatureIds = storedEntitySelections[entityType];
      const entityNodes = [...groupedEntityTree[entityType]];
      // Check for 'select all' configuration for this dimension
      if (storedFeatureIds === undefined) {
        fullEntitySelections[entityType] = entityNodes;
      } else {
        // Filtering allows us to remove selections that are no longer valid
        const deserializedFeatures = storedFeatureIds
          .map(id => entityNodes.find(node => node.id === id))
          .filter(node => node !== undefined);
        fullEntitySelections[entityType] = deserializedFeatures;
      }
    });

    return fullEntitySelections;
  }

  getFullSelections(): GroupedEntityMap {
    return this.buildFullSelections(
      this.props.controls.entitySelections(),
      this.state.groupedEntityTree,
    );
  }

  getSelectedEntityType(): string {
    return this.props.controls.selectedEntityType() || ENTITY_TYPE_ORDER[0];
  }

  @autobind
  onEntitySelectionsChange(entitySelections: GroupedEntityMap) {
    const { controls, onSettingsChange } = this.props;
    const { groupedEntityTree } = this.state;
    const newSelections = {};

    Object.keys(groupedEntityTree).forEach(entityType => {
      // Check if all values in this category have been selected. If so, then
      // we DON'T add the category to the stored selections in order to represent
      // the 'select all' state of this category. We only add the category if
      // some of the values have been selected.
      if (
        entitySelections[entityType].length <
        groupedEntityTree[entityType].length
      ) {
        newSelections[entityType] = entitySelections[entityType].map(
          node => node.id,
        );
      }
    });

    onSettingsChange(controls.entitySelections(newSelections));
  }

  @autobind
  onEntityTypeChange(selectedEntityType: string) {
    const { controls, onSettingsChange } = this.props;
    onSettingsChange(controls.selectedEntityType(selectedEntityType));
  }

  maybeRenderPopup(): React.Node {
    const { activeFeature, onRequestPopupClose } = this.props;
    if (activeFeature === undefined) {
      return null;
    }

    return (
      <EntityMarkerPopup
        feature={activeFeature}
        onRequestClose={onRequestPopupClose}
      />
    );
  }

  maybeRenderSelectionPanel(): React.Node {
    const {
      controls,
      enabled,
      onSettingsChange,
      onToggleEntityDisplay,
    } = this.props;
    const { groupedEntityTree, entityFeatures } = this.state;

    const selectedEntityType = this.getSelectedEntityType();

    if (entityFeatures.length === 0) {
      return null;
    }

    return (
      <EntitySelectionPanel
        controls={controls}
        enableEntityDisplay={enabled}
        entitySelections={this.getFullSelections()}
        groupedEntityTree={groupedEntityTree}
        onEntitySelectionsChange={this.onEntitySelectionsChange}
        onEntityTypeChange={this.onEntityTypeChange}
        onToggleEntityDisplay={onToggleEntityDisplay}
        onSettingsChange={onSettingsChange}
        selectedEntityType={selectedEntityType}
      />
    );
  }

  maybeRenderMarkerLabelLayer(): React.Node {
    const { enabled, mapControls } = this.props;
    const { entityFeatures } = this.state;

    if (
      !mapControls.showLabels() ||
      !enabled ||
      entityFeatures.length === 0 ||
      ENTITY_LABEL_KEY === ''
    ) {
      return null;
    }

    return (
      <EntityMarkerLabelLayer
        backgroundColor={mapControls.tooltipBackgroundColor()}
        entityFeatures={entityFeatures}
        fontColor={mapControls.tooltipFontColor()}
        fontFamily={mapControls.tooltipFontFamily()}
        fontSize={Number.parseInt(mapControls.tooltipFontSize(), 10)}
        fontStyle={mapControls.tooltipBold() ? 'bold' : 'regular'}
        id={ENTITY_LABEL_LAYER_ID}
        visibleEntityIds={this.getVisibleEntityIds()}
      />
    );
  }

  maybeRenderMarkerLayer(): React.Node {
    const { enabled, globalFilter, id, mapControls } = this.props;
    const { entityFeatures } = this.state;

    if (!enabled || entityFeatures.length === 0) {
      return null;
    }

    const entitySelections = this.getFullSelections();
    const selectedEntityType = this.getSelectedEntityType();

    // Not the most efficient way to calculate the layer id, but we need to
    // factor in the fact that not all deployments WANT to label their entities.
    // This is determined by checking if ENTITY_LABEL_KEY is an empty string
    const beforeLayerId =
      mapControls.showLabels() && ENTITY_LABEL_KEY !== ''
        ? ENTITY_LABEL_LAYER_ID
        : undefined;

    return (
      <EntityMarkerLayer
        beforeLayerId={beforeLayerId}
        entityFeatures={entityFeatures}
        entityLevel={selectedEntityType}
        entityNodesForLevel={entitySelections[selectedEntityType]}
        filter={globalFilter}
        id={id}
        visibleEntityIds={this.getVisibleEntityIds()}
        selectedEntityType={selectedEntityType}
      />
    );
  }

  maybeRenderLegend(): React.Node {
    const { controls, enabled, legendPlacement } = this.props;
    const { entityFeatures } = this.state;

    if (!enabled || entityFeatures.length === 0) {
      return null;
    }

    return (
      <EntityLayerLegend
        controls={controls}
        entitySelections={this.getFullSelections()}
        legendPlacement={legendPlacement}
        selectedEntityType={this.getSelectedEntityType()}
      />
    );
  }

  renderOverlays(): React.Node {
    return (
      <div className="entity-layer__overlays">
        {this.maybeRenderLegend()}
        {this.maybeRenderSelectionPanel()}
      </div>
    );
  }

  render(): React.Node {
    const { controls, globalFilter } = this.props;
    return (
      <React.Fragment>
        {this.maybeRenderMarkerLabelLayer()}
        {this.maybeRenderMarkerLayer()}
        {this.maybeRenderPopup()}
        {this.renderOverlays()}
      </React.Fragment>
    );
  }
}
