// @flow
import * as React from 'react';
import invariant from 'invariant';

import * as Zen from 'lib/Zen';
import BaseModal from 'components/ui/BaseModal';
import CursorPosition from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/CursorPosition';
import CustomField from 'models/core/Field/CustomField';
import CustomFieldPanel from 'components/common/CustomCalculationsModal/CustomFieldPanel';
import FieldsPanel from 'components/common/CustomCalculationsModal/FieldsPanel';
import Formula from 'models/core/Field/CustomField/Formula';
import FormulaCursor from 'models/QueryResult/QueryResultActionButtons/CustomCalculationsModal/FormulaCursor';
import FormulaMetadata from 'models/core/Field/CustomField/Formula/FormulaMetadata';
import FormulaPanel from 'components/common/CustomCalculationsModal/FormulaPanel';
import Popover from 'components/ui/Popover';
import Spacing from 'components/ui/Spacing';
import Toaster from 'components/ui/Toaster';
import autobind from 'decorators/autobind';
import buildDefaultCalculationName from 'components/common/CustomCalculationsModal/util/buildDefaultCalculationName';
import getDimensionsFromQueryResultSpec from 'components/common/CustomCalculationsModal/util/getDimensionsFromQueryResultSpec';
import memoizeOne from 'decorators/memoizeOne';
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
  formulaCursor: FormulaCursor,
  formulaMetadata: FormulaMetadata,

  /** On click on a custom field tag, open a menu panel underneath it */
  isCustomFieldPanelOpen: boolean,

  /**  The custom field tag whose menu is being viewed */
  customFieldPanelToView: CustomField | void,

  /** The custom field that is being edited if in editMode */
  customFieldToEdit: CustomField | void,
  editMode: boolean,
};

const TEXT = t('QueryApp.CustomCalculationsModal');

export default class CustomCalculationsModal extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    calculationName: buildDefaultCalculationName(this.props.customFields),
    formulaCursor: FormulaCursor.create({}),
    formulaMetadata: FormulaMetadata.create({
      dimensions: getDimensionsFromQueryResultSpec(this.props.queryResultSpec),
    }),
    isCustomFieldPanelOpen: false,
    customFieldPanelToView: undefined,
    customFieldToEdit: undefined,
    editMode: false,
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
      formulaMetadata: FormulaMetadata.create({
        dimensions: getDimensionsFromQueryResultSpec(
          this.props.queryResultSpec,
        ),
      }),
      calculationName: buildDefaultCalculationName(this.props.customFields),
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

    // Do not allow calculations to be submitted if they have no name
    if (calculationName === '') {
      Toaster.error(TEXT.emptyNameError);
      return;
    }

    // Do not allow two custom calculations to have the same name
    const seriesObjects = seriesSettings.seriesObjects();
    const alreadyExists = Object.keys(seriesObjects).some(
      id => seriesObjects[id].label() === calculationName,
    );

    if (alreadyExists) {
      Toaster.error(TEXT.existingNameError);
      return;
    }

    if (!formulaMetadata.lines().some(line => line.trim() !== '')) {
      Toaster.error(TEXT.emptyFormulaError);
      return;
    }

    try {
      const formula = Formula.create({ metadata: formulaMetadata });
      onQueryResultSpecChange(
        queryResultSpec.addNewCustomField(
          CustomField.createWithUniqueId({
            formula,
            label: calculationName,
          }),
        ),
      );

      this.resetFormulaEditor();
      analytics.track('Custom calculation created');
    } catch (error) {
      Toaster.error(TEXT.invalidExpressionError);
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
      if (customFields.find(f => f.id() === id)) {
        const formula = Formula.create({ metadata: formulaMetadata });
        const newCustomField = customFieldToEdit.modelValues({
          formula,
          label: calculationName,
        });

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
  onFieldClick(fieldId: string) {
    // TODO(catherine) - if in editMode, should prevent adding
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
  onRemoveFieldClick({
    fieldId,
    lineNumber,
    startIndex,
    endIndex,
  }: {
    fieldId: string,
    lineNumber: number,
    startIndex: number,
    endIndex: number,
  }) {
    this.setState(prevState => {
      const { formulaMetadata, formulaCursor } = prevState;
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
        formulaMetadata: newMetadata,
        formulaCursor: newCursor,
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
          isCustomFieldPanelOpen: true,
          customFieldPanelToView: value,
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
    analytics.track('Custom calculation deleted');
  }

  /**
   * Triggered from clicking Edit calculation button in the
   * CustomFieldPanel and allows the user to edit a previous
   * custom calculation, transforming the Custom Calculation Modal
   * into edit mode.
   */
  @autobind
  onSelectCalculationForEdit(field: CustomField) {
    // TODO(catherine) - Trigger popup here
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
      const { lines, fields, dimensions } = formulaMetadata.modelValues();
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
  maybeRenderCustomFieldViewPanel(): React.Element<typeof Popover> | null {
    const { isCustomFieldPanelOpen, customFieldPanelToView } = this.state;
    if (isCustomFieldPanelOpen && customFieldPanelToView) {
      return (
        <Popover
          anchorElt={customFieldPanelToView.id()}
          isOpen={isCustomFieldPanelOpen}
          anchorOrigin="bottom right"
          popoverOrigin="top center"
          containerType="empty"
          onRequestClose={this.onRequestCloseCustomFieldView}
        >
          <CustomFieldPanel
            field={customFieldPanelToView}
            onCloseWindow={this.onRequestCloseCustomFieldView}
            onAddCalculation={this.onFieldClick}
            onAddExpandedCalculation={this.onAddExpandedCalculation}
            onEditCalculation={this.onSelectCalculationForEdit}
            onDeleteCalculation={this.onDeleteCalculation}
          />
        </Popover>
      );
    }
    return null;
  }

  // One panel for both Queried fields and Custom fields
  renderFieldsPanel(): React.Element<typeof FieldsPanel> {
    // TODO(catherine) - 'x' cursor if editMode & click field being edited
    const { customFields, seriesSettings } = this.props;
    const { formulaMetadata } = this.state;
    return (
      <FieldsPanel
        customFields={customFields}
        customFieldErrorState={this.getCustomTagErrorState(
          customFields,
          seriesSettings.seriesOrder(),
        )}
        currentFormulaMetadata={formulaMetadata}
        onFieldClick={this.onFieldClick}
        onRequestViewCustomField={this.onRequestViewCustomField}
        seriesSettings={seriesSettings}
        title={TEXT.FieldsPanel.title}
        tooltip={TEXT.FieldsPanel.tooltip}
      />
    );
  }

  renderFormulaPanel(): React.Element<typeof FormulaPanel> {
    const { calculationName, formulaMetadata, formulaCursor } = this.state;
    return (
      <FormulaPanel
        calculationName={calculationName}
        formula={formulaMetadata}
        formulaCursor={formulaCursor}
        onCalculationNameChange={this.onCalculationNameChange}
        onFormulaChange={this.onFormulaChange}
        onFormulaCursorChange={this.onFormulaCursorChange}
        onRemoveFieldClick={this.onRemoveFieldClick}
        onUpdateFieldConfiguration={this.onUpdateFieldConfiguration}
        onSymbolClick={this.onSymbolClick}
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
        closeButtonText={TEXT.cancel}
        onPrimaryAction={
          this.state.editMode
            ? this.onCalculationSubmitEdit
            : this.onCalculationSubmit
        }
        title={this.getTitle()}
        titleTooltip={this.state.editMode ? TEXT.editSubtitle : TEXT.subtitle}
      >
        {this.renderModalBody()}
      </BaseModal>
    );
  }
}
