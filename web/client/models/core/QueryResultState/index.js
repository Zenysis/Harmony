// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';

// Callback method type to determine if a new query should be issued based on
// the new query Selections and QueryResultSpec received.
type NewQueryTest = (
  newSelections: QuerySelections,
  newResultSpec: QueryResultSpec,
  prevSelections: QuerySelections | void,
  prevResultSpec: QueryResultSpec | void,
) => boolean;

// Callback method type to determine if post-query transformations should be
// applied based on the new QueryResultSpec received.
type ApplyTransformationsTest = (
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec | void,
) => boolean;

type InternalValues<Model, DeserializableDataModelClass> = {
  +queryEngine: QueryEngine<Zen.Serialized<Model>>,
  +queryResult: Model,
  +QueryResultDataModelClass: DeserializableDataModelClass,
  +queryResultSpec: QueryResultSpec | void,
  +querySelections: QuerySelections | void,
  +shouldRebuildQueryResult: ApplyTransformationsTest,
  +shouldRunNewQuery: NewQueryTest,
};

// QueryResultData cannot have required values at this time. It needs to be
// able to be created with a call to `.create({})`.
type ZenModelNoRequiredValues = Zen.BaseModel<any, {}, any, any>;

/**
 * QueryResultState provides a convenient encapsulation of all operations needed
 * to build and customize a query result based on a given set of query
 * selections and a QueryResultSpec.
 *
 * A QueryResultState instance should be created by providing certain default
 * values:
 * const MyQueryResultState: QueryResultState<
 *   Class<MyQueryResultData>,
 * > = QueryResultState.createInitialState(
 *   MyQueryEngine,
 *   MyQueryResultData,
 *   shouldRebuildQueryResult: () => true,
 *   shouldRunNewQuery: () => true,
 * );
 *
 * Once a QueryResultState instance is created, the instance is ready for
 * querying and customization.
 *
 * To build a new queryResult, call
 * - runQuery(querySelections, queryResultSpec)
 * This method will build and run a new query from the provided arguments and
 * will return a Promise that resolves to a new instance of QueryResultState
 * with the processed result stored.
 *
 * To apply transformations, like filters and custom calculations, on an
 * existing queryResult, call
 * - applyQueryResultTransformations(queryResultSpec)
 * This method will extract the filters, custom calculations, and other
 * post-query transformations from the queryResultSpec, apply them, and return
 * a new QueryResultState instance with the transformed result stored.
 *
 * Calling runQuery and applyQueryResultTransformations can be costly. To
 * reduce this overhead, update detection methods are provided so the caller
 * can choose whether to issue a new query: shouldRunNewQuery and
 * shouldRebuildQueryResult.
 *
 * Standard usage:
 * Start: Create your QueryResultState instance;
 * ----- Check if new query should be issued:
 *       shouldRunNewQuery
 *            |
 *            |- If true, call runQuery and replace the stored instance.
 *            |  Any transformations needed will be applied on the new result.
 * ----- If no new query is required, check if new transformations are needed:
 *       shouldRebuildQueryResult
 *            |
 *            |- If true, call applyQueryResultTransformations and replace the
 *            |  stored instance. Transformations will be applied to the
 *            |  original, non-transformed queryResult.
 *
 */
export default class QueryResultState<
  QueryResultDataModel: ZenModelNoRequiredValues & QueryResultData<$AllowAny>,
  // NOTE(pablo): this type is not filled in by the user, it is computed by
  // default. This is important to keep here because it enforces that the
  // QueryResultDataModel type must be a valid deserializable model
  DeserializableDataModelClass: Zen.DeserializableModel<QueryResultDataModel> = Zen.DeserializableModel<QueryResultDataModel>,
> {
  static createInitialState(
    queryEngine: QueryEngine<Zen.Serialized<QueryResultDataModel>>,
    QueryResultDataModelClass: Zen.DeserializableModel<QueryResultDataModel>,
    shouldRebuildQueryResult: ApplyTransformationsTest,
    shouldRunNewQuery: NewQueryTest,
  ): QueryResultState<QueryResultDataModel> {
    // NOTE(stephen): Need to explicitly specify the type here since Flow is
    // having issues refining the result of `.create`.
    const queryResult: QueryResultDataModel = QueryResultDataModelClass.create(
      {},
    );
    return new QueryResultState({
      QueryResultDataModelClass,
      queryEngine,
      queryResult,
      shouldRebuildQueryResult,
      shouldRunNewQuery,
      queryResultSpec: undefined,
      querySelections: undefined,
    });
  }

  +_values: InternalValues<QueryResultDataModel, DeserializableDataModelClass>;

  +_untransformedQueryResult: QueryResultDataModel;

  constructor(
    values: InternalValues<QueryResultDataModel, DeserializableDataModelClass>,
    untransformedQueryResult?: QueryResultDataModel,
  ) {
    this._values = values;
    this._untransformedQueryResult =
      untransformedQueryResult === undefined
        ? values.queryResult
        : untransformedQueryResult;
  }

  /**
   * Determine if a new query is needed based on changes between the provided
   * Selections and QueryResultSpec and the stored versions that created the
   * current queryResult.
   */
  shouldRunNewQuery(
    newSelections: QuerySelections,
    newResultSpec: QueryResultSpec,
  ): boolean {
    return this._values.shouldRunNewQuery(
      newSelections,
      newResultSpec,
      this._values.querySelections,
      this._values.queryResultSpec,
    );
  }

  /**
   * Determine if the provided QueryResultSpec differs from the stored version
   * and would produce a different queryResult.
   */
  shouldRebuildQueryResult(newResultSpec: QueryResultSpec): boolean {
    return this._values.shouldRebuildQueryResult(
      newResultSpec,
      this._values.queryResultSpec,
    );
  }

  /**
   * Build and run a new query from the provided Selections and QueryResultSpec.
   * Returns a Promise that resolves a new QueryResultState instance with the
   * new queryResult.
   */
  runQuery(
    querySelections: QuerySelections,
    queryResultSpec: QueryResultSpec,
  ): Promise<QueryResultState<QueryResultDataModel>> {
    return this._values.queryEngine
      .run(querySelections)
      .then((rawQueryResult: Zen.Serialized<QueryResultDataModel>) => {
        // If the query failed to return results, clear the current state.
        if (rawQueryResult === undefined) {
          return this.clear();
        }

        // If the query returned valid results, build an updated state that
        // includes the new data.
        return this.reset(
          querySelections,
          queryResultSpec,
          rawQueryResult,
        ).applyQueryResultTransformations(queryResultSpec);
      });
  }

  /**
   * Apply all post-query transformations to the stored queryResult. The
   * transformations are applied on the initial, untransformed queryResult to
   * ensure that any previously applied transformations are dropped.
   */
  applyQueryResultTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<QueryResultState<QueryResultDataModel>> {
    return this._untransformedQueryResult
      .applyTransformations(queryResultSpec)
      .then(
        queryResult =>
          new QueryResultState(
            {
              ...this._values,
              queryResult,
              queryResultSpec,
            },
            this._untransformedQueryResult,
          ),
      );
  }

  /**
   * Create a new QueryResultState instance from the query Selections,
   * QueryResultSpec, and SerializedQueryResult returned by the QueryEngine.
   */
  reset(
    querySelections: QuerySelections,
    queryResultSpec: QueryResultSpec,
    rawQueryResult: Zen.Serialized<QueryResultDataModel>,
  ): QueryResultState<QueryResultDataModel> {
    const queryResult = this.buildQueryResult(rawQueryResult);
    const values = {
      ...this._values,
      queryResult,
      queryResultSpec,
      querySelections,
    };
    return new QueryResultState(values);
  }

  /**
   * Create a new QueryResultState instance in an empty state with no
   * queryResult, querySelections, or queryResultSpec set.
   */
  clear(): QueryResultState<QueryResultDataModel> {
    const queryResult = this.buildQueryResult();
    const values = {
      ...this._values,
      queryResult,
      queryResultSpec: undefined,
      querySelections: undefined,
    };
    return new QueryResultState(values);
  }

  /**
   * Access the current queryResult with all transformations applied.
   */
  queryResult(): QueryResultDataModel {
    return this._values.queryResult;
  }

  /**
   * Update the query engine used by the state.
   */
  updateQueryEngine(
    queryEngine: QueryEngine<Zen.Serialized<QueryResultDataModel>>,
  ): QueryResultState<QueryResultDataModel> {
    const values = {
      ...this.clear()._values,
      queryEngine,
    };
    return new QueryResultState(values);
  }

  buildQueryResult(
    rawQueryResult: Zen.Serialized<QueryResultDataModel> | void = undefined,
  ): QueryResultDataModel {
    const values = rawQueryResult !== undefined ? rawQueryResult : {};
    return this._values.QueryResultDataModelClass.deserialize(values);
  }

  /**
   * @deprecated
   * This method is used by legacy visualizations that do not implement the
   * proper lifecycle methods for detecting if the queryResult should be
   * updated. When this method is called, it is assumed the queryResult supplied
   * is the *transformed* version.
   */
  deprecatedUpdateQueryResult(
    queryResult: QueryResultDataModel,
  ): QueryResultState<QueryResultDataModel> {
    const values = {
      ...this._values,
      queryResult,
    };
    return new QueryResultState(values, this._untransformedQueryResult);
  }
}
