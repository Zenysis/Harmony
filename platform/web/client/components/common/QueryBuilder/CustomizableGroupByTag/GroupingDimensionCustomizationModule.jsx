// @flow
import * as React from 'react'; // eslint-disable-line no-unused-vars

import Checkbox from 'components/ui/Checkbox';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';

type Props = {
  itemToCustomize: GroupingDimension,
  onItemCustomized: (item: GroupingDimension) => void,
};

export default class GroupingDimensionCustomizationModule extends React.Component<Props> {
  @autobind
  onLabelChange(label: string) {
    const { itemToCustomize, onItemCustomized } = this.props;

    const prevLabel = itemToCustomize.name();

    onItemCustomized(itemToCustomize.name(label));
  }

  @autobind
  onIncludeNullChange(value: boolean) {
    const { itemToCustomize, onItemCustomized } = this.props;
    const groupingValue = itemToCustomize.name();
    onItemCustomized(itemToCustomize.includeNull(value));
  }

  @autobind
  onIncludeTotalChange(value: boolean) {
    const { itemToCustomize, onItemCustomized } = this.props;
    const groupingValue = itemToCustomize.name();
    onItemCustomized(itemToCustomize.includeTotal(value));
  }

  @autobind
  onIncludeAllChange(value: boolean) {
    const { itemToCustomize, onItemCustomized } = this.props;
    const groupingValue = itemToCustomize.name();
    onItemCustomized(itemToCustomize.includeAll(value));
  }

  renderTotalOptionLabel(): React.Node {
    return (
      <div className="group-customization-module__total-option">
        <I18N.Ref id="includeTotal" />
        <InfoTooltip
          text={I18N.text(
            'This option adds a total row across all values for this group by. If more than one group by is selected, the total row will be added for each section within the parent group.',
            'dimensionTotalTooltip',
          )}
          tooltipPlacement="right"
        />
      </div>
    );
  }

  renderAllOptionLabel(): React.Node {
    const tooltipText = I18N.text(
      'When possible, include all %(dimension)s values in the result even if they have no data. Warning: This option can cause your query to be much slower.',
      'dimensionAllTooltip',
      {
        dimension: getFullDimensionName(this.props.itemToCustomize.dimension()),
      },
    );
    return (
      <div className="group-customization-module__all-option">
        <I18N id="forceAllValuesToBeIncluded">
          Force all values to be included (slow)
        </I18N>
        <InfoTooltip text={tooltipText} tooltipPlacement="right" />
      </div>
    );
  }

  render(): React.Node {
    const { itemToCustomize } = this.props;
    const checkboxID = `dimension--${itemToCustomize.id()}`;
    return (
      <div className="group-customization-module">
        <LabelWrapper label={I18N.textById('Label:')}>
          <InputText.Uncontrolled
            debounce
            debounceTimeoutMs={200}
            initialValue={itemToCustomize.name()}
            onChange={this.onLabelChange}
          />
        </LabelWrapper>
        <LabelWrapper
          htmlFor={`${checkboxID}--null`}
          inline
          label={I18N.text('Include empty values', 'includeNull')}
          labelAfter
        >
          <Checkbox
            id={`${checkboxID}--null`}
            onChange={this.onIncludeNullChange}
            value={itemToCustomize.includeNull()}
          />
        </LabelWrapper>
        <LabelWrapper
          htmlFor={`${checkboxID}--total`}
          inline
          label={this.renderTotalOptionLabel()}
          labelAfter
        >
          <Checkbox
            id={`${checkboxID}--total`}
            onChange={this.onIncludeTotalChange}
            value={itemToCustomize.includeTotal()}
          />
        </LabelWrapper>
      </div>
    );
  }
}
