// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import type { Serializable } from 'lib/Zen';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type Values = {
  /**
   * The QueryResultSpec contains all the settings needed to show a
   * visualization result.
   */
  queryResultSpec: QueryResultSpec,

  /**
   * The QuerySelections contains the entire query definition for the tile.
   */
  querySelections: QuerySelections,

  /**
   * The visualization type to show on the tile.
   */
  visualizationType: VisualizationType,
};

type SerializedDashboardQueryItem = {
  queryResultSpec: Zen.Serialized<QueryResultSpec>,
  querySelections: Zen.Serialized<QuerySelections>,
  type: 'QUERY_ITEM',
  visualizationType: VisualizationType,
};

/**
 * The DashboardQueryItem represents an entire query + settings exported from
 * the query tool.
 */
class DashboardQueryItem extends Zen.BaseModel<DashboardQueryItem, Values>
  implements Serializable<SerializedDashboardQueryItem> {
  +tag: 'QUERY_ITEM' = 'QUERY_ITEM';
  static deserializeAsync(
    serializedDashboardQueryItem: SerializedDashboardQueryItem,
  ): Promise<Zen.Model<DashboardQueryItem>> {
    const {
      queryResultSpec: serializedQueryResultSpec,
      querySelections: serializedQuerySelections,
      visualizationType,
    } = serializedDashboardQueryItem;

    return QuerySelections.deserializeAsync(serializedQuerySelections).then(
      querySelections =>
        DashboardQueryItem.create({
          querySelections,
          queryResultSpec: QueryResultSpec.deserialize(
            serializedQueryResultSpec,
          ),
          visualizationType,
        }),
    );
  }

  serialize(): SerializedDashboardQueryItem {
    const {
      queryResultSpec,
      querySelections,
      visualizationType,
    } = this.modelValues();

    return {
      queryResultSpec: queryResultSpec.serialize(),
      querySelections: querySelections.serialize(),
      type: this.tag,
      visualizationType,
    };
  }
}

export default ((DashboardQueryItem: $Cast): Class<
  Zen.Model<DashboardQueryItem>,
>);
