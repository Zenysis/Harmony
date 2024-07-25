// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import Query from 'components/visualizations/common/Query/Query';
import unsetGroupTotalSetting from 'models/visualizations/common/unsetGroupTotalSetting';
import { API_VERSION } from 'services/APIService';
import type MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';

const ENDPOINT = 'query/map';

class MapQueryEngine
  implements QueryEngine<Zen.Serialized<MapQueryResultData>> {
  run(
    querySelections: QuerySelections,
  ): Promise<Zen.Serialized<MapQueryResultData>> {
    // Dimension and granularity total values are useless for the Map
    // visualization because total values do not have a mappable lat/lon.
    const groups = unsetGroupTotalSetting(querySelections.groups());
    return Query.create(
      ENDPOINT,
      querySelections.groups(groups).serializeForQuery(),
      API_VERSION.V2,
    ).run();
  }
}

export default (new MapQueryEngine(): MapQueryEngine);
