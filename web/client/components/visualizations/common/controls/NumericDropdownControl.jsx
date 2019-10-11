// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import DropdownControl from 'components/visualizations/common/controls/DropdownControl';
import autobind from 'decorators/autobind';

type DropdownControlProps = $Diff<
  React.ElementConfig<typeof DropdownControl>,
  { children: any },
>;

type Props = $Merge<
  DropdownControlProps,
  {
    minValue: number,
    maxValue: number,
  },
>;

export default class NumericDropdownControl extends React.PureComponent<Props> {
  static defaultProps = {
    ...DropdownControl.defaultProps,
    minValue: 1,
    maxValue: 10,
  };

  @autobind
  getDropdownOptions() {
    const { minValue, maxValue } = this.props;
    const options = [];
    for (let i = minValue; i < maxValue + 1; i++) {
      options.push(
        <Dropdown.Option key={i} value={String(i)}>
          {i}
        </Dropdown.Option>,
      );
    }
    return options;
  }

  render() {
    const { minValue, maxValue, ...passThroughProps } = this.props;
    return (
      <DropdownControl {...passThroughProps}>
        {this.getDropdownOptions()}
      </DropdownControl>
    );
  }
}
