import React from 'react';
import PropTypes from 'prop-types';
import CheckableItem from 'components/common/util/CheckableItem';
import CheckableItemWrapper from 'components/common/util/CheckableItemWrapper';
import ZenPropTypes from 'util/ZenPropTypes';

export const RadioItem = CheckableItem;

/**
 * Usage:
 *   Uncontrolled component: (only set initial value)
 *     <RadioGroup initialValue="top" onChange={...}>
 *       <RadioItem value="top">Top</RadioItem>
 *       <RadioItem value="left">Left</RadioItem>
 *       <RadioItem value="right">Right</RadioItem>
 *       <RadioItem value="bottom">Bottom</RadioItem>
 *     </RadioGroup>
 *
 *  Controlled component: (set current value through prop)
 *    <RadioGroup value={val} onChange={...}>
 *      <RadioItem value="top">Top</RadioItem>
 *      <RadioItem value="left">Left</RadioItem>
 *      <RadioItem value="right">Right</RadioItem>
 *      <RadioItem value="bottom">Bottom</RadioItem>
 *    </RadioGroup>
 */

const propTypes = {
  // Children must be of type RadioItem
  children: ZenPropTypes.componentsOfType(RadioItem),
  className: PropTypes.string,
  id: PropTypes.string,
  initialValue: ZenPropTypes.all([
    // use initialValue if component is uncontrolled
    PropTypes.string,
    ZenPropTypes.xor('value'),
  ]),
  name: PropTypes.string, // an optional name used to identify the radio group
  onChange: PropTypes.func, // f(selectedValue, name, event)
  value: ZenPropTypes.all([
    // if using as a controlled component
    PropTypes.string,
    ZenPropTypes.alsoRequires('onChange'),
  ]),
};

const defaultProps = {
  children: null,
  className: '',
  id: '',
  initialValue: undefined,
  name: '',
  onChange: undefined,
  value: undefined,
};

export default class RadioGroup extends React.PureComponent {
  constructor(props) {
    super(props);
    const { value, initialValue } = this.props;
    this._isControlledComponent = value !== undefined;

    if (!this._isControlledComponent) {
      this.state = {
        selectedValue: initialValue,
      };
    }
    this.onItemSelect = this.onItemSelect.bind(this);
  }

  getValue() {
    return this._isControlledComponent
      ? this.props.value
      : this.state.selectedValue;
  }

  onItemSelect(selectedValue, name, event) {
    if (!this._isControlledComponent) {
      this.setState({ selectedValue });
    }

    if (this.props.onChange) {
      this.props.onChange(selectedValue, name, event);
    }
  }

  renderRadioItems() {
    const { children, id, name } = this.props;
    const value = this.getValue();
    return React.Children.map(children, radioItem => (
      <CheckableItemWrapper
        key={radioItem.props.value}
        id={`${id}-${radioItem.props.value}`}
        itemType="radio"
        className={radioItem.props.className}
        name={name}
        onSelect={this.onItemSelect}
        selected={radioItem.props.value === value}
        disabled={radioItem.props.disabled}
      >
        {radioItem}
      </CheckableItemWrapper>
    ));
  }

  render() {
    const { className } = this.props;

    return (
      <div className={`zen-radio ${className}`}>{this.renderRadioItems()}</div>
    );
  }
}

RadioGroup.propTypes = propTypes;
RadioGroup.defaultProps = defaultProps;
