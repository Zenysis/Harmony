// @flow
import * as React from 'react';

import FormulaCreator from 'components/common/CustomCalculationsModal/FormulaCreator';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import InputText from 'components/ui/InputText';

type Props = {
  calculationName: string,
  formula: FormulaMetadata,
  formulaCursor: FormulaCursor,
  onCalculationNameChange: (calculationName: string) => void,
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

export default class FormulaPanel extends React.PureComponent<Props> {
  renderTitleSection(): React.Node {
    return (
      <div className="custom-calculations-formula-panel__title-section">
        <div className="custom-calculations-modal__panel-title">
          {TEXT.calculationTitle}
        </div>
        <span data-testid="custom-calculations-title">
          <InputText
            ariaName={TEXT.calculationTitle}
            value={this.props.calculationName}
            onChange={this.props.onCalculationNameChange}
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
          onUpdateFieldConfiguration={onUpdateFieldConfiguration}
          onSymbolClick={onSymbolClick}
        />
      </React.Fragment>
    );
  }
}
