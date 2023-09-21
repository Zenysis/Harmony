// @flow
import type Promise from 'bluebird';

import type QuerySelections from 'models/core/wip/QuerySelections';

/**
 * The QueryEngine provides a common interface for running a new query.
 */
export interface QueryEngine<SerializedQueryResult> {
  run(querySelections: QuerySelections): Promise<SerializedQueryResult>;
}
