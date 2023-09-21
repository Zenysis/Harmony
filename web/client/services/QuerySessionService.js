// @flow
import Promise from 'bluebird';

import APIService, { API_VERSION } from 'services/APIService';
import QuerySession, {
  SESSION_SOURCES,
} from 'models/AdvancedQueryApp/QuerySession';
import autobind from 'decorators/autobind';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { HTTPService } from 'services/APIService';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { SessionSourceType } from 'models/AdvancedQueryApp/QuerySession';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

class QuerySessionService {
  _httpService: HTTPService;

  constructor(httpService: HTTPService) {
    this._httpService = httpService;
  }

  /**
   * Given a query hash, get its associated query data if it exists.
   */
  @autobind
  getQuerySession(queryHash: string): Promise<QuerySession> {
    return new Promise((resolve, reject) => {
      this._httpService
        .get(API_VERSION.V2, `user_query_session/${queryHash}/by_query_uuid`)
        .then(serializedQuerySession =>
          QuerySession.deserializeAsync(serializedQuerySession)
            .then(querySession => resolve(querySession))
            .catch(error => reject(error)),
        )
        .catch(error => reject(error));
    });
  }

  /**
   * Post query session data to server to store it, get associated hash.
   * @returns {Promise<string>} Promise returning associated query hash
   */
  @autobind
  storeQuerySession(
    queryResultSpec: QueryResultSpec | void,
    querySelections: QuerySelections,
    viewType: ResultViewType,
    visualizationType: VisualizationType,
    userId: string,
    sourceType?: SessionSourceType = SESSION_SOURCES.SHARED,
  ): Promise<string> {
    const maybeSerializedQueryResultSpec = queryResultSpec
      ? queryResultSpec.serialize()
      : undefined;
    const querySession = {
      userId,
      queryBlob: {
        sourceType,
        viewType,
        visualizationType,
        queryResultSpec: maybeSerializedQueryResultSpec,
        querySelections: querySelections.serialize(),
      },
    };

    return new Promise((resolve, reject) => {
      this._httpService
        .post(API_VERSION.V2, 'user_query_session/generate_link', querySession)
        .then(sessionHash => resolve(sessionHash))
        .catch(error => reject(error));
    });
  }
}

export default (new QuerySessionService(APIService): QuerySessionService);
