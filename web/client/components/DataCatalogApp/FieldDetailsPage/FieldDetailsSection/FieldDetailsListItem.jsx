// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import InfoTooltip from 'components/ui/InfoTooltip';
import Spacing from 'components/ui/Spacing';

type Props = {
  title: string,
  children: React.Node,

  tooltipText?: string,
};

function FieldDetailsListItem({
  title,
  children,
  tooltipText = undefined,
}: Props): React.Node {
  return (
    <div className="dc-field-details-list-item">
      <div className="dc-field-details-list-item__title">
        <Group flex spacing="none">
          {title}
          <Spacing paddingTop="xxxs">
            {tooltipText && <InfoTooltip text={tooltipText} />}
          </Spacing>
        </Group>
      </div>
      <div className="dc-field-details-list-item__value">{children}</div>
    </div>
  );
}

export default (React.memo<Props>(
  FieldDetailsListItem,
): React.AbstractComponent<Props>);
