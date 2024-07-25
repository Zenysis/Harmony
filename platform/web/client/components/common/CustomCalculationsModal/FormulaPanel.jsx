// @flow
import * as React from 'react';

import FormulaCreator from 'components/common/CustomCalculationsModal/FormulaCreator';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';

type Props = {
  calculationName: string,
  formula: FormulaMetadata,
  formulaCursor: FormulaCursor,
  onCalculationNameChange: (calculationName: string) => void,
  onFormulaChange: (formula: FormulaMetadata) => void,
  onFormulaCursorChange: (cursor: FormulaCursor) => void,
  onRemoveFieldClick: ({
    endIndex: number,
    fieldId: string,
    lineNumber: number,
    startIndex: number,
  }) => void,
  onSymbolClick: (
    value: string,
    event: SyntheticMouseEvent<HTMLDivElement>,
  ) => void,
  onUpdateFieldConfiguration: (
    fieldId: string,
    treatNoDataAsZeros: boolean,
  ) => void,
};

export default class FormulaPanel extends React.PureComponent<Props> {
  renderTitleSection(): React.Node {
    return (
      <div className="custom-calculations-formula-panel__title-section">
        <div className="custom-calculations-modal__panel-title">
          {I18N.text('Calculation Name')}
        </div>
        <span data-testid="custom-calculations-title">
          <InputText
            ariaName={I18N.textById('Calculation Name')}
            onChange={this.props.onCalculationNameChange}
            value={this.props.calculationName}
          />
        </span>
      </div>
    );
  }

  render(): React.Node {
    const {
      formula,
      formulaCursor,
      onFormulaChange,
      onFormulaCursorChange,
      onRemoveFieldClick,
      onSymbolClick,
      onUpdateFieldConfiguration,
    } = this.props;

    return (
      <React.Fragment>
        {this.renderTitleSection()}
        <FormulaCreator
          formula={formula}
          formulaCursor={formulaCursor}
          onFormulaChange={onFormulaChange}
          onFormulaCursorChange={onFormulaCursorChange}
          onRemoveFieldClick={onRemoveFieldClick}
          onSymbolClick={onSymbolClick}
          onUpdateFieldConfiguration={onUpdateFieldConfiguration}
        />
      </React.Fragment>
    );
  }
}
