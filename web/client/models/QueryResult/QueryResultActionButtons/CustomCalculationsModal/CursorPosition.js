// @flow
import * as Zen from 'lib/Zen';

type Values = {
  lineNumber: number,
  offset: number,
};

class CursorPosition extends Zen.BaseModel<CursorPosition, {}, Values> {
  static defaultValues = {
    lineNumber: 0,
    offset: 0,
  };
}

export default ((CursorPosition: any): Class<Zen.Model<CursorPosition>>);
