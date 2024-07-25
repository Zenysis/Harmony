// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import CustomizableTimeInterval from 'models/core/wip/QueryFilterItem/CustomizableTimeInterval';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import autobind from 'decorators/autobind';
import type DimensionValueFilterItem from 'models/core/wip/QueryFilterItem/DimensionValueFilterItem';

type Props<FilterItem: CustomizableTimeInterval | DimensionValueFilterItem> = {
  item: FilterItem,
  onItemCustomized: (item: FilterItem) => void,
};

// Normally we'd have this in CSS, but since this whole component is a temporary
// hack, it's easier having it here so that the hack touches less files.
const CHECKBOX_WRAPPER_STYLE = {
  display: 'inline-block',
  marginTop: 4,
};

export default class NegateFilterCheckbox<
  FilterItem: CustomizableTimeInterval | DimensionValueFilterItem,
> extends React.PureComponent<Props<FilterItem>> {
  getCheckboxLabel(): React.Node {
    return (
      <React.Fragment>
        {I18N.text('Enable NOT filter')}
        <InfoTooltip
          iconStyle={{ position: 'relative', top: 2 }}
          text={I18N.text(
            'Check "NOT" filters in order to remove rows with the selected values from your query results',
          )}
        />
      </React.Fragment>
    );
  }

  @autobind
  onChange(selected: boolean) {
    const { item, onItemCustomized } = this.props;
    let invertedItem;
    if (item.tag === 'DIMENSION_VALUE_FILTER_ITEM') {
      invertedItem = ((item.invert(selected): $Cast): FilterItem);
    } else {
      invertedItem = ((item.invert(selected): $Cast): FilterItem);
    }

    onItemCustomized(invertedItem);
  }

  render(): React.Node {
    const { item } = this.props;
    return (
      <div style={CHECKBOX_WRAPPER_STYLE}>
        <Checkbox
          label={this.getCheckboxLabel()}
          onChange={this.onChange}
          value={item.get('invert')}
        />
      </div>
    );
  }
}
