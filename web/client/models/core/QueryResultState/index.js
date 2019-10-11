// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { QueryEngine } from 'models/core/QueryResultState/interfaces/QueryEngine';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';

// Callback method type to determine if a new query should be issued based on
// the new query Selections and QueryResultSpec received.
type NewQueryTest<Selections> = (
  newSelections: Selections,
  newResultSpec: QueryResultSpec,
  prevSelections: Selections | void,
  prevResultSpec: QueryResultSpec | void,
) => boolean;

// Callback method type to determine if post-query transformations should be
// applied based on the new QueryResultSpec received.
type ApplyTransformationsTest = (
  newResultSpec: QueryResultSpec,
  prevResultSpec: QueryResultSpec | void,
) => boolean;

type QRDType<T> = $Call<<M>(Class<M>) => M, T>;

type SerializedQueryResult<ModelClass> = Zen.Serialized<QRDType<ModelClass>>;

type InternalValues<Selections, ModelClass> = {|
  +QueryResultDataModel: ModelClass,
  +queryEngine: QueryEngine<Selections, SerializedQueryResult<ModelClass>>,
  +queryResult: QRDType<ModelClass>,
  +queryResultSpec: QueryResultSpec | void,
  +querySelections: Selections | void,
  +shouldRebuildQueryResult: ApplyTransformationsTest,
  +shouldRunNewQuery: NewQueryTest<Selections>,
|};

// QueryResultData cannot have required values at this time. It needs to be
// able to be created with a call to `.create({})`.
type ZenModelNoRequiredValues = Zen.BaseModel<any, {}, any, any>;

type QueryResultDataClass = Zen.DeserializableModel<
  ZenModelNoRequiredValues & QueryResultData<any> & Zen.Serializable<any, any>,
>;

/**
 * QueryResultState provides a convenient encapsulation of all operations needed
 * to build and customize a query result based on a given set of query
 * selections and a QueryResultSpec.
 *
 * A QueryResultState instance should be created by providing certain default
 * values:
 * const MyQueryResultState: QueryResultState<
 *   QuerySelections,
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
  Selections,
  ModelClass: QueryResultDataClass,
> {
  static createInitialState(
    queryEngine: QueryEngine<Selections, SerializedQueryResult<ModelClass>>,
    QueryResultDataModel: ModelClass,
    shouldRebuildQueryResult: ApplyTransformationsTest,
    shouldRunNewQuery: NewQueryTest<Selections>,
  ): this {
    // NOTE(stephen): Need to explicitly specify the type here since Flow is
    // having issues refining the result of `.create`.
    const queryResult: QRDType<ModelClass> = QueryResultDataModel.create({});
    return new this({
      QueryResultDataModel,
      queryEngine,
      queryResult,
      shouldRebuildQueryResult,
      shouldRunNewQuery,
      queryResultSpec: undefined,
      querySelections: undefined,
    });
  }

  +_values: InternalValues<Selections, ModelClass>;
  +_untransformedQueryResult: QRDType<ModelClass>;

  constructor(
    values: InternalValues<Selections, ModelClass>,
    untransformedQueryResult: QRDType<ModelClass> | void = undefined,
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
    newSelections: Selections,
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
    querySelections: Selections,
    queryResultSpec: QueryResultSpec,
  ): Promise<this> {
    return this._values.queryEngine
      .run(querySelections, queryResultSpec)
      .then((rawQueryResult: SerializedQueryResult<ModelClass>) => {
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
  ): Promise<this> {
    return this._untransformedQueryResult
      .applyTransformations(queryResultSpec)
      .then(
        queryResult =>
          new this.constructor(
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
    querySelections: Selections,
    queryResultSpec: QueryResultSpec,
    rawQueryResult: SerializedQueryResult<ModelClass>,
  ): this {
    const queryResult = this.buildQueryResult(rawQueryResult);
    const values = {
      ...this._values,
      queryResult,
      querySelections,
      queryResultSpec,
    };
    return new this.constructor(values);
  }

  /**
   * Create a new QueryResultState instance in an empty state with no
   * queryResult, querySelections, or queryResultSpec set.
   */
  clear(): this {
    const queryResult = this.buildQueryResult();
    const values = {
      ...this._values,
      queryResult,
      querySelections: undefined,
      queryResultSpec: undefined,
    };
    return new this.constructor(values);
  }

  /**
   * Access the current queryResult with all transformations applied.
   */
  queryResult(): QRDType<ModelClass> {
    return this._values.queryResult;
  }

  /**
   * Update the query engine used by the state.
   */
  updateQueryEngine(
    queryEngine: QueryEngine<Selections, SerializedQueryResult<ModelClass>>,
  ): this {
    const values = {
      ...this.clear()._values,
      queryEngine,
    };
    return new this.constructor(values);
  }

  buildQueryResult(
    rawQueryResult: SerializedQueryResult<ModelClass> | void = undefined,
  ): QRDType<ModelClass> {
    const values = rawQueryResult !== undefined ? rawQueryResult : {};
    return this._values.QueryResultDataModel.deserialize(values);
  }

  /**
   * @deprecated
   * This method is used by legacy visualizations that do not implement the
   * proper lifecycle methods for detecting if the queryResult should be
   * updated. When this method is called, it is assumed the queryResult supplied
   * is the *transformed* version.
   */
  deprecatedUpdateQueryResult(queryResult: QRDType<ModelClass>): this {
    const values = {
      ...this._values,
      queryResult,
    };
    return new this.constructor(values, this._untransformedQueryResult);
  }
}
