// @flow
import * as Zen from 'lib/Zen';

// NOTE: These props are used to display errors in the dataprep upload detected
// before the file is sent to dataprep. For now, the only checks are: all the expected
// column headers are present, there are no extra headers, and the headers are in the
// correct order. In the future, if more checks are run, expand these props to include
// more information. This values will be the default values for CSV sources.
export type DefaultValues = {
  extraHeaders: $ReadOnlyArray<string>,
  headerOrderCorrect: boolean,
  missingHeaders: $ReadOnlyArray<string>,
};

type DerivedValues = {
  fileValid: boolean,
};

class DataprepFileValidator extends Zen.BaseModel<
  DataprepFileValidator,
  {},
  DefaultValues,
  DerivedValues,
> {
  static defaultValues: DefaultValues = {
    extraHeaders: [],
    headerOrderCorrect: true,
    missingHeaders: [],
  };

  static derivedConfig: Zen.DerivedConfig<
    DataprepFileValidator,
    DerivedValues,
  > = {
    fileValid: [
      Zen.hasChanged<DataprepFileValidator>(
        'extraHeaders',
        'headerOrderCorrect',
        'missingHeaders',
      ),
      validator =>
        validator.missingHeaders().length === 0 &&
        validator.extraHeaders().length === 0 &&
        validator.headerOrderCorrect(),
    ],
  };
}

export default ((DataprepFileValidator: $Cast): Class<
  Zen.Model<DataprepFileValidator>,
>);
