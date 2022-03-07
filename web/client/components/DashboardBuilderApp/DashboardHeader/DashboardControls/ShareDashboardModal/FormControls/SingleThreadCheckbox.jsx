// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import Spacing from 'components/ui/Spacing';

type Props = {
  showCheckbox: boolean,
  useSingleEmailThread: boolean,
  toggleUseSingleEmailThread: () => void,
};

function SingleThreadCheckbox({
  showCheckbox,
  toggleUseSingleEmailThread,
  useSingleEmailThread,
}: Props) {
  if (!showCheckbox) {
    return null;
  }
  const label = (
    <>
      {I18N.text(
        'Include all recipients on a single thread',
        'useSingleThread',
      )}
      <InfoTooltip
        text={I18N.text(
          'Selecting this option will CC all recipients listed in "To". Doing so will add all recipients to the same thread and enable collaborative follow up via email.',
          'useSingleThreadInfoTooltip',
        )}
      />
    </>
  );
  return (
    <Spacing marginTop="s">
      <Checkbox
        value={useSingleEmailThread}
        onChange={toggleUseSingleEmailThread}
        label={label}
        labelPlacement="right"
      />
    </Spacing>
  );
}

export default (React.memo(
  SingleThreadCheckbox,
): React.AbstractComponent<Props>);
