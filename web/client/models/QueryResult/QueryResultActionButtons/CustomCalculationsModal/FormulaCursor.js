// @flow
import * as Zen from 'lib/Zen';
import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';

type DefaultValues = {
  start: CursorPosition,
  end: CursorPosition,
};

/**
 * FormulaCursor represents a selection in our FormulaEditor.
 * 'start' and 'end' are both CursorPosition models
 * The reason we have both start and end is because the cursor can actually be
 * a ranged selection (e.g. when we highlight text) and not just a single
 * position.
 */
class FormulaCursor extends Zen.BaseModel<FormulaCursor, {}, DefaultValues> {
  static defaultValues: DefaultValues = {
    start: CursorPosition.create({}),
    end: CursorPosition.create({}),
  };

  /**
   * Collapse the cursor range to become a single selection at 'start'.
   * i.e. Make 'end' become equal to 'start'
   */
  collapseToStart(): Zen.Model<FormulaCursor> {
    return this._.end(this._.start());
  }

  /**
   * Collapse the cursor range to become a single selection at 'end'.
   * i.e. Make 'start' become equal to 'end'
   */
  collapseToEnd(): Zen.Model<FormulaCursor> {
    return this._.start(this._.end());
  }
}

export default ((FormulaCursor: $Cast): Class<Zen.Model<FormulaCursor>>);
