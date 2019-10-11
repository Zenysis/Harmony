// @flow
import type QueryResultSpec from 'models/core/QueryResultSpec';

/**
 * The QueryEngine provides a common interface for running a new query. The
 * query Selections type is generic to allow multiple different query selection
 * representations to be used by classes interacting with QueryEngine.
 */
export interface QueryEngine<Selections, SerializedQueryResult> {
  run(
    querySelections: Selections,
    queryResultSpec: QueryResultSpec,
  ): Promise<SerializedQueryResult>;
}
