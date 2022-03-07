// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import PrettyFormulaViewer from 'components/common/CustomCalculationsModal/PrettyFormulaViewer';
import { autobind } from 'decorators';
import type CustomField from 'models/core/Field/CustomField';

type Props = {
  field: CustomField,

  /**
   * Adds the custom field to the formula editor as a single field
   */
  onAddCalculation: (fieldId: string, fieldLabel: string) => void,

  /**
   * Adds the formula that composes the custom calculation to
   * the formula editor.
   */
  onAddExpandedCalculation: (field: CustomField) => void,
  onCloseWindow: () => void,
  onDeleteCalculation: (field: CustomField) => void,
  onEditCalculation: (field: CustomField) => void,
};

const TEXT = t('QueryApp.CustomCalculationsModal');

function renderIcon(glyphiconType: string) {
  return (
    <span
      aria-hidden="true"
      className={`glyphicon glyphicon-${glyphiconType} custom-calculations-custom-field-panel__btn-icon`}
    />
  );
}

export default class CustomFieldPanel extends React.PureComponent<Props> {
  @autobind
  onAddCalculation() {
    const { field, onAddCalculation } = this.props;
    onAddCalculation(field.id(), field.label());
  }

  @autobind
  onAddExpandedCalculation() {
    this.props.onAddExpandedCalculation(this.props.field);
  }

  @autobind
  onEditCalculation() {
    this.props.onEditCalculation(this.props.field);
    // Feels better to close the window on edit
    this.props.onCloseWindow();
  }

  @autobind
  onDeleteCalculation() {
    this.props.onDeleteCalculation(this.props.field);
    // Closes on delete bc the tag disappears
    this.props.onCloseWindow();
  }

  renderEditorButtons(): React.MixedElement {
    return (
      <>
        <div
          role="button"
          onClick={this.onAddCalculation}
          className="custom-calculations-custom-field-panel__btn u-info-text"
        >
          {renderIcon('plus-sign')}
          {TEXT.CustomFieldPanel.addFormula}
        </div>
        <div
          role="button"
          onClick={this.onEditCalculation}
          className="custom-calculations-custom-field-panel__btn u-info-text"
        >
          {renderIcon('edit')}
          {TEXT.CustomFieldPanel.editFormula}
        </div>
        <div
          role="button"
          onClick={this.onDeleteCalculation}
          className="custom-calculations-custom-field-panel__btn u-info-text"
        >
          {renderIcon('trash')}
          {TEXT.CustomFieldPanel.deleteCalculation}
        </div>
        <div
          role="button"
          onClick={this.props.onCloseWindow}
          className="custom-calculations-custom-field-panel__btn u-info-text"
        >
          {renderIcon('remove-sign')}
          {TEXT.CustomFieldPanel.closePanel}
        </div>
      </>
    );
  }

  render(): React.Node {
    return (
      <Group.Horizontal
        flex
        className="custom-calculations-custom-field-panel"
        paddingRight="m"
      >
        <Group.Item className="custom-calculations-custom-field-panel__btn-list">
          {this.renderEditorButtons()}
        </Group.Item>
        <Group.Vertical
          paddingTop="m"
          paddingBottom="s"
          lastItemStyle={{ textAlign: 'right' }}
        >
          <PrettyFormulaViewer
            field={this.props.field}
            maxWidth={420}
            maxHeight={120}
          />
          <span
            role="button"
            className="custom-calculations-custom-field-panel__plain-text-btn"
            onClick={this.onAddExpandedCalculation}
          >
            {TEXT.CustomFieldPanel.addExpandedCalculation}
          </span>
        </Group.Vertical>
      </Group.Horizontal>
    );
  }
}
