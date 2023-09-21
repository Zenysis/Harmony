// @flow
import * as React from 'react';

import InputText from 'components/ui/InputText';
import autobind from 'decorators/autobind';

type DefaultProps = {
  extraClass: string,
  inputRef?: $ElementRefObject<typeof InputText.Uncontrolled>,
  testId?: string,
};

type Props = {
  ...DefaultProps,
  debounce: boolean,
  debounceTimeoutMs: number,
  onChange: (value: string, event: SyntheticEvent<HTMLInputElement>) => void,
  searchInputPlaceholder: string,
};

export default class DropdownSearchBar extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    extraClass: '',
    inputRef: undefined,
    testId: undefined,
  };

  @autobind
  onInputClick(event: SyntheticEvent<HTMLInputElement>) {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  }

  render(): React.Element<'div'> {
    const {
      debounce,
      debounceTimeoutMs,
      extraClass,
      inputRef,
      onChange,
      searchInputPlaceholder,
      testId,
    } = this.props;
    return (
      <div className={`zen-dropdown__search-bar ${extraClass}`}>
        <InputText.Uncontrolled
          ref={inputRef}
          debounce={debounce}
          debounceTimeoutMs={debounceTimeoutMs}
          icon="search"
          initialValue=""
          onChange={onChange}
          onClick={this.onInputClick}
          placeholder={searchInputPlaceholder}
          testId={testId}
        />
      </div>
    );
  }
}
