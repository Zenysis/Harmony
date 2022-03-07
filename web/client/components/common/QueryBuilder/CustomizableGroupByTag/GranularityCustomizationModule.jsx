// @flow
import * as React from 'react'; // eslint-disable-line no-unused-vars

import Checkbox from 'components/ui/Checkbox';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import type GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.GroupByCustomizationModule',
);

type Props = {
  itemToCustomize: GroupingGranularity,
  onItemCustomized: (item: GroupingGranularity) => void,
};

export default function GranularityCustomizationModule({
  itemToCustomize,
  onItemCustomized,
}: Props): React.Node {
  const onLabelChange = React.useCallback(
    label => {
      analytics.track('Granularity Label Change', {
        newLabel: label,
        prevLabel: itemToCustomize.name(),
      });
      onItemCustomized(itemToCustomize.name(label));
    },
    [itemToCustomize, onItemCustomized],
  );

  const onIncludeTotalChange = React.useCallback(
    includeTotal => {
      analytics.track('Include Total Values in Granularity', {
        granularityId: itemToCustomize.id(),
        value: includeTotal,
      });
      onItemCustomized(itemToCustomize.includeTotal(includeTotal));
    },
    [itemToCustomize, onItemCustomized],
  );

  const checkboxID = `granularity--${itemToCustomize.id()}`;
  return (
    <div className="granularity-customization-module">
      <LabelWrapper label={TEXT.label}>
        <InputText.Uncontrolled
          debounce
          initialValue={itemToCustomize.name()}
          onChange={onLabelChange}
          debounceTimeoutMs={200}
        />
      </LabelWrapper>
      <LabelWrapper
        htmlFor={`${checkboxID}--total`}
        inline
        label={TEXT.includeTotal}
        labelAfter
      >
        <Checkbox
          id={`${checkboxID}--total`}
          onChange={onIncludeTotalChange}
          value={itemToCustomize.includeTotal()}
        />
      </LabelWrapper>
    </div>
  );
}
