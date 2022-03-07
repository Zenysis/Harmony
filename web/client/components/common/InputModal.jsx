// @flow
import * as React from 'react';

import BaseModal from 'components/ui/BaseModal';
import InputText from 'components/ui/InputText';
import TextArea from 'components/common/TextArea';
import autobind from 'decorators/autobind';

type BaseModalProps = $Diff<
  React.ElementConfig<typeof BaseModal>,
  { onPrimaryAction: mixed },
>;

type DefaultProps = {
  initialInputValue: string,
  onPrimaryAction?: (
    inputValue: string,
    event: SyntheticEvent<HTMLButtonElement>,
  ) => void,
  placeholder: string,
  textElement: React.MixedElement | string,
  useTextArea: boolean,
};

type Props = {
  ...BaseModalProps,
  ...DefaultProps,
};

type State = {
  inputValue: string,
};

export default class InputModal extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    initialInputValue: '',
    onPrimaryAction: undefined,
    placeholder: '',
    textElement: '',
    useTextArea: false,
  };

  state: State = {
    inputValue: this.props.initialInputValue,
  };

  @autobind
  onInputValueChange(inputValue: string) {
    this.setState({ inputValue });
  }

  @autobind
  onPrimaryAction(event: SyntheticEvent<HTMLButtonElement>) {
    const { onPrimaryAction } = this.props;
    const { inputValue } = this.state;

    if (onPrimaryAction) {
      onPrimaryAction(inputValue, event);
    }
  }

  renderInputControl(): React.Node {
    const { placeholder, useTextArea } = this.props;
    const { inputValue } = this.state;

    if (useTextArea) {
      // TODO(pablo): Refactor this once we create our own <TextArea> component
      return (
        <TextArea
          value={inputValue}
          minHeight="80%"
          maxHeight="80%"
          onChange={this.onInputValueChange}
        />
      );
    }
    return (
      <InputText
        value={inputValue}
        placeholder={placeholder}
        onChange={this.onInputValueChange}
      />
    );
  }

  render(): React.Element<typeof BaseModal> {
    const {
      initialInputValue,
      onPrimaryAction,
      placeholder,
      textElement,
      useTextArea,
      ...passThroughProps
    } = this.props;
    return (
      <BaseModal onPrimaryAction={this.onPrimaryAction} {...passThroughProps}>
        <p>{this.props.textElement}</p>
        {this.renderInputControl()}
      </BaseModal>
    );
  }
}
