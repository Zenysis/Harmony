// @flow
import {
  ENTITY_TYPE_ORDER,
  ENTITY_PK_TYPE,
  ENTITY_PK_OPTION,
} from 'components/visualizations/MapViz/EntityLayer/defaults';
import {
  PRIMARY_COLORS,
  SERIES_COLORS,
} from 'components/QueryResult/graphUtil';
import type {
  EntityNode,
  GroupedEntityMap,
} from 'models/visualizations/MapViz/types';

type EntityFeature = {
  geometry: mixed,
  properties: { +[string]: string, ... },
  type: 'Feature',
};

// Parse the individual features to build a tree of entity types.
// NOTE(stephen): This should ideally be provided, not derived from the geojson
// feature collection.
export default function buildEntityTree(
  features: $ReadOnlyArray<EntityFeature>,
): { groups: GroupedEntityMap, root: EntityNode } {
  const root = {
    children: {},
    color: 'black',
    id: 'root',
    name: 'root',
    // NOTE(stephen): Only the root node should have an undefined parent.
    parent: undefined,
    type: 'root',
  };
  const groups = {};
  features.forEach(({ properties }) => {
    let parent = root;
    let entityId = '';
    ENTITY_TYPE_ORDER.forEach(entityType => {
      const entity = properties[entityType];
      entityId = entityId.length === 0 ? entity : `${entityId}--${entity}`;
      if (parent.children[entity] === undefined) {
        // NOTE(stephen): Color will be assigned at the end after each level
        // is sorted. This way, a stable color selection can be assigned that is
        // less dependent on processing order.
        parent.children[entity] = {
          parent,
          children: {},
          color: 'black',
          id: entityId,
          name: entity,
          type: entityType,
        };

        if (groups[entityType] === undefined) {
          groups[entityType] = [];
        }
        groups[entityType].push(parent.children[entity]);
      }
      parent = parent.children[entity];
    });
  });

  // NOTE(stephen): Excluding NACOSA preferred blue color and the bright yellow
  // color.
  // HACK(nina): Don't lie stephen this is fully a hack. Adding in PK-specific
  // requests.
  const entityLegendColors = SERIES_COLORS.filter(
    c => c !== PRIMARY_COLORS.ZA_BLUE && c !== PRIMARY_COLORS.BRIGHT_YELLOW,
  );
  // Sort the grouped entities to ensure they are displayed in a stable order.
  // Assign colors after sorting to ensure stable ordering of colors assigned.
  // NOTE(stephen): We want to assign colors by level. This helps ensure the
  // colors selected are divergent enough to be visibly distinct. If we assign
  // colors in a depth-first way (previous implementation) then the variability
  // at each level is not as strong.
  ENTITY_TYPE_ORDER.forEach(entityType => {
    const cachedColors = {};
    let colorSeq = 0;
    groups[entityType]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(entity => {
        let color = cachedColors[entity.name];

        // HACK(nina): BAD HACK!!! PK wants red for deaths.
        if (
          PK_ACTIVE &&
          entityType === ENTITY_PK_TYPE &&
          entity.name === ENTITY_PK_OPTION
        ) {
          color = PRIMARY_COLORS.RED;
        }

        // HACK(stephen): It is possible for multiple different parents to have
        // the same child name. This is really annoying, since it means that the
        // legend will have different colors for what should be the same value.
        // For now, just ensure that entities that have the same name receive
        // the same color.
        if (color === undefined) {
          color = entityLegendColors[colorSeq % entityLegendColors.length];
          colorSeq += 1;
          cachedColors[entity.name] = color;
        }

        // eslint-disable-next-line no-param-reassign
        entity.color = color;
      });
  });
  return { groups, root };
}
