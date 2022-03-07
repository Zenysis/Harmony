// @flow
import * as React from 'react';

import CalculatorPanel from 'components/common/CustomCalculationsModal/CalculatorPanel';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaEditor from 'components/common/CustomCalculationsModal/FormulaEditor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import FormulaValidator from 'components/common/CustomCalculationsModal/FormulaValidator';

type Props = {
  formula: FormulaMetadata,
  formulaCursor: FormulaCursor,
  onFormulaChange: (formula: FormulaMetadata) => void,
  onFormulaCursorChange: (cursor: FormulaCursor) => void,
  onRemoveFieldClick: ({
    fieldId: string,
    lineNumber: number,
    startIndex: number,
    endIndex: number,
  }) => void,
  onUpdateFieldConfiguration: (
    fieldId: string,
    treatNoDataAsZeros: boolean,
  ) => void,
  onSymbolClick: (
    value: string,
    event: SyntheticMouseEvent<HTMLDivElement>,
  ) => void,
};

const TEXT = t('QueryApp.CustomCalculationsModal.FormulaPanel');

export default class FormulaCreator extends React.PureComponent<Props> {
  renderFormulaSection(): React.Node {
    const {
      formulaCursor,
      formula,
      onFormulaChange,
      onFormulaCursorChange,
      onRemoveFieldClick,
      onUpdateFieldConfiguration,
    } = this.props;
    return (
      <React.Fragment>
        <div className="custom-calculations-modal__panel-title">
          {TEXT.formulaTitle}
        </div>
        <FormulaEditor
          cursor={formulaCursor}
          formula={formula}
          onFormulaChange={onFormulaChange}
          onFormulaCursorChange={onFormulaCursorChange}
          onRemoveFieldClick={onRemoveFieldClick}
          onUpdateFieldConfiguration={onUpdateFieldConfiguration}
        />
      </React.Fragment>
    );
  }

  render(): React.Node {
    const { formula, onSymbolClick } = this.props;

    return (
      <React.Fragment>
        {this.renderFormulaSection()}
        <div className="custom-calculations-calculator-validator-row">
          <CalculatorPanel onSymbolClick={onSymbolClick} />
          <FormulaValidator metadata={formula} />
        </div>
      </React.Fragment>
    );
  }
}
