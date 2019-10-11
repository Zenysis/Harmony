// @flow
import * as Zen from 'lib/Zen';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import LegacyField from 'models/core/Field';

// The type of the JS Interpreter
type Interpreter = any;

// The type of the abstract syntax tree (obtained by parsing the user's input)
type AST = any;

// An environment maps JavaScript identifiers to number values. Think of it
// as a lookup dict for variable names used when calculating a formula
type Environment = { [string]: number };

// options for the Acorn JS interpreter
const ACORN_OPTIONS = {
  ecmaVersion: 5,
};

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
      `[Formula] Unable to parse formula.\nError: ${
        ex.message
      }\nFormula: ${formulaText}`,
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
  fields: Zen.Array<LegacyField>,

  /**
   * The formula text as a single string that is ready to be parsed by a
   * JS Interpreter and evaluated (meaning all fields are represented as
   * their JS Identifiers)
   */
  text: string,
};

class Formula extends Zen.BaseModel<Formula, Values, {}, DerivedValues> {
  static derivedConfig = {
    fields: [
      Zen.hasChangedDeep('metadata.fields'),
      formula => formula.metadata().fields(),
    ],
    text: [
      Zen.hasChangedDeep('metadata.lines'),
      formula => formula.metadata().getJSFormulaText(),
    ],
  };

  _interpreter: Interpreter | void = undefined;
  _ast: AST = _buildAST(this._.text());

  _prepareInterpreterForEval(environment: Environment): void {
    if (this._interpreter === undefined) {
      throw new Error(
        '[Formula] Cannot prepare interpreter for eval because interpreter is undefined.',
      );
    }
    const interpreter = Zen.cast<Interpreter>(this._interpreter);
    // Reset our program so that we can reuse the already parsed interpreter
    // and avoid building a new one with each invocation of evaluateFormula
    const state0 = interpreter.stateStack[0];
    state0.n_ = 0;
    state0.done = false;
    interpreter.value = undefined;

    // Bind the new environment variables as globals
    const scope = interpreter.getScope();
    this._.fields().forEach(field =>
      interpreter.setProperty(
        scope,
        field.jsIdentifier(),
        environment[field.id()],
      ),
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
   * Evaluate the formula with a given environment (a dictionary of field ids
   * to values), and return the calculated value.
   *
   * The JS Interpreter library
   * (https://neil.fraser.name/software/JS-Interpreter/docs.html)
   * provides a safe way of running untrusted code, because it implements its
   * own sandboxed JS interpreter, that does not provide access to dangerous
   * objects (such as window, document, etc.) that users could use to generate
   * XSS attacks.
   *
   * @param {Object<fieldId, ?number>} environment
   *   In order to evaluate a formula, we need an `environment`, which is an
   *   object that maps variable names (i.e. the field Ids used in the formula)
   *   to their numerical values.
   * @returns {number | undefined} the result from evaluating the formula with
   * the given environment.
   */
  evaluateFormula(environment: Environment): number | void {
    const newEnv = {};
    let hasNonNullValue = false;

    this._.fields().forEach(field => {
      // Initialize the env to have all necessary fields set.
      const fieldId = field.id();
      newEnv[fieldId] = 0;

      const val = environment[fieldId];
      if (Number.isFinite(val)) {
        newEnv[fieldId] = val;
        hasNonNullValue = true;
      }
    });

    if (!hasNonNullValue) {
      return undefined;
    }

    if (this._interpreter === undefined) {
      this._interpreter = this._buildInterpreter();
    }

    const interpreter = Zen.cast<Interpreter>(this._interpreter);
    this._prepareInterpreterForEval(newEnv);
    interpreter.run();
    const result = interpreter.value;
    if (typeof result !== 'number') {
      throw new Error('[Formula] The formula must evaluate to a number');
    }
    return result;
  }
}

export default ((Formula: any): Class<Zen.Model<Formula>>);
