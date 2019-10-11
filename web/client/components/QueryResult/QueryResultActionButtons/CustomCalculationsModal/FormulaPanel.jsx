// @flow
import * as React from 'react';

import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaEditor from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaEditor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import FormulaValidator from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaValidator';
import InputText from 'components/ui/InputText';
import type Field from 'models/core/Field';

type Props = {
  calculationName: string,
  formula: FormulaMetadata,
  formulaCursor: FormulaCursor,
  onCalculationNameChange: (calculationName: string) => void,
  onFormulaChange: (formula: FormulaMetadata) => void,
  onFormulaCursorChange: (cursor: FormulaCursor) => void,
  onRemoveFieldClick: ({
    field: Field,
    lineNumber: number,
    startIndex: number,
    endIndex: number,
  }) => void,
  showValidator: boolean,
};

const TEXT = t('QueryApp.CustomCalculationsModal.FormulaPanel');

export default class FormulaPanel extends React.PureComponent<Props> {
  renderTitleSection() {
    return (
      <div className="custom-calculations-formula-panel__title-section">
        <div className="custom-calculations-modal__panel-title">
          {TEXT.calculationTitle}
        </div>
        <span zen-test-id="custom-calculations-title">
          <InputText
            value={this.props.calculationName}
            onChange={this.props.onCalculationNameChange}
          />
        </span>
      </div>
    );
  }

  renderFormulaValidator() {
    if (this.props.showValidator) {
      return <FormulaValidator metadata={this.props.formula} />;
    }
    return null;
  }

  renderFormulaEditor() {
    return (
      <FormulaEditor
        cursor={this.props.formulaCursor}
        formula={this.props.formula}
        onFormulaChange={this.props.onFormulaChange}
        onFormulaCursorChange={this.props.onFormulaCursorChange}
        onRemoveFieldClick={this.props.onRemoveFieldClick}
      />
    );
  }

  renderFormulaSection() {
    return (
      <div className="custom-calculations-formula-panel__formula-section">
        <div className="custom-calculations-modal__panel-title">
          {TEXT.formulaTitle}
        </div>
        {this.renderFormulaEditor()}
      </div>
    );
  }

  render() {
    return (
      <div className="custom-calculations-formula-panel">
        {this.renderTitleSection()}
        {this.renderFormulaSection()}
        {this.renderFormulaValidator()}
      </div>
    );
  }
}
