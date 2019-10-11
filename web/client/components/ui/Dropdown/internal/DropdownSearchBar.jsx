// @flow
import * as React from 'react';

import InputText from 'components/ui/InputText';
import autobind from 'decorators/autobind';

type Props = {
  debounce: boolean,
  debounceTimeoutMs: number,
  onChange: (value: string, event: SyntheticEvent<HTMLInputElement>) => void,
  searchInputPlaceholder: string,

  extraClass: string,
  inputRef?: $RefObject<typeof InputText.Uncontrolled>,
};

export default class DropdownSearchBar extends React.PureComponent<Props> {
  static defaultProps = {
    extraClass: '',
    inputRef: undefined,
  };

  @autobind
  onInputClick(event: SyntheticEvent<HTMLInputElement>) {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  }

  render() {
    const {
      debounce,
      debounceTimeoutMs,
      inputRef,
      onChange,
      searchInputPlaceholder,
      extraClass,
    } = this.props;
    return (
      <div className={`zen-dropdown__search-bar ${extraClass}`}>
        <InputText.Uncontrolled
          ref={inputRef}
          icon="search"
          onClick={this.onInputClick}
          initialValue=""
          debounce={debounce}
          debounceTimeoutMs={debounceTimeoutMs}
          onChange={onChange}
          placeholder={searchInputPlaceholder}
        />
      </div>
    );
  }
}
