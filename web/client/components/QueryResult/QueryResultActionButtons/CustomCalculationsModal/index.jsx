// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import CalculatorPanel from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CalculatorPanel';
import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import CustomField from 'models/core/Field/CustomField';
import CustomFieldPanel from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CustomFieldPanel';
import Field from 'models/core/Field';
import FieldsPanel from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FieldsPanel';
import Formula from 'models/core/Field/CustomField/Formula';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import FormulaPanel from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaPanel';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import type { ButtonClickEvent } from 'components/ui/LegacyButton';

type Props = {
  customFields: Array<CustomField>,
  fields: $ReadOnlyArray<Field>,
  onCalculationSubmit: CustomField => void,
  onDeleteCalculation: (field: CustomField) => void,
  onEditCalculation: (
    previousField: CustomField,
    editedField: CustomField,
  ) => void,
  onRequestClose: () => void,
  show: boolean,
};

type State = {
  calculationName: string,
  formulaCursor: FormulaCursor,
  formulaMetadata: FormulaMetadata,

  /** Once jsInterpreter is loaded, the validator is shown */
  showValidator: boolean,

  /** On click on a custom field tag, open a menu panel underneath it */
  isCustomFieldPanelOpen: boolean,

  /**  The custom field tag whose menu is being viewed */
  customFieldPanelToView: CustomField | void,

  /** The custom field that is being edited if in editMode */
  customFieldToEdit: CustomField | void,
  customFieldPanelPosition: { y: number, x: number },
  editMode: boolean,
};

const TEXT = t('QueryApp.CustomCalculationsModal');

function buildDefaultCalculationName(
  customFields: $ReadOnlyArray<CustomField>,
): string {
  let currentMax = 0;
  customFields.forEach(f => {
    const name = f.getCanonicalName();
    if (name.startsWith(TEXT.defaultCalculationNamePrefix)) {
      if (name.length > TEXT.defaultCalculationNamePrefix.length) {
        const currNum = parseInt(
          name.substring(TEXT.defaultCalculationNamePrefix.length, name.length),
          10,
        );
        if (Number.isInteger(currNum) && currNum > currentMax) {
          currentMax = currNum;
        }
      }
    }
  });

  return `${TEXT.defaultCalculationNamePrefix}${currentMax + 1}`;
}

class CustomCalculationsModal extends React.PureComponent<Props, State> {
  state = {
    calculationName: buildDefaultCalculationName(this.props.customFields),
    formulaCursor: FormulaCursor.create({}),
    formulaMetadata: FormulaMetadata.create({}),
    showValidator: false,
    isCustomFieldPanelOpen: false,
    customFieldPanelToView: undefined,
    customFieldToEdit: undefined,
    customFieldPanelPosition: { y: 0, x: 0 },
    editMode: false,
  };

  componentDidMount() {
    // Loading jsInterpreter for the validator
    VENDOR_SCRIPTS.jsInterpreter.load().then(() => {
      // Will not render validator until loaded
      this.setState({ showValidator: true });
    });
  }

  /**
   * Map of customField.id to a boolean
   * {true} invalid {false} valid
   *
   * A tag is considered invalid if a calculation or field that
   * it relies on does not exist or is, itself, invalid.
   */
  @memoizeOne
  getCustomTagErrorState(
    customFields: Array<CustomField>,
    propFields: $ReadOnlyArray<Field>,
  ): { [string]: boolean } {
    const errState: { [string]: boolean } = {};
    customFields.forEach(field => {
      const fields = field
        .formula()
        .metadata()
        .fields();
      const errorState = fields.some(componentField => {
        const id = componentField.id();
        if (id === field.id()) {
          return false;
        }

        const fieldDoesntExist =
          !propFields.find(f => f.id() === id) &&
          !customFields.find(f => f.id() === id);
        const fieldAlreadyHasError = id in errState && errState[id] === true;
        return fieldDoesntExist || fieldAlreadyHasError;
      });

      errState[field.id()] = errorState;
    });

    return errState;
  }

  @autobind
  getTitle(): string {
    if (this.state.editMode) {
      if (this.state.calculationName.length < 55) {
        return `${TEXT.editTitlePrefix} ${this.state.calculationName}`;
      }
      return TEXT.editTitle;
    }
    return TEXT.title;
  }

  @autobind
  resetFormulaEditor() {
    this.setState({
      formulaCursor: FormulaCursor.create({}),
      formulaMetadata: FormulaMetadata.create({}),
      calculationName: '',
    });
  }

  @autobind
  _combineLinesAtCursorPosition(
    oldLines: Zen.Array<string>,
    newLines: Zen.Array<string>,
    cursor: FormulaCursor,
  ): Zen.Array<string> {
    // Add lines to end of what's in FormulaEditor
    if (
      cursor.start() === undefined ||
      oldLines.get(cursor.start().lineNumber()).length <=
        cursor.start().offset()
    ) {
      return oldLines.concat(newLines);
    }

    // The line to start adding lines from
    const startLineNumber = cursor.start().lineNumber();
    const startLine = oldLines.get(startLineNumber);
    const firstPart = startLine.substring(0, cursor.start().offset());
    const lastPart = startLine.substring(
      cursor.start().offset(),
      startLine.length,
    );

    // If newLines is more than one line
    if (newLines.size() > 1) {
      const linesToInsert = newLines
        .set(0, `${firstPart}${newLines.first()}`)
        .set(newLines.size() - 1, `${newLines.last()}${lastPart}`);
      return oldLines.splice(
        startLineNumber,
        newLines.size(),
        ...linesToInsert,
      );
    }
    return oldLines.set(
      startLineNumber,
      `${firstPart}${newLines.first()}${lastPart}`,
    );
  }

  @autobind
  onCalculationSubmit() {
    const { calculationName, formulaMetadata } = this.state;

    // Do not allow calculations to be submitted if they have no name
    if (calculationName === '') {
      window.toastr.error(TEXT.emptyNameError);
      return;
    }

    // Do not allow two custom calculations to have the same name
    const allFields = this.props.fields.concat(this.props.customFields);
    const alreadyExists = allFields.some(
      field => field.label() === calculationName,
    );

    if (alreadyExists) {
      window.toastr.error(TEXT.existingNameError);
      return;
    }

    if (!formulaMetadata.lines().some(line => line.trim() !== '')) {
      window.toastr.error(TEXT.emptyFormulaError);
      return;
    }

    // TODO(nina): Expression not being evaluated to a number still needs to
    // be addressed (EX: 'abc' is valid because it can be interpreted as a
    // variable, despite not having been defined)
    VENDOR_SCRIPTS.jsInterpreter.load().then(() => {
      try {
        const formula = Formula.create({ metadata: formulaMetadata });
        this.props.onCalculationSubmit(
          CustomField.create({
            formula,
            label: calculationName,
          }),
        );

        this.resetFormulaEditor();
        analytics.track('Custom calculation created');
      } catch (error) {
        window.toastr.error(TEXT.invalidExpressionError);
      }
    });
  }

  @autobind
  onCalculationSubmitEdit() {
    const {
      editMode,
      formulaMetadata,
      customFieldToEdit,
      calculationName,
    } = this.state;

    if (editMode) {
      invariant(
        customFieldToEdit !== undefined,
        'Cannot be in custom calculation edit mode without a field to edit',
      );

      // TODO(stephen): Is this edge case even possible? Can you actually edit
      // a calculation without it being the same as the one selected?
      const id = customFieldToEdit.id();
      if (this.props.customFields.find(f => f.id() === id)) {
        const formula = Formula.create({ metadata: formulaMetadata });
        this.props.onEditCalculation(
          customFieldToEdit,
          customFieldToEdit.formula(formula).label(calculationName),
        );
      }
    }

    this.setState({ customFieldToEdit: undefined, editMode: false }, () =>
      this.resetFormulaEditor(),
    );
    analytics.track('Custom calculation edited');
  }

  /**
   * Adds field to the Formula Editor as a single Custom Field
   * Can be renamed onAddCalculation
   */
  @autobind
  onFieldClick(field) {
    // TODO(catherine) - if in editMode, should prevent adding
    // a calc that depends on the calc being edited
    this.setState(
      ({ customFieldToEdit, editMode, formulaCursor, formulaMetadata }) => {
        if (
          !editMode ||
          customFieldToEdit === undefined ||
          customFieldToEdit.id() !== field.id()
        ) {
          const newFormula = formulaMetadata.addField(field, formulaCursor);

          // Set new cursor position
          const start = formulaCursor.start();
          const fieldText = `${field.label()} `;
          const newPosition = CursorPosition.create({
            lineNumber: start.lineNumber(),
            offset: start.offset() + fieldText.length,
          });
          const newCursor = formulaCursor.start(newPosition).collapseToStart();
          return {
            formulaMetadata: newFormula,
            formulaCursor: newCursor,
          };
        }
        return undefined;
      },
    );
  }

  @autobind
  onCalculationNameChange(calculationName: string) {
    this.setState({ calculationName });
  }

  @autobind
  onRemoveFieldClick({ field, lineNumber, startIndex, endIndex }) {
    this.setState(prevState => {
      const { formulaMetadata, formulaCursor } = prevState;
      const newMetadata = formulaMetadata.removeField(
        field,
        lineNumber,
        startIndex,
        endIndex,
      );
      const newCursor = formulaCursor
        .start(CursorPosition.create({ lineNumber, offset: startIndex }))
        .collapseToStart();

      return {
        formulaMetadata: newMetadata,
        formulaCursor: newCursor,
      };
    });
  }

  @autobind
  onRequestViewCustomField(
    value: CustomField,
    event: SyntheticMouseEvent<HTMLSpanElement>,
  ) {
    // Persist event so event.clientY can be accessed later
    event.persist();
    this.setState(prevState => {
      if (!prevState.isCustomFieldPanelOpen) {
        return {
          isCustomFieldPanelOpen: true,
          customFieldPanelToView: value,
          customFieldPanelPosition: { y: event.clientY, x: event.clientX },
        };
      }
      return undefined;
    });
  }

  @autobind
  onRequestCloseCustomFieldView() {
    this.setState(prevState => {
      if (prevState.isCustomFieldPanelOpen) {
        return {
          isCustomFieldPanelOpen: false,
        };
      }
      return undefined;
    });
  }

  @autobind
  onFormulaChange(formulaMetadata) {
    this.setState({ formulaMetadata });
  }

  @autobind
  onFormulaCursorChange(formulaCursor) {
    this.setState({ formulaCursor });
  }

  @autobind
  onDeleteCalculation(field: CustomField) {
    this.props.onDeleteCalculation(field);
    analytics.track('Custom calculation deleted');
  }

  /**
   * Triggered from clicking Edit calculation button in the
   * CustomFieldPanel and allows the user to edit a previous
   * custom calculation, transforming the Custom Calculation Modal
   * into edit mode.
   */
  @autobind
  onEditCalculation(field: CustomField) {
    // TODO(catherine) - Trigger popup here
    // Do you want to save the calculation you're working on? yes/no

    this.setState(prevState => {
      const { formulaCursor } = prevState;
      const { formula, label } = field.modelValues();
      const { metadata } = formula.modelValues();
      const { lines } = metadata.modelValues();

      const newPosition = CursorPosition.create({
        lineNumber: lines.size() - 1,
        offset: lines.last().length,
      });

      return {
        calculationName: label,
        formulaMetadata: metadata,
        formulaCursor: formulaCursor.start(newPosition).collapseToStart(),
        customFieldToEdit: field,
        editMode: true,
      };
    });
  }

  /**
   * Adds the fields / formula to the Formula Editor that
   * compose the original calculation when the plain text
   * "Add expanded calculation" button is clicked in the CustomFieldPanel.
   */
  @autobind
  onAddExpandedCalculation(field: CustomField) {
    this.setState(prevState => {
      const { formulaMetadata, formulaCursor } = prevState;
      const { lines, fields } = formulaMetadata.modelValues();
      const { formula } = field.modelValues();

      const { metadata: metadataToAdd } = formula.modelValues();

      const newLines =
        lines.first() === ''
          ? metadataToAdd.lines()
          : this._combineLinesAtCursorPosition(
              lines,
              metadataToAdd.lines(),
              prevState.formulaCursor,
            );

      const newMetadata = FormulaMetadata.create({
        lines: newLines,
        fields: fields.slice().concat(metadataToAdd.fields()),
      });

      // Calculate newPosition for the cursor based on the newLines
      const newPosition = CursorPosition.create({
        lineNumber: newLines.size() - 1,
        offset: newLines.last().length,
      });

      return {
        formulaMetadata: newMetadata,
        formulaCursor: formulaCursor.start(newPosition).collapseToStart(),
      };
    });
  }

  @autobind
  onSymbolClick(event: ButtonClickEvent) {
    const symbol = event.currentTarget.dataset.content;

    this.setState(({ formulaCursor, formulaMetadata }) => {
      const newFormula = formulaMetadata.addSymbol(symbol, formulaCursor);

      // Set new cursor position
      const start = formulaCursor.start();
      const newPosition = CursorPosition.create({
        lineNumber: start.lineNumber(),
        offset: start.offset() + symbol.length,
      });
      const newCursor = formulaCursor.start(newPosition).collapseToStart();
      return {
        formulaMetadata: newFormula,
        formulaCursor: newCursor,
      };
    });
  }

  @autobind
  onExitEditMode() {
    this.resetFormulaEditor();
    this.setState({ editMode: false, customFieldToEdit: undefined });
  }

  @autobind
  maybeRenderCustomFieldViewPanel() {
    if (
      this.state.isCustomFieldPanelOpen &&
      this.state.customFieldPanelToView
    ) {
      return (
        <CustomFieldPanel
          field={this.state.customFieldPanelToView}
          onCloseWindow={this.onRequestCloseCustomFieldView}
          onAddCalculation={this.onFieldClick}
          onAddExpandedCalculation={this.onAddExpandedCalculation}
          onEditCalculation={this.onEditCalculation}
          onDeleteCalculation={this.onDeleteCalculation}
          position={{
            top: this.state.customFieldPanelPosition.y,
            left: this.state.customFieldPanelPosition.x,
          }}
        />
      );
    }
    return null;
  }

  // One panel for both Queried fields and Custom fields
  renderFieldsPanel() {
    // TODO(catherine) - 'x' cursor if editMode & click field being edited
    return (
      <FieldsPanel
        fields={this.props.fields.concat(this.props.customFields)}
        onFieldClick={this.onFieldClick}
        title={TEXT.FieldsPanel.title}
        tooltip={TEXT.FieldsPanel.tooltip}
        onRequestViewCustomField={this.onRequestViewCustomField}
        customFieldErrorState={this.getCustomTagErrorState(
          this.props.customFields,
          this.props.fields,
        )}
      />
    );
  }

  renderFormulaPanel() {
    const {
      calculationName,
      formulaMetadata,
      formulaCursor,
      showValidator,
    } = this.state;
    return (
      <FormulaPanel
        calculationName={calculationName}
        formula={formulaMetadata}
        formulaCursor={formulaCursor}
        onCalculationNameChange={this.onCalculationNameChange}
        onFormulaChange={this.onFormulaChange}
        onFormulaCursorChange={this.onFormulaCursorChange}
        onRemoveFieldClick={this.onRemoveFieldClick}
        showValidator={showValidator}
      />
    );
  }

  renderCalculatorPanel() {
    return <CalculatorPanel onSymbolClick={this.onSymbolClick} />;
  }

  renderModalBody() {
    return (
      <div className="custom-calculations-modal__body">
        <div className="custom-calculations-modal__first-col">
          {this.renderFieldsPanel()}
          {this.maybeRenderCustomFieldViewPanel()}
        </div>
        <div className="custom-calculations-modal__second-col">
          {this.renderFormulaPanel()}
          {this.renderCalculatorPanel()}
        </div>
      </div>
    );
  }

  render() {
    return (
      <BaseModal
        className="custom-calculations-modal"
        show={this.props.show}
        onRequestClose={this.props.onRequestClose}
        primaryButtonText={this.state.editMode ? TEXT.edit : TEXT.apply}
        primaryButtonIntent={this.state.editMode ? 'success' : 'primary'}
        secondaryButtonText={this.state.editMode ? TEXT.cancel : ''}
        showSecondaryButton={this.state.editMode}
        onSecondaryAction={
          this.state.editMode ? this.onExitEditMode : undefined
        }
        showCloseButton={!this.state.editMode}
        closeButtonText="Close"
        onPrimaryAction={
          this.state.editMode
            ? this.onCalculationSubmitEdit
            : this.onCalculationSubmit
        }
        width={780}
        defaultHeight={575}
        title={this.getTitle()}
        titleTooltip={this.state.editMode ? TEXT.editSubtitle : TEXT.subtitle}
      >
        {this.renderModalBody()}
      </BaseModal>
    );
  }
}

export default withScriptLoader(CustomCalculationsModal, VENDOR_SCRIPTS.toastr);
