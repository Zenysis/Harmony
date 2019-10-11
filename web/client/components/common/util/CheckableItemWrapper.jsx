// @flow
import * as React from 'react';

import CheckableItem from 'components/common/util/CheckableItem';
import autobind from 'decorators/autobind';
import classNames from 'classnames';

type Props = {
  children: React.Element<typeof CheckableItem>,
  itemType: 'radio' | 'checkbox',
  onSelect: (
    value: string,
    name: string,
    event: SyntheticEvent<HTMLInputElement>,
  ) => void,
  selected: boolean,

  className: string,
  id: string, // DOM ID for this item
  name: string,
};

const defaultProps = {
  className: '',
  id: '',
  name: '',
};

/**
 * Used to wrap <CheckableItem>.
 * This component should never be instantiated manually
 * It is only used internally by <Checkbox> or <Radio>
 */
export default class CheckableItemWrapper extends React.PureComponent<Props> {
  static defaultProps = defaultProps;

  @autobind
  onChange(event: SyntheticEvent<HTMLInputElement>) {
    this.props.onSelect(event.currentTarget.value, this.props.name, event);
  }

  render() {
    const { name, id, itemType, children, selected } = this.props;
    const className = classNames(this.props.className, itemType, {
      [`${itemType}--selected`]: selected,
    });
    const item = React.Children.only(children);

    return (
      <div className={className}>
        <label htmlFor={id}>
          <input
            onChange={this.onChange}
            type={itemType}
            id={id}
            name={name}
            value={item.props.value}
            checked={selected}
            disabled={item.props.disabled}
          />
          {item}
        </label>
      </div>
    );
  }
}
