// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import InputText from 'components/ui/InputText';
import { autobind } from 'decorators';
import { noop } from 'util/util';
import type { ChildProps } from 'components/AdminApp/ConfigurationTab/ConfigurationEntry';

const KEY_TEXT = t('admin_app.configuration.keys');

type State = {
  inputtedText: string,
};

export default class TextControl extends React.PureComponent<
  ChildProps,
  State,
> {
  static defaultProps = {
    onConfigurationUpdated: noop,
  };

  state = {
    inputtedText: this.props.configuration.value(),
  };

  componentDidUpdate(prevProps: ChildProps) {
    const currentValue = this.props.configuration.value();
    if (prevProps.configuration.value() !== currentValue) {
      this.setState({
        inputtedText: currentValue,
      });
    }
  }

  @autobind
  onTextEntered(inputtedText: string) {
    this.setState({
      inputtedText,
    });
  }

  @autobind
  onConfigurationUpdated() {
    const { configuration, onConfigurationUpdated } = this.props;
    onConfigurationUpdated(configuration.value(this.state.inputtedText));
  }

  render() {
    const { configuration } = this.props;
    const controlClassName = `configuration-tab__text configuration-tab__text__${configuration.key()}`;
    const saveText: string = t(
      'admin_app.configuration.textConfiguration.saveText',
      {
        key: KEY_TEXT[configuration.key()],
      },
    );

    return (
      <div className="configuration-tab__row">
        <InputText
          className={controlClassName}
          value={this.state.inputtedText}
          onChange={this.onTextEntered}
          width="50%"
        />
        <div className="configuration-tab__controls">
          <Button
            className="configuration-tab__button"
            onClick={this.onConfigurationUpdated}
          >
            {saveText}
          </Button>
        </div>
      </div>
    );
  }
}
