// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import InputText from 'components/ui/InputText';
import TextArea from 'components/common/TextArea';
import autobind from 'decorators/autobind';

type BaseModalProps = $Diff<
  React.ElementConfig<typeof BaseModal>,
  { onPrimaryAction: * },
>;

type Props = BaseModalProps & {
  initialInputValue: string,
  onPrimaryAction?: (
    inputValue: string,
    event: SyntheticEvent<HTMLButtonElement>,
  ) => void,
  placeholder: string,
  textElement: React.Element<any> | string,
  useTextArea: boolean,
};

export default class InputModal extends React.Component<Props> {
  static defaultProps = {
    initialInputValue: '',
    onPrimaryAction: undefined,
    placeholder: '',
    textElement: '',
    useTextArea: false,
  };

  _textAreaRef: $RefObject<typeof TextArea> = React.createRef();
  _inputTextRef: $RefObject<typeof InputText.Uncontrolled> = React.createRef();

  @autobind
  onPrimaryAction(event: SyntheticEvent<HTMLButtonElement>) {
    const { onPrimaryAction, useTextArea } = this.props;
    if (onPrimaryAction) {
      if (useTextArea && this._textAreaRef.current) {
        onPrimaryAction(this._textAreaRef.current.getValue(), event);
      } else if (!useTextArea && this._inputTextRef.current) {
        onPrimaryAction(this._inputTextRef.current.getValue(), event);
      }
    }
  }

  renderInputControl() {
    if (this.props.useTextArea) {
      // TODO(pablo): Refactor this once we create our own <TextArea> component
      return (
        <TextArea
          ref={this._textAreaRef}
          initialValue={this.props.initialInputValue}
          minHeight="80%"
          maxHeight="80%"
        />
      );
    }
    return (
      <InputText.Uncontrolled
        ref={this._inputTextRef}
        initialValue={this.props.initialInputValue}
        placeholder={this.props.placeholder}
      />
    );
  }

  render() {
    const { onPrimaryAction, ...passThroughProps } = this.props;

    return (
      <BaseModal onPrimaryAction={this.onPrimaryAction} {...passThroughProps}>
        <p>{this.props.textElement}</p>
        {this.renderInputControl()}
      </BaseModal>
    );
  }
}
