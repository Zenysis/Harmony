// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
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
          className="custom-calculations-custom-field-panel__btn u-info-text"
          onClick={this.onAddCalculation}
          role="button"
        >
          {renderIcon('plus-sign')}
          {I18N.text('Add to formula')}
        </div>
        <div
          className="custom-calculations-custom-field-panel__btn u-info-text"
          onClick={this.onEditCalculation}
          role="button"
        >
          {renderIcon('edit')}
          {I18N.textById('Edit formula')}
        </div>
        <div
          className="custom-calculations-custom-field-panel__btn u-info-text"
          onClick={this.onDeleteCalculation}
          role="button"
        >
          {renderIcon('trash')}
          {I18N.text('Delete calculation')}
        </div>
        <div
          className="custom-calculations-custom-field-panel__btn u-info-text"
          onClick={this.props.onCloseWindow}
          role="button"
        >
          {renderIcon('remove-sign')}
          {I18N.text('Close panel')}
        </div>
      </>
    );
  }

  render(): React.Node {
    return (
      <Group.Horizontal
        className="custom-calculations-custom-field-panel"
        flex
        paddingRight="m"
      >
        <Group.Item className="custom-calculations-custom-field-panel__btn-list">
          {this.renderEditorButtons()}
        </Group.Item>
        <Group.Vertical
          lastItemStyle={{ textAlign: 'right' }}
          paddingBottom="s"
          paddingTop="m"
        >
          <PrettyFormulaViewer
            field={this.props.field}
            maxHeight={120}
            maxWidth={420}
          />
          <span
            className="custom-calculations-custom-field-panel__plain-text-btn"
            onClick={this.onAddExpandedCalculation}
            role="button"
          >
            {I18N.text('Add expanded calculation to formula >>')}
          </span>
        </Group.Vertical>
      </Group.Horizontal>
    );
  }
}
