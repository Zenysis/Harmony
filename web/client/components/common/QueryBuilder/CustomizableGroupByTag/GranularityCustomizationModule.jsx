// @flow
import * as React from 'react'; // eslint-disable-line no-unused-vars

import Checkbox from 'components/ui/Checkbox';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import type GroupingGranularity from 'models/core/wip/GroupingItem/GroupingGranularity';

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
      onItemCustomized(itemToCustomize.name(label));
    },
    [itemToCustomize, onItemCustomized],
  );

  const onIncludeTotalChange = React.useCallback(
    includeTotal => {
      onItemCustomized(itemToCustomize.includeTotal(includeTotal));
    },
    [itemToCustomize, onItemCustomized],
  );

  const checkboxID = `granularity--${itemToCustomize.id()}`;
  return (
    <div className="granularity-customization-module">
      <LabelWrapper label={I18N.text('Label:')}>
        <InputText.Uncontrolled
          debounce
          debounceTimeoutMs={200}
          initialValue={itemToCustomize.name()}
          onChange={onLabelChange}
        />
      </LabelWrapper>
      <LabelWrapper
        htmlFor={`${checkboxID}--total`}
        inline
        label={I18N.text('Include total values', 'includeTotal')}
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
