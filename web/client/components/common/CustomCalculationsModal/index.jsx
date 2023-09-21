// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import CustomField from 'models/core/Field/CustomField';
import CustomFieldPanel from 'components/common/CustomCalculationsModal/CustomFieldPanel';
import FieldsPanel from 'components/common/CustomCalculationsModal/FieldsPanel';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import FormulaPanel from 'components/common/CustomCalculationsModal/FormulaPanel';
import I18N from 'lib/I18N';
import Popover from 'components/ui/Popover';
import Spacing from 'components/ui/Spacing';
import Toaster from 'components/ui/Toaster';
import autobind from 'decorators/autobind';
import buildDefaultCalculationName from 'components/common/CustomCalculationsModal/util/buildDefaultCalculationName';
import getDimensionsFromQueryResultSpec from 'components/common/CustomCalculationsModal/util/getDimensionsFromQueryResultSpec';
import memoizeOne from 'decorators/memoizeOne';
import {
  validateCalculationForSubmit,
  validateCalculationForSubmitEdit,
  ValidationException,
} from 'components/common/CustomCalculationsModal/util/validation';
import type Field from 'models/core/wip/Field';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';

type Props = {
  customFields: $ReadOnlyArray<CustomField>,
  onQueryResultSpecChange: QueryResultSpec => void,
  onRequestClose: () => void,
  queryResultSpec: QueryResultSpec,
  selectedFields: Zen.Array<Field>,
  seriesSettings: SeriesSettings,
  show: boolean,
};

type State = {
  calculationName: string,

  /**  The custom field tag whose menu is being viewed */
  customFieldPanelToView: CustomField | void,
  /** The custom field that is being edited if in editMode */
  customFieldToEdit: CustomField | void,

  editMode: boolean,
  formulaCursor: FormulaCursor,
  formulaMetadata: FormulaMetadata,

  /** On click on a custom field tag, open a menu panel underneath it */
  isCustomFieldPanelOpen: boolean,
};

export default class CustomCalculationsModal extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    calculationName: buildDefaultCalculationName(this.props.customFields),
    customFieldPanelToView: undefined,
    customFieldToEdit: undefined,
    editMode: false,
    formulaCursor: FormulaCursor.create({}),
    formulaMetadata: FormulaMetadata.create({
      dimensions: getDimensionsFromQueryResultSpec(this.props.queryResultSpec),
    }),
    isCustomFieldPanelOpen: false,
  };

  /**
   * Map of customField.id to a boolean
   * {true} invalid {false} valid
   *
   * A tag is considered invalid if a calculation or field that
   * it relies on does not exist or is, itself, invalid.
   */
  @memoizeOne
  getCustomTagErrorState(
    customFields: $ReadOnlyArray<CustomField>,
    fieldIds: $ReadOnlyArray<string>,
  ): { [string]: boolean, ... } {
    const errState = {};
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

        const fieldDoesntExist = !fieldIds.includes(id);
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
        return `${I18N.text('Editing')} ${this.state.calculationName}`;
      }
      return I18N.text('Editing Custom Calculation');
    }
    return I18N.text('Add Custom Calculation');
  }

  @autobind
  resetFormulaEditor() {
    this.setState({
      calculationName: buildDefaultCalculationName(this.props.customFields),
      formulaCursor: FormulaCursor.create({}),
      formulaMetadata: FormulaMetadata.create({
        dimensions: getDimensionsFromQueryResultSpec(
          this.props.queryResultSpec,
        ),
      }),
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
    const {
      onQueryResultSpecChange,
      queryResultSpec,
      seriesSettings,
    } = this.props;
    const { calculationName, formulaMetadata } = this.state;

    try {
      const formula = validateCalculationForSubmit(
        calculationName,
        formulaMetadata,
        seriesSettings,
      );
      const customField = CustomField.createWithUniqueId({
        formula,
        label: calculationName,
      });
      const newQueryResultSpec = queryResultSpec.addNewCustomField(customField);
      onQueryResultSpecChange(newQueryResultSpec);

      this.resetFormulaEditor();
    } catch (err) {
      if (err instanceof ValidationException) {
        Toaster.error(err.message);
      }
    }
  }

  @autobind
  onCalculationSubmitEdit() {
    const {
      customFields,
      onQueryResultSpecChange,
      queryResultSpec,
    } = this.props;
    const {
      calculationName,
      customFieldToEdit,
      editMode,
      formulaMetadata,
    } = this.state;

    if (editMode) {
      invariant(
        customFieldToEdit !== undefined,
        'Cannot be in custom calculation edit mode without a field to edit',
      );

      // TODO: Is this edge case even possible? Can you actually edit
      // a calculation without it being the same as the one selected?
      const id = customFieldToEdit.id();
      try {
        const newCustomField = validateCalculationForSubmitEdit(
          customFields,
          customFieldToEdit,
          formulaMetadata,
          id,
          calculationName,
        );
        let newSpec = queryResultSpec.changeExistingCustomField(
          customFieldToEdit,
          newCustomField,
        );

        if (customFieldToEdit.label() !== newCustomField.label()) {
          // remember to update all the labels for the series as well if the
          // calculation name changed!
          newSpec = newSpec.updateGlobalSeriesObjectValue(
            id,
            'label',
            calculationName,
          );
        }
        onQueryResultSpecChange(newSpec);
      } catch (e) {
        if (e instanceof ValidationException) {
          Toaster.error(e.message);
        }
        return;
      }
    }

    this.setState({ customFieldToEdit: undefined, editMode: false }, () =>
      this.resetFormulaEditor(),
    );
  }

  /**
   * Adds field to the Formula Editor as a single Custom Field
   * Can be renamed onAddCalculation
   */
  @autobind
  onFieldClick(fieldId: string) {
    // TODO - if in editMode, should prevent adding
    // a calc that depends on the calc being edited
    this.setState(
      ({ customFieldToEdit, editMode, formulaCursor, formulaMetadata }) => {
        if (
          !editMode ||
          customFieldToEdit === undefined ||
          customFieldToEdit.id() !== fieldId
        ) {
          const { selectedFields, seriesSettings } = this.props;
          const fieldLabel = seriesSettings.seriesObjects()[fieldId].label();
          const field = selectedFields.find(
            currField => currField.id() === fieldId,
          );
          const newFormula = formulaMetadata.addField(
            {
              fieldId,
              fieldLabel,
              treatNoDataAsZero: field ? field.showNullAsZero() : false,
            },
            formulaCursor,
          );

          // Set new cursor position
          const start = formulaCursor.start();
          const fieldText = `${fieldLabel} `;
          const newPosition = CursorPosition.create({
            lineNumber: start.lineNumber(),
            offset: start.offset() + fieldText.length,
          });
          const newCursor = formulaCursor.start(newPosition).collapseToStart();
          return {
            formulaCursor: newCursor,
            formulaMetadata: newFormula,
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
  onRemoveFieldClick({
    endIndex,
    fieldId,
    lineNumber,
    startIndex,
  }: {
    endIndex: number,
    fieldId: string,
    lineNumber: number,
    startIndex: number,
  }) {
    this.setState(prevState => {
      const { formulaCursor, formulaMetadata } = prevState;
      const newMetadata = formulaMetadata.removeField(
        fieldId,
        lineNumber,
        startIndex,
        endIndex,
      );
      const newCursor = formulaCursor
        .start(CursorPosition.create({ lineNumber, offset: startIndex }))
        .collapseToStart();

      return {
        formulaCursor: newCursor,
        formulaMetadata: newMetadata,
      };
    });
  }

  /**
   * This callback handles updating a field's configuration within a formula.
   * For example, should this field treat 'No data' as 0?
   */
  @autobind
  onUpdateFieldConfiguration(fieldId: string, treatNoDataAsZero: boolean) {
    this.setState(({ formulaMetadata }) => {
      const newFieldConfigurations = formulaMetadata
        .fieldConfigurations()
        .set(fieldId, { fieldId, treatNoDataAsZero });

      return {
        formulaMetadata: formulaMetadata.fieldConfigurations(
          newFieldConfigurations,
        ),
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
          customFieldPanelToView: value,
          isCustomFieldPanelOpen: true,
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
  onFormulaChange(formulaMetadata: FormulaMetadata) {
    this.setState({ formulaMetadata });
  }

  @autobind
  onFormulaCursorChange(formulaCursor: FormulaCursor) {
    this.setState({ formulaCursor });
  }

  @autobind
  onDeleteCalculation(field: CustomField) {
    const { onQueryResultSpecChange, queryResultSpec } = this.props;
    onQueryResultSpecChange(queryResultSpec.removeExistingCustomField(field));
  }

  /**
   * Triggered from clicking Edit calculation button in the
   * CustomFieldPanel and allows the user to edit a previous
   * custom calculation, transforming the Custom Calculation Modal
   * into edit mode.
   */
  @autobind
  onSelectCalculationForEdit(field: CustomField) {
    // TODO - Trigger popup here
    // Do you want to save the calculation you're working on? yes/no

    this.setState((prevState, props) => {
      const { formulaCursor } = prevState;
      const { formula, id, label } = field.modelValues();
      const { metadata } = formula.modelValues();
      const { lines } = metadata.modelValues();

      const newPosition = CursorPosition.create({
        lineNumber: lines.size() - 1,
        offset: lines.last().length,
      });
      const series = props.seriesSettings.seriesObjects()[id];
      return {
        calculationName: series ? series.label() : label,
        customFieldToEdit: field,
        editMode: true,
        formulaCursor: formulaCursor.start(newPosition).collapseToStart(),
        formulaMetadata: metadata,
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
      const { formulaCursor, formulaMetadata } = prevState;
      const { dimensions, fields, lines } = formulaMetadata.modelValues();
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
        dimensions,
        fields: fields.slice().concat(metadataToAdd.fields()),
        lines: newLines,
      });

      // Calculate newPosition for the cursor based on the newLines
      const newPosition = CursorPosition.create({
        lineNumber: newLines.size() - 1,
        offset: newLines.last().length,
      });

      return {
        formulaCursor: formulaCursor.start(newPosition).collapseToStart(),
        formulaMetadata: newMetadata,
      };
    });
  }

  @autobind
  onSymbolClick(value: string) {
    this.setState(({ formulaCursor, formulaMetadata }) => {
      const newFormula = formulaMetadata.addSymbol(value, formulaCursor);

      // Set new cursor position
      const start = formulaCursor.start();
      const newPosition = CursorPosition.create({
        lineNumber: start.lineNumber(),
        offset: start.offset() + value.length,
      });
      const newCursor = formulaCursor.start(newPosition).collapseToStart();
      return {
        formulaCursor: newCursor,
        formulaMetadata: newFormula,
      };
    });
  }

  @autobind
  onExitEditMode() {
    this.resetFormulaEditor();
    this.setState({ customFieldToEdit: undefined, editMode: false });
  }

  @autobind
  maybeRenderCustomFieldViewPanel(): React.Element<typeof Popover> | null {
    const { customFieldPanelToView, isCustomFieldPanelOpen } = this.state;
    if (isCustomFieldPanelOpen && customFieldPanelToView) {
      return (
        <Popover
          anchorElt={customFieldPanelToView.id()}
          anchorOrigin="bottom right"
          containerType="empty"
          isOpen={isCustomFieldPanelOpen}
          onRequestClose={this.onRequestCloseCustomFieldView}
          popoverOrigin="top center"
        >
          <CustomFieldPanel
            field={customFieldPanelToView}
            onAddCalculation={this.onFieldClick}
            onAddExpandedCalculation={this.onAddExpandedCalculation}
            onCloseWindow={this.onRequestCloseCustomFieldView}
            onDeleteCalculation={this.onDeleteCalculation}
            onEditCalculation={this.onSelectCalculationForEdit}
          />
        </Popover>
      );
    }
    return null;
  }

  // One panel for both Queried fields and Custom fields
  renderFieldsPanel(): React.Element<typeof FieldsPanel> {
    // TODO - 'x' cursor if editMode & click field being edited
    const { customFields, seriesSettings } = this.props;
    const { formulaMetadata } = this.state;
    return (
      <FieldsPanel
        currentFormulaMetadata={formulaMetadata}
        customFieldErrorState={this.getCustomTagErrorState(
          customFields,
          seriesSettings.seriesOrder(),
        )}
        customFields={customFields}
        onFieldClick={this.onFieldClick}
        onRequestViewCustomField={this.onRequestViewCustomField}
        seriesSettings={seriesSettings}
        title={I18N.text('Fields and Calculations:')}
        tooltip={I18N.text(
          'Click on an indicator to add it to the formula. Or click on a custom calculation dropdown to see more options.',
        )}
      />
    );
  }

  renderFormulaPanel(): React.Element<typeof FormulaPanel> {
    const { calculationName, formulaCursor, formulaMetadata } = this.state;
    return (
      <FormulaPanel
        calculationName={calculationName}
        formula={formulaMetadata}
        formulaCursor={formulaCursor}
        onCalculationNameChange={this.onCalculationNameChange}
        onFormulaChange={this.onFormulaChange}
        onFormulaCursorChange={this.onFormulaCursorChange}
        onRemoveFieldClick={this.onRemoveFieldClick}
        onSymbolClick={this.onSymbolClick}
        onUpdateFieldConfiguration={this.onUpdateFieldConfiguration}
      />
    );
  }

  renderModalBody(): React.Element<'div'> {
    return (
      <div className="custom-calculations-modal__body">
        <Spacing className="custom-calculations-modal__first-col" padding="l">
          {this.renderFieldsPanel()}
          {this.maybeRenderCustomFieldViewPanel()}
        </Spacing>
        <Spacing className="custom-calculations-modal__second-col" padding="l">
          {this.renderFormulaPanel()}
        </Spacing>
      </div>
    );
  }

  render(): React.Node {
    return (
      <BaseModal
        className="custom-calculations-modal"
        closeButtonText={I18N.textById('Close')}
        onPrimaryAction={
          this.state.editMode
            ? this.onCalculationSubmitEdit
            : this.onCalculationSubmit
        }
        onRequestClose={this.props.onRequestClose}
        onSecondaryAction={
          this.state.editMode ? this.onExitEditMode : undefined
        }
        primaryButtonIntent={this.state.editMode ? 'success' : 'primary'}
        primaryButtonText={
          this.state.editMode ? I18N.textById('Save') : I18N.textById('Create')
        }
        secondaryButtonText={this.state.editMode ? I18N.textById('Close') : ''}
        show={this.props.show}
        showCloseButton={!this.state.editMode}
        showSecondaryButton={this.state.editMode}
        title={this.getTitle()}
        titleTooltip={
          this.state.editMode
            ? I18N.text(
                'Edit an existing custom calculation which will update the calculated values in your query results.',
              )
            : I18N.text(
                'Create a new indicator using mathematical operations or custom logic. Your calculation will show up as a new series in your query results.',
              )
        }
      >
        {this.renderModalBody()}
      </BaseModal>
    );
  }
}
