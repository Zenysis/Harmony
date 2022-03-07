// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QueryResultSpec from 'models/core/QueryResultSpec';
import QuerySelections from 'models/core/wip/QuerySelections';
import { DEFAULT_VISUALIZATION_TYPE } from 'models/AdvancedQueryApp/VisualizationType/registry';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { Serializable } from 'lib/Zen';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

type SessionSourceMap = {
  SHARED: 'SHARED',
  NEW: 'NEW',
};

export type SessionSourceType = $Keys<SessionSourceMap>;

export const SESSION_SOURCES: SessionSourceMap = {
  SHARED: 'SHARED',
  NEW: 'NEW',
};

type Values = {
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  sourceType: SessionSourceType,
  username: string,
  /** We store viewType (and visualizationType) because we users can now
   * navigate to SQT or AQT using a generated share link. In order to load
   * the query, we need access to the viewType (for SQT) or visualizationType
   * (for AQT) to display the relevant visualization.
   */
  viewType: ResultViewType,
};

type DefaultValues = {
  sourceType: SessionSourceType,
  visualizationType: VisualizationType,
};

/**
 * Type for sending a query to the backend.
 */
type SerializedQuerySession = {
  queryBlob: {
    queryResultSpec: Zen.Serialized<QueryResultSpec> | void,
    querySelections: Zen.Serialized<QuerySelections>,
    sourceType: SessionSourceType,
    viewType: ResultViewType,
    visualizationType: VisualizationType | void,
  },
  username: string,
};

class QuerySession extends Zen.BaseModel<QuerySession, Values, DefaultValues>
  implements Serializable<SerializedQuerySession> {
  static defaultValues: DefaultValues = {
    sourceType: SESSION_SOURCES.SHARED,
    visualizationType: DEFAULT_VISUALIZATION_TYPE,
  };

  static deserializeAsync({
    queryBlob,
    username,
  }: SerializedQuerySession): Promise<Zen.Model<QuerySession>> {
    const {
      queryResultSpec,
      querySelections,
      sourceType,
      viewType,
      visualizationType,
    } = queryBlob;
    const deserializedQueryResultSpec = queryResultSpec
      ? QueryResultSpec.deserialize(queryResultSpec)
      : undefined;
    return Promise.resolve(
      QuerySelections.deserializeAsync(querySelections),
    ).then(deserializedQuerySelections =>
      QuerySession.create({
        username,
        sourceType,
        viewType,
        visualizationType,
        queryResultSpec: deserializedQueryResultSpec,
        querySelections: deserializedQuerySelections,
      }),
    );
  }

  serialize(): SerializedQuerySession {
    const queryResultSpec = this._.queryResultSpec();
    const serializedQueryResultSpec = queryResultSpec
      ? queryResultSpec.serialize()
      : undefined;
    return {
      queryBlob: {
        queryResultSpec: serializedQueryResultSpec,
        querySelections: this._.querySelections().serialize(),
        sourceType: this._.sourceType(),
        viewType: this._.viewType(),
        visualizationType: this._.visualizationType(),
      },
      username: this._.username(),
    };
  }
}

export default ((QuerySession: $Cast): Class<Zen.Model<QuerySession>>);
