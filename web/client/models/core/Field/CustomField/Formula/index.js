// @flow
import memoizeOne from 'memoize-one';

import * as Zen from 'lib/Zen';
import sortDataFrame from 'models/core/Field/CustomField/Formula/sortDataFrame';
import {
  cumulativeSum,
  differenceFromPrevious,
  memoizedPseudoSum,
  movingAverage,
  memoizedValuesByDimension,
  memoizedValuesWithDimension,
} from 'models/core/Field/CustomField/Formula/interpreterUtil';
import type FormulaMetadata, {
  FieldShape,
} from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import type {
  DataFrame,
  DataFrameRow,
  Environment,
  Interpreter,
  InterpreterArray,
  InterpreterObject,
} from 'models/core/Field/CustomField/Formula/types';

// The type of the abstract syntax tree (obtained by parsing the user's input)
type AST = $AllowAny;

// options for the Acorn JS interpreter
const ACORN_OPTIONS = {
  ecmaVersion: 5,
};

/**
 * This function converts a datafrme to a pseudo-object that can be used by
 * the JS interpreter. It is memoized for performance reasons to avoid having
 * to do such an expensive computation over the same dataframe over and over
 * again.
 */
const prepareDataFrameForInterpreter = memoizeOne(
  (interpreter: Interpreter, dataframe: DataFrame) =>
    interpreter.nativeToPseudo(dataframe),
);

function _buildAST(formulaText: string): AST {
  try {
    // We allow people to write simple calculation statements that omit the
    // `return`. Try to parse this version first since it is the most common.
    // NOTE(pablo): The statement does not need to be a single line or a
    // single expression. Anything that can run outside a function can be
    // parsed here. For example: `if (a < b) { 1 } else { 0 }` is valid, and
    // the result when executed by Interpreter will be the last value emitted.
    return window.acorn.parse(formulaText, ACORN_OPTIONS);
  } catch (ex) {
    // If the formula provided requires execution within a function, (i.e. it
    // has a `return` statement), then we should wrap it in a self-calling
    // function.
    // NOTE(pablo): The only parse error raised by acorn that requires a
    // function is caught here. Newer versions of acorn have the
    // allowReturnOutsideFunction flag, but the version bundled with
    // Interpreter does not support this.
    if (
      ex instanceof SyntaxError &&
      ex.message.startsWith("'return' outside of function")
    ) {
      return window.acorn.parse(
        `(function() { ${formulaText} })()`,
        ACORN_OPTIONS,
      );
    }

    throw new Error(
      `[Formula] Unable to parse formula.\nError: ${ex.message}\nFormula: ${formulaText}`,
    );
  }
}

type Values = {
  /**
   * The formula metadata used to render in a Formula Editor. It contains
   * the formula as an array of lines, and the fields that it depends on.
   */
  metadata: FormulaMetadata,
};

type DerivedValues = {
  /**
   * An array of fields that this calculation depends on.
   * (it is just a copy of metadata.fields() to make it easily accessible
   * from this model)
   */
  fields: Zen.Array<FieldShape>,

  /**
   * The formula text as a single string that is ready to be parsed by a
   * JS Interpreter and evaluated (meaning all fields are represented as
   * their JS Identifiers)
   */
  jsEvaluatableText: string,
};

class Formula extends Zen.BaseModel<Formula, Values, {}, DerivedValues> {
  static derivedConfig: Zen.DerivedConfig<Formula, DerivedValues> = {
    fields: [
      Zen.hasChangedDeep('metadata.fields'),
      formula => formula.metadata().fields(),
    ],
    jsEvaluatableText: [
      Zen.hasChangedDeep('metadata.lines'),
      formula => {
        const metadata = formula.metadata();
        const jsText = formula.metadata().getJSFormulaText();

        // apply any field configurations, e.g. if any fields were configured
        // to treat 'No data' as zeros, then we need to make some last
        // modifications to the JS to account for that.
        return metadata.sortedFields().reduce((finalText, field) => {
          const fieldConfig = metadata.fieldConfigurations().get(field.id());
          if (fieldConfig && fieldConfig.treatNoDataAsZero) {
            // NOTE(stephen): It is possible for field IDs to be substrings of
            // each other. If we try to replace the shorter field ID with this
            // field configuration, we could end up partially replacing the
            // substring of a different field in the formula. This breaks things
            // (see T8214). This regex will match the exact js indentifier and
            // will *not* match anything else in the string that has this
            // identifier as a substring (i.e. if the identifier is test_1234,
            // it will match test_1234 but will not match test_1234_4567).
            // NOTE(abby): With advanced custom calcs, fields may be referenced
            // from the dataframe or from a javascript variable (ie. row.test_1234
            // or data.values.test_1234). When modifying to convert no data to 0,
            // we need to capture the full field name (ie. data.values.test_1234
            // -> (data.values.test_1234 || 0)). The regex group [a-zA-Z0-9_$]
            // should account for all possible javascript variable names.
            const pattern = new RegExp(
              `([a-zA-Z0-9_$]*\\.)*\\b(${field.jsIdentifier()})\\b`,
              'gm',
            );
            return finalText.replace(pattern, match => `(${match} || 0)`);
          }
          return finalText;
        }, jsText);
      },
    ],
  };

  _interpreter: Interpreter | void = undefined;
  _ast: AST = _buildAST(this._.jsEvaluatableText());

  /**
   * Array of all available dimensions
   */
  dimensions(): $ReadOnlyArray<string> {
    return this._.metadata().dimensions();
  }

  _prepareInterpreterForEval(environment: Environment): void {
    if (this._interpreter === undefined) {
      throw new Error(
        '[Formula] Cannot prepare interpreter for eval because interpreter is undefined.',
      );
    }
    const { dataFrame, row, rowNum } = environment;
    const interpreter = this._interpreter;

    // Reset our program so that we can reuse the already parsed interpreter
    // and avoid building a new one with each invocation of evaluateFormula
    const state0 = interpreter.stateStack[0];
    state0.n_ = 0;
    state0.done = false;
    interpreter.value = undefined;

    const scope = interpreter.getScope();

    // Bind all referenced fields to the scope
    this._.fields().forEach(field =>
      interpreter.setProperty(scope, field.jsIdentifier(), row[field.id()]),
    );

    // Bind all dimensions to the scope
    this.dimensions().forEach(dimId =>
      interpreter.setProperty(scope, dimId, row[dimId]),
    );

    // Bind other variables into the scope to allow calculations using the full
    // dataframe
    interpreter.setProperty(scope, 'rowNum', rowNum);

    if (this.referencesDataFrame()) {
      const preparedDataframe = prepareDataFrameForInterpreter(
        interpreter,
        dataFrame,
      );
      interpreter.setProperty(scope, 'data', preparedDataframe);

      interpreter.setProperty(
        scope,
        'valuesWithDimension',
        interpreter.createNativeFunction(
          // set a default for `dataframeRows` to the current dataframe.rows,
          // this way the user doesn't have to explicitly pass it
          (
            values: InterpreterArray<number | null>,
            dimensionId: string,
            dimensionValue: string,
            dataframeRows: InterpreterArray<
              InterpreterObject<DataFrameRow>,
            > = preparedDataframe.properties.rows,
          ) =>
            memoizedValuesWithDimension(
              values,
              dimensionId,
              dimensionValue,
              dataframeRows,
              interpreter,
            ),
        ),
      );

      interpreter.setProperty(
        scope,
        'valuesByDimension',
        // set a default for `dataframeRows` to the current dataframe.rows,
        // this way the user doesn't have to explicitly pass it
        (
          values: InterpreterArray<number | null>,
          dimensionId: string,
          dataframeRows: InterpreterArray<
            InterpreterObject<DataFrameRow>,
          > = preparedDataframe.properties.rows,
        ) => memoizedValuesByDimension(values, dimensionId, dataframeRows),
      );
    }

    // Bind useful helper functions to make accessible to the custom calculation
    // TODO(pablo): pull all of these from a registry of helper functions.
    // This will involve moving all the functions in `interpreterUtil` to
    // separate files, and then having a registry for them
    interpreter.setProperty(
      scope,
      'sum',
      interpreter.createNativeFunction(memoizedPseudoSum),
    );

    interpreter.setProperty(
      scope,
      'differenceFromPrevious',
      interpreter.createNativeFunction(
        // add default for `rowIdx` so that we automatically take the current
        // row without the user having to provide the hidden `rowNum` variable
        // to make this function work.
        (arr: InterpreterArray<?(number | string)>, rowIdx?: number = rowNum) =>
          differenceFromPrevious(arr, rowIdx),
      ),
    );

    interpreter.setProperty(
      scope,
      'movingAverage',
      interpreter.createNativeFunction(
        // set a default for `currIdx` to the current `rowNum`, since this is
        // the most common use case. That way the user doesn't have to remember
        // to reference this variable in their custom calculation.
        (
          arr: InterpreterArray<?(number | string)>,
          windowSize: number,
          currIdx?: number = rowNum,
        ) => movingAverage(arr, windowSize, currIdx),
      ),
    );

    interpreter.setProperty(
      scope,
      'cumulativeSum',
      interpreter.createNativeFunction(
        // set a default for `lastIdx` to the current `rowNum`, since this is
        // the most common use case. That way the user doesn't have to remember
        // to reference this variable in their custom calculation.
        (
          arr: InterpreterArray<?(number | string)>,
          lastIdx?: number = rowNum,
        ) => cumulativeSum(arr, lastIdx),
      ),
    );
  }

  /**
   * NOTE(pablo): preparing the dataframe to a pseudo-object that can be used
   * in the interpreter is a *very* expensive operation. We should only do it
   * if the calculation actually references the data frame. A very hacky way
   * to do this is just checking if `data.values` or `data.rows` is ever
   * referenced in the formula text. If it is, then we will prepare the
   * dataframe to be added to the interpreter's scope.
   */
  @memoizeOne
  referencesDataFrame(): boolean {
    return (
      this._.jsEvaluatableText().includes('data.values') ||
      this._.jsEvaluatableText().includes('data.rows')
    );
  }

  _buildInterpreter(): Interpreter {
    // This model requires that the component that's calling evaluateFormula
    // must have loaded the JS Interpreter library using withScriptLoader
    if (!window.Interpreter || !window.acorn) {
      throw new Error(
        '[Formula] JS Interpreter has not been loaded. Make sure your components have loaded this library first.',
      );
    }

    return new window.Interpreter(this._ast);
  }

  /**
   * Evaluate the formula for the full dataframe.
   * This will apply the formula on each row of the dataframe, and return an
   * array of results. The i-th result corresponds to the i-th row of the
   * dataframe.
   *
   * The JS Interpreter library
   * (https://neil.fraser.name/software/JS-Interpreter/docs.html)
   * provides a safe way of running untrusted code, because it implements its
   * own sandboxed JS interpreter, that does not provide access to dangerous
   * objects (such as window, document, etc.) that users could use to generate
   * XSS attacks.
   *
   * @param {DataFrame} dataFrame The dataframe of all rows. This dataframe
   * is what the custom field's formula will use to look up values.
   * @returns {number | null} the result from evaluating the formula with
   * the given environment.
   * NOTE(pablo): we intentionally return `null` here instead of `void`
   * because all of our visualizations were built to expect null values.
   * This is a legacy decision and to overhaul that would be too much work.
   */
  evaluateFormula(dataFrame: DataFrame): Array<number | null> {
    let sortedIdxOrder;
    let sortedDataFrame;

    if (this.referencesDataFrame()) {
      const sortedDataFrameInfo = sortDataFrame(
        dataFrame,
        // sort the dataframe across all dimensions in 'ASC' order by default.
        // TODO(pablo): eventually if advanced custom calcs gets generalized
        // with a UI to do dataframe operations, then we will want to give users
        // the power to decide for themselves how the dataframe should be sorted.
        this.dimensions().map(dimension => ({ dimension, direction: 'ASC' })),
      );
      sortedIdxOrder = sortedDataFrameInfo.sortedIdxOrder;
      sortedDataFrame = sortedDataFrameInfo.sortedDataFrame;
    } else {
      // If the formula makes no reference to a dataframe then we'll skip
      // sorting the dataframe, because it won't matter in this case.
      // We'll just use the dataframe as is, and keep the same idx order
      sortedIdxOrder = [...dataFrame.rows.keys()];
      sortedDataFrame = dataFrame;
    }

    const { rows } = dataFrame;
    const fieldConfigurations = this._.metadata().fieldConfigurations();

    // set up the interpreter
    if (this._interpreter === undefined) {
      this._interpreter = this._buildInterpreter();
    }

    const interpreter = this._interpreter;

    // create an array of nulls that we will populate with the calculation
    // results as we go collecting them
    const results: Array<number | null> = new Array(dataFrame.rows.length).fill(
      null,
    );

    sortedIdxOrder.forEach((originalIdx, rowNum) => {
      const row = rows[originalIdx];
      const rowData: { [string]: string | number | void, ... } = {};

      let allRowValuesAreNull = true;

      this._.fields().forEach(field => {
        // initialize the row to have all necessary fields set
        const fieldId = field.id();
        rowData[fieldId] = undefined;

        const val = row[fieldId];
        const fieldConfig = fieldConfigurations.get(fieldId, undefined);
        const treatNoDataAsZero = fieldConfig
          ? fieldConfig.treatNoDataAsZero
          : false;

        if (Number.isFinite(val)) {
          rowData[fieldId] = val;
          allRowValuesAreNull = false;
        } else if (treatNoDataAsZero) {
          rowData[fieldId] = 0;
          allRowValuesAreNull = false;
        }
      });

      let result;

      // if all row values are null AND we have at least one field AND
      // we do not have operations that reference the dataframe,
      // then this should short-circuit and just return `null` (which
      // would translate to 'No Data' in our table)
      if (
        allRowValuesAreNull &&
        !this._.fields().isEmpty() &&
        !this.referencesDataFrame()
      ) {
        result = null;
      } else {
        this.dimensions().forEach(dim => {
          rowData[dim] = row[dim];
        });

        const env: Environment = {
          rowNum,
          dataFrame: sortedDataFrame,
          row: rowData,
        };

        this._prepareInterpreterForEval(env);
        interpreter.run();

        result = interpreter.value;
        if (result === undefined || result === null) {
          result = null;
        } else if (typeof result !== 'number') {
          console.error('Failed to evaluate to a number for row', row);
          throw new Error('[Formula] The formula must evaluate to a number');
        }
      }

      // store the result back to the original unsorted index
      results[originalIdx] = result;
    });

    return results;
  }
}

export default ((Formula: $Cast): Class<Zen.Model<Formula>>);
