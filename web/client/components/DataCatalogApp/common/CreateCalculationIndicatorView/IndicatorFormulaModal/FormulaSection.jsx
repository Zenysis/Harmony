// @flow
import * as React from 'react';

import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import FormulaCreator from 'components/common/CustomCalculationsModal/FormulaCreator';
import type FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import type FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';

type Props = {
  formulaCursor: FormulaCursor,
  formulaMetadata: FormulaMetadata,
  onFormulaCursorChange: (formula: FormulaCursor) => void,
  onFormulaMetadataChange: (cursor: FormulaMetadata) => void,
};

export default function FormulaSection({
  formulaCursor,
  formulaMetadata,
  onFormulaCursorChange,
  onFormulaMetadataChange,
}: Props): React.Element<typeof FormulaCreator> {
  const onRemoveFieldClick = ({
    fieldId,
    lineNumber,
    startIndex,
    endIndex,
  }: {
    fieldId: string,
    lineNumber: number,
    startIndex: number,
    endIndex: number,
  }) => {
    const newMetadata = formulaMetadata.removeField(
      fieldId,
      lineNumber,
      startIndex,
      endIndex,
    );
    onFormulaMetadataChange(newMetadata);

    const newCursor = formulaCursor
      .start(CursorPosition.create({ lineNumber, offset: startIndex }))
      .collapseToStart();
    onFormulaCursorChange(newCursor);
  };

  const onUpdateFieldConfiguration = (
    fieldId: string,
    treatNoDataAsZero: boolean,
  ) => {
    const newFieldConfigurations = formulaMetadata
      .fieldConfigurations()
      .set(fieldId, { fieldId, treatNoDataAsZero });
    onFormulaMetadataChange(
      formulaMetadata.fieldConfigurations(newFieldConfigurations),
    );
  };

  const onSymbolClick = (value: string) => {
    const newFormula = formulaMetadata.addSymbol(value, formulaCursor);
    onFormulaMetadataChange(newFormula);

    // Set new cursor position
    const start = formulaCursor.start();
    const newPosition = CursorPosition.create({
      lineNumber: start.lineNumber(),
      offset: start.offset() + value.length,
    });
    const newCursor = formulaCursor.start(newPosition).collapseToStart();
    onFormulaCursorChange(newCursor);
  };

  return (
    <FormulaCreator
      formula={formulaMetadata}
      formulaCursor={formulaCursor}
      onFormulaChange={onFormulaMetadataChange}
      onFormulaCursorChange={onFormulaCursorChange}
      onRemoveFieldClick={onRemoveFieldClick}
      onSymbolClick={onSymbolClick}
      onUpdateFieldConfiguration={onUpdateFieldConfiguration}
    />
  );
}
