// @flow
import * as React from 'react'; // eslint-disable-line no-unused-vars

import Checkbox from 'components/ui/Checkbox';
import InfoTooltip from 'components/ui/InfoTooltip';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import autobind from 'decorators/autobind';
import { getFullDimensionName } from 'models/core/wip/Dimension';
import type GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';

const TEXT_PATH =
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.GroupByCustomizationModule';
const TEXT = t(TEXT_PATH);

type Props = {
  itemToCustomize: GroupingDimension,
  onItemCustomized: (item: GroupingDimension) => void,
};

export default class GroupingDimensionCustomizationModule extends React.Component<Props> {
  @autobind
  onLabelChange(label: string) {
    const { itemToCustomize, onItemCustomized } = this.props;

    const prevLabel = itemToCustomize.name();
    analytics.track('Grouping Label Change', {
      newLabel: label,
      prevLabel,
    });

    onItemCustomized(itemToCustomize.name(label));
  }

  @autobind
  onIncludeNullChange(value: boolean) {
    const { itemToCustomize, onItemCustomized } = this.props;
    const groupingValue = itemToCustomize.name();
    analytics.track('Include Empty Values in Grouping', {
      groupingValue,
      value,
    });
    onItemCustomized(itemToCustomize.includeNull(value));
  }

  @autobind
  onIncludeTotalChange(value: boolean) {
    const { itemToCustomize, onItemCustomized } = this.props;
    const groupingValue = itemToCustomize.name();
    analytics.track('Include Total Values in Grouping', {
      groupingValue,
      value,
    });
    onItemCustomized(itemToCustomize.includeTotal(value));
  }

  @autobind
  onIncludeAllChange(value: boolean) {
    const { itemToCustomize, onItemCustomized } = this.props;
    const groupingValue = itemToCustomize.name();
    analytics.track('Include All Values in Grouping', {
      groupingValue,
      value,
    });
    onItemCustomized(itemToCustomize.includeAll(value));
  }

  renderTotalOptionLabel(): React.Node {
    return (
      <div className="group-customization-module__total-option">
        {TEXT.includeTotal}
        <InfoTooltip
          text={TEXT.dimensionTotalTooltip}
          tooltipPlacement="right"
        />
      </div>
    );
  }

  renderAllOptionLabel(): React.Node {
    const tooltipText = t('dimensionAllTooltip', {
      dimension: getFullDimensionName(this.props.itemToCustomize.dimension()),
      scope: TEXT_PATH,
    });
    return (
      <div className="group-customization-module__all-option">
        {TEXT.includeAll}
        <InfoTooltip text={tooltipText} tooltipPlacement="right" />
      </div>
    );
  }

  render(): React.Node {
    const { itemToCustomize } = this.props;
    const checkboxID = `dimension--${itemToCustomize.id()}`;
    return (
      <div className="group-customization-module">
        <LabelWrapper label={TEXT.label}>
          <InputText.Uncontrolled
            debounce
            initialValue={itemToCustomize.name()}
            onChange={this.onLabelChange}
            debounceTimeoutMs={200}
          />
        </LabelWrapper>
        <LabelWrapper
          htmlFor={`${checkboxID}--null`}
          inline
          label={TEXT.includeNull}
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
