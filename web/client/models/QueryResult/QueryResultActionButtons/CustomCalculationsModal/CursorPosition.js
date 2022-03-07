// @flow
import * as Zen from 'lib/Zen';

type DefaultValues = {
  lineNumber: number,
  offset: number,
};

// TODO(pablo): this does not need to be a ZenModel, it can just be a
// read-only object
class CursorPosition extends Zen.BaseModel<CursorPosition, {}, DefaultValues> {
  static defaultValues: DefaultValues = {
    lineNumber: 0,
    offset: 0,
  };
}

export default ((CursorPosition: $Cast): Class<Zen.Model<CursorPosition>>);
