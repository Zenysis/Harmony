import React from 'react';
import PropTypes from 'prop-types';
import update from 'immutability-helper';
import CheckableItem from 'components/common/util/CheckableItem';
import CheckableItemWrapper from 'components/common/util/CheckableItemWrapper';
import ZenPropTypes from 'util/ZenPropTypes';

export const CheckboxItem = CheckableItem;

/**
 * Usage:
 *  <CheckboxGroup> allows multiple checkboxes to be selected.
 *  For a single checkbox, use <Checkbox /> instead.
 *
 *  Uncontrolled component: (only set initial value)
 *    <Checkbox initialValue={['option1']} onChange={...}>
 *      <CheckboxItem value="option1">Option 1</CheckboxItem>
 *      <CheckboxItem value="option2">Option 2</CheckboxItem>
 *    </Checkbox>
 *
 *  Controlled component: (set current value through prop)
 *    <Checkbox value={valArray} onChange={...}>
 *      <CheckboxItem value="option1">Option 1</CheckboxItem>
 *      <CheckboxItem value="option2">Option 2</CheckboxItem>
 *    </Checkbox>
 */

const propTypes = {
  children: ZenPropTypes.componentsOfType(CheckboxItem),
  className: PropTypes.string,
  initialValue: ZenPropTypes.all([
    // use initialValue if component is uncontrolled
    PropTypes.arrayOf(PropTypes.string),
    ZenPropTypes.xor('value'),
  ]),
  // an optional name used to identify the checkbox group
  name: PropTypes.string,
  onChange: PropTypes.func, // f(selectedItems, name, event)
  value: ZenPropTypes.all([
    // if using as a controlled component
    PropTypes.arrayOf(PropTypes.string),
    ZenPropTypes.alsoRequires('onChange'),
  ]),
};

const defaultProps = {
  children: null,
  className: '',
  initialValue: undefined,
  name: '',
  onChange: undefined,
  value: undefined,
};

function updateSelections(selectedValue, currentSelections) {
  const index = currentSelections.findIndex(val => val === selectedValue);
  if (index === -1) {
    // selectedValue not currently selected, so we add it
    return update(currentSelections, { $push: [selectedValue] });
  }
  // selectedValue already selected, so we remove it
  return update(currentSelections, { $splice: [[index, 1]] });
}

export default class CheckboxGroup extends React.PureComponent {
  constructor(props) {
    super(props);
    const { value, initialValue } = this.props;
    this._isControlledComponent = value !== undefined;

    if (!this._isControlledComponent) {
      this.state = {
        selections: initialValue,
      };
    }

    this.onItemSelect = this.onItemSelect.bind(this);
  }

  getValue() {
    return this._isControlledComponent
      ? this.props.value
      : this.state.selections;
  }

  onItemSelect(selectedValue, name, event) {
    const { onChange } = this.props;
    if (this._isControlledComponent) {
      const newValue = updateSelections(selectedValue, this.props.value);
      onChange(newValue, name, event);
    } else {
      event.persist(); // persist the event for the setState callback

      // We need an asynchronous callback here because the new state depends
      // on the previous state, so we can't know the new selections until
      // *after* setState() has finished. This is different from other
      // components, e.g. InputText, where the new state just depends on
      // event.target.value, so we can call the callback immediately.
      const callback = onChange
        ? () => onChange(this.state.selections, name, event)
        : undefined;
      this.setState((prevState) => {
        const selections = updateSelections(
          selectedValue,
          prevState.selections,
        );
        return { selections };
      }, callback);
    }
  }

  renderCheckboxItems() {
    const { children, name } = this.props;
    const selections = new Set(this.getValue());
    return React.Children.map(children, checkboxItem => (
      <CheckableItemWrapper
        key={checkboxItem.props.value}
        itemType="checkbox"
        className={checkboxItem.props.className}
        name={name}
        onSelect={this.onItemSelect}
        selected={selections.has(checkboxItem.props.value)}
      >
        {checkboxItem}
      </CheckableItemWrapper>
    ));
  }

  render() {
    const { className } = this.props;
    return (
      <div className={`zen-checkbox ${className}`}>
        {this.renderCheckboxItems()}
      </div>
    );
  }
}

CheckboxGroup.propTypes = propTypes;
CheckboxGroup.defaultProps = defaultProps;
