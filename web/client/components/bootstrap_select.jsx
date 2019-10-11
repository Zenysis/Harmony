// @flow
import * as React from 'react';

// Wrapper around bootstrap select elements that hides the jquery
// usage. Forwards all props into the bootstrap-select element.
type BootstrapSelectOptions = {
  actionsBox?: boolean,
  container?: string | boolean,
  countSelectedText?: string | Function,
  deselectAllText?: string,
  dropdownAlignRight?: string | boolean,
  dropupAuto?: boolean,
  header?: string,
  hideDisabled?: boolean,
  iconBase?: string,
  liveSearch?: boolean,
  liveSearchNormalize?: boolean,
  liveSearchPlaceholder?: string,
  liveSearchStyle?: string,
  maxOptions?: number | boolean,
  maxOptionsText?: string | Array<any> | Function,
  mobile?: boolean,
  multipleSeparator?: string,
  noneSelectedText?: string,
  selectAllText?: string,
  selectedTextFormat?: string,
  selectOnTab?: boolean,
  showContent?: boolean,
  showIcon?: boolean,
  showSubtext?: boolean,
  showTick?: boolean,
  size?: string | number | boolean,
  style?: string,
  tickIcon?: string,
  title?: string,
  width?: string | boolean,
};

type PickerMethods = ((opts?: BootstrapSelectOptions) => void) &
  ((method: string, value: mixed) => void);

type BSelect = {
  selectpicker: PickerMethods,
};

type Props = {
  children: React.Node,
  value: $ReadOnlyArray<string> | string,
  multiple: boolean,
  onChange: (e: SyntheticEvent<HTMLSelectElement>) => void,

  className: string,
  title: string,
};

export default class BootstrapSelect extends React.Component<Props> {
  static defaultProps = {
    className: '',
    title: '',
  };

  _$select: BSelect | void = undefined;
  _selectRef: $RefObject<'select'> = React.createRef();

  componentDidMount() {
    this._$select = ($(this._selectRef.current || undefined): any);
    if (this._$select) {
      this._$select.selectpicker({
        dropupAuto: false,
      });
    }
  }

  componentDidUpdate() {
    const picker = this._$select;
    if (picker) {
      picker.selectpicker('val', this.props.value);
      picker.selectpicker('refresh');
    }
  }

  render() {
    const { children, ...selectProps } = this.props;
    return (
      <select ref={this._selectRef} {...selectProps}>
        {children}
      </select>
    );
  }
}
