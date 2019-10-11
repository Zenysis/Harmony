// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import DropdownControl from 'components/visualizations/common/controls/DropdownControl';

type DropdownControlProps = $Diff<
  React.ElementConfig<typeof DropdownControl>,
  { children: any },
>;

type Props = $Merge<
  DropdownControlProps,
  {
    optionValues: Array<string>,
  },
>;

export default class LineStyleDropdownControl extends React.PureComponent<Props> {
  static defaultProps = {
    ...DropdownControl.defaultProps,
    colsControl: 6,
    colsLabel: 6,
    colsWrapper: 6,
  };

  getDropdownOptions(): React.ChildrenArray<
    React.Element<typeof Dropdown.Option>,
  > {
    return this.props.optionValues.map(value => (
      <Dropdown.Option key={value} value={value}>
        {value}
      </Dropdown.Option>
    ));
  }

  render() {
    const { optionValues, ...passThroughProps } = this.props;
    return (
      <DropdownControl {...passThroughProps}>
        {this.getDropdownOptions()}
      </DropdownControl>
    );
  }
}
