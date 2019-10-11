// @flow
import * as React from 'react';

import InputModal from 'components/common/InputModal';
import autobind from 'decorators/autobind';

const TEXT = t('admin_app.groups.new_group_modal');

type Props = {
  onCreateGroupRequested: (groupName: string) => void,
  onRequestClose: () => void,
  show: boolean,

  primaryButtonText: string,
  title: string,
};

export default class NewGroupModal extends React.PureComponent<Props> {
  static defaultProps = {
    primaryButtonText: TEXT.primary_button_text,
    title: TEXT.title,
  };

  @autobind
  onNewGroupNameSelected(newGroupName: string) {
    this.props.onCreateGroupRequested(newGroupName);
  }

  render() {
    const { onRequestClose, show, title, primaryButtonText } = this.props;
    return (
      <InputModal
        className="new-group-modal"
        onPrimaryAction={this.onNewGroupNameSelected}
        onRequestClose={onRequestClose}
        width={600}
        defaultHeight={350}
        textElement={TEXT.new_group_prompt}
        show={show}
        title={title}
        primaryButtonText={primaryButtonText}
      />
    );
  }
}
