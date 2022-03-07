// @flow
import * as Zen from 'lib/Zen';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';
import QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import type { GroupingItem } from 'models/core/wip/GroupingItem/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  groupings: Zen.Map<QueryResultGrouping>,
};

type SerializedGroupSettings = {
  groupings: { [groupById: string]: Zen.Serialized<QueryResultGrouping>, ... },
};

/**
 * GroupBySettings represents the configuration for how query results are
 * grouped by. For example, queries can be grouped by "RegionName" (a dimension)
 * or by "quarter" (a time granularity). These different groupings have their
 * own labels and display formats (e.g. dates can be displayed as MM/DD/YYYY),
 * and we need a way to keep track of these different configurations through
 * user-editable settings.
 */
class GroupBySettings extends Zen.BaseModel<GroupBySettings, Values>
  implements Serializable<SerializedGroupSettings> {
  /**
   * This is how a GroupBySettings model is created for AQT. In AQT, users
   * explicitly select what groupings they want (dimensions and time
   * granularities). We just have to iterate through those and create a
   * QueryResultGrouping model for each.
   */
  static fromGroupingItems(
    groupingItems: Zen.Array<GroupingItem>,
  ): Zen.Model<GroupBySettings> {
    const groupings = groupingItems.mapValues(
      QueryResultGrouping.fromGroupingItem,
    );

    // if there are no regular dimension groupings, then add a default
    // Nation grouping
    if (!groupingItems.some(g => g instanceof GroupingDimension)) {
      groupings.push(QueryResultGrouping.createNationGrouping());
    }

    // check for potential errors
    if (
      groupingItems.filter(g => g instanceof GroupingGranularity).size() > 1
    ) {
      throw new Error(
        '[GroupBySettings] a QueryResultSpec should not have more than 1 time granularity grouping.',
      );
    }

    return GroupBySettings.create({
      groupings: Zen.Map.fromArray(groupings, 'id'),
    });
  }

  static deserialize(
    values: SerializedGroupSettings,
  ): Zen.Model<GroupBySettings> {
    return GroupBySettings.create({
      groupings: Zen.deserializeToZenMap(QueryResultGrouping, values.groupings),
    });
  }

  /**
   * Test if the only groupings selected are type `DATE`.
   */
  hasOnlyDateGrouping(): boolean {
    const groupingTypes = new Set();
    this._.groupings().forEach(grouping => {
      // HACK(stephen): It is really annoying that a nation grouping always
      // exists in GroupBySettings. It's added by default, and it is never
      // removed. Ignore it here, since when we group by date (i.e. Month), the
      // nation grouping is only used by the frontend (and barely by anyone).
      if (grouping.id() !== 'nation') {
        groupingTypes.add(grouping.type());
      }
    });
    return groupingTypes.size === 1 && groupingTypes.has('DATE');
  }

  settingsForGroup(groupingDimensionId: string): QueryResultGrouping | void {
    return this._.groupings().get(groupingDimensionId, undefined);
  }

  serialize(): SerializedGroupSettings {
    return {
      groupings: Zen.serializeMap(this._.groupings()),
    };
  }
}

export default ((GroupBySettings: $Cast): Class<Zen.Model<GroupBySettings>>);
