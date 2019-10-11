// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';

import CustomField from 'models/core/Field/CustomField';
import LegacyButton from 'components/ui/LegacyButton';
import PrettyFormulaViewer from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsModal/PrettyFormulaViewer';
import { autobind } from 'decorators';
import type { StyleObject } from 'types/jsCore';

type Position = {
  top: number,
  left: number,
};

type Props = {
  field: CustomField,

  /**
   * Adds the custom field to the formula editor as a single field
   */
  onAddCalculation: (field: CustomField) => void,

  /**
   * Adds the formula that composes the custom calculation to
   * the formula editor.
   */
  onAddExpandedCalculation: (field: CustomField) => void,
  onCloseWindow: () => void,
  onDeleteCalculation: (field: CustomField) => void,
  onEditCalculation: (field: CustomField) => void,
  position: Position,
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
  // the node in which we will render this panel
  _portalNode: HTMLDivElement = document.createElement('div');
  _mainDivElt: $RefObject<'div'> = React.createRef();

  componentDidMount() {
    document.addEventListener('click', this.onDocumentClick);
    if (document.body) {
      document.body.appendChild(this._portalNode);
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
    if (document.body) {
      document.body.removeChild(this._portalNode);
    }
  }

  @autobind
  didClickOutsidePanel(event: MouseEvent): boolean {
    if (this._mainDivElt.current && event.target instanceof window.Node) {
      return !this._mainDivElt.current.contains(event.target);
    }
    return false;
  }

  getPanelStyle(): StyleObject {
    const top = this.props.position.top + 20;
    const left = this.props.position.left - 200;

    return {
      top,
      left,
      position: 'fixed',
    };
  }

  @autobind
  onDocumentClick(event: MouseEvent) {
    if (this.didClickOutsidePanel(event)) {
      this.props.onCloseWindow();
    }
  }

  @autobind
  onAddCalculation() {
    this.props.onAddCalculation(this.props.field);
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

  renderDropdownTriangle() {
    const style = {
      top: this.props.position.top + 4,
      left: this.props.position.left - 10,
    };
    return (
      <div
        className="custom-calculations-custom-field-panel__triangle"
        style={style}
      />
    );
  }

  renderEditorButtons() {
    const btnClass = 'custom-calculations-custom-field-panel__button';
    const btnStyle = { borderColor: 'transparent', borderRadius: '3px' };
    return (
      <div className="custom-calculations-custom-field-panel__menu-col">
        <LegacyButton
          style={btnStyle}
          className={btnClass}
          onClick={this.onAddCalculation}
        >
          {renderIcon('plus-sign')}
          {TEXT.CustomFieldPanel.addFormula}
        </LegacyButton>
        <LegacyButton
          style={btnStyle}
          className={btnClass}
          onClick={this.onEditCalculation}
        >
          {renderIcon('edit')}
          {TEXT.CustomFieldPanel.editFormula}
        </LegacyButton>
        <LegacyButton
          style={btnStyle}
          className={btnClass}
          onClick={this.onDeleteCalculation}
        >
          {renderIcon('trash')}
          {TEXT.CustomFieldPanel.deleteCalculation}
        </LegacyButton>
        <LegacyButton
          style={btnStyle}
          className={btnClass}
          onClick={this.props.onCloseWindow}
        >
          {renderIcon('remove-sign')}
          {TEXT.CustomFieldPanel.closePanel}
        </LegacyButton>
      </div>
    );
  }

  @autobind
  renderPlainTextButton() {
    return (
      <LegacyButton
        type={LegacyButton.Intents.LINK}
        className="custom-calculations-custom-field-panel__plain-text-btn"
        onClick={this.onAddExpandedCalculation}
      >
        {TEXT.CustomFieldPanel.addExpandedCalculation}
      </LegacyButton>
    );
  }

  @autobind
  renderPrettyFormulaViewer() {
    return (
      <PrettyFormulaViewer
        className="custom-calculations-custom-field-panel__formula-viewer"
        field={this.props.field}
        maxWidth={420}
        maxHeight={120}
      />
    );
  }

  render() {
    return ReactDOM.createPortal(
      <React.Fragment>
        {this.renderDropdownTriangle()}
        <div
          className="custom-calculations-custom-field-panel"
          style={this.getPanelStyle()}
          ref={this._mainDivElt}
        >
          <div className="custom-calculations-custom-field-panel__body">
            {this.renderEditorButtons()}
            {this.renderPlainTextButton()}
            {this.renderPrettyFormulaViewer()}
          </div>
        </div>
      </React.Fragment>,
      this._portalNode,
    );
  }
}
