// @flow
import * as React from 'react';
import RichTextEditor from 'react-rte';

import DashboardEditableText from 'models/core/Dashboard/DashboardSpecification/DashboardEditableText';
import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';

const TOOLBAR_CONFIG = {
  // Optionally specify the groups to display (displayed in the order listed).
  display: [
    'INLINE_STYLE_BUTTONS',
    'BLOCK_TYPE_BUTTONS',
    'BLOCK_TYPE_DROPDOWN',
    'HISTORY_BUTTONS',
  ],
  INLINE_STYLE_BUTTONS: [
    { label: 'Bold', style: 'BOLD', className: 'custom-css-class' },
    { label: 'Italic', style: 'ITALIC' },
    { label: 'Underline', style: 'UNDERLINE' },
  ],
  BLOCK_TYPE_DROPDOWN: [
    { label: 'Normal', style: 'unstyled' },
    { label: 'Heading Large', style: 'header-one' },
    { label: 'Heading Medium', style: 'header-two' },
    { label: 'Heading Small', style: 'header-three' },
  ],
  BLOCK_TYPE_BUTTONS: [
    { label: 'UL', style: 'unordered-list-item' },
    { label: 'OL', style: 'ordered-list-item' },
  ],
};
const TEXT = t('dashboard.DashboardItem');

type Props = {
  // a unique identifier for this DashboardItem component
  id: string,
  isLocked: boolean,
  onDeleteClicked: (componentId: string) => void,
  onLockToggled: (componentId: string, isLocked: boolean) => void,
  onTextChanged: (textItem: Object) => void,
  textElement: DashboardEditableText,
};

type State = {
  readOnly: boolean,
};

export default class DashboardEditableTextItem extends React.PureComponent<
  Props,
  State,
> {
  state = {
    readOnly: false,
  };

  @autobind
  onChangeReadOnly() {
    this.setState(prevState => ({ readOnly: !prevState.readOnly }));
  }

  @autobind
  onChangeEditableText(richTextItem: Object) {
    // TODO(pablo): add flow type annotations for RichTextEditor lib
    const { onTextChanged, textElement } = this.props;
    onTextChanged(textElement.text(richTextItem));
  }

  @autobind
  onToggleLock() {
    const { id, isLocked, onLockToggled } = this.props;
    onLockToggled(id, !isLocked);
  }

  @autobind
  onDeleteClick() {
    const { id, onDeleteClicked } = this.props;
    onDeleteClicked(id);
  }

  renderDashboardItemButtons() {
    // TODO(moriah, nina): These buttons and functionality should eventually be
    // moved out into the parent component and share functionality with the
    // corresponding buttons in the DashboardQueryItem.
    const { isLocked } = this.props;
    const lockState = isLocked ? 'lock' : 'unlock';
    const lockText = isLocked ? TEXT.unlock : TEXT.lock;
    const editText = this.state.readOnly
      ? TEXT.showTextEdit
      : TEXT.hideTextEdit;
    return (
      <div className="dashboard-item-buttons hide-in-screenshot">
        <button
          type="button"
          className="dashboard-item-button"
          onClick={this.onToggleLock}
          data-content={lockText}
        >
          <Icon
            type="lock"
            className={`dash-item-${lockState}-icon`}
            ariaHidden
          />
        </button>
        <button
          type="button"
          className="dashboard-item-button"
          onClick={this.onDeleteClick}
          data-content={TEXT.delete}
        >
          <Icon type="remove" ariaHidden />
        </button>
        <button
          type="button"
          className="dashboard-item-button"
          onClick={this.onChangeReadOnly}
          data-content={editText}
        >
          <Icon type="edit" ariaHidden />
        </button>
      </div>
    );
  }

  renderRichTextEditor() {
    return (
      <div className="query-results-container query-result-grid result-container">
        <RichTextEditor
          className="visualization-container"
          toolbarConfig={TOOLBAR_CONFIG}
          value={this.props.textElement.text()}
          onChange={this.onChangeEditableText}
          placeholder={TEXT.textElementPlaceholder}
          readOnly={this.state.readOnly}
          autoFocus
        />
      </div>
    );
  }

  render() {
    return (
      <div className="dashboard-item-container">
        <div className="dashboard-item">
          {this.renderRichTextEditor()}
          {this.renderDashboardItemButtons()}
        </div>
      </div>
    );
  }
}
