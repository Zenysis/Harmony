// @flow
import * as React from 'react';

import ToggleSwitch from 'components/ui/ToggleSwitch';

type Props = {
  className?: string,
  header: string,
  value: boolean,
  onChange: () => void,
};

export default function QueryPanelToggleSwitch({
  className = '',
  header,
  value,
  onChange,
}: Props): React.Node {
  return (
    <div className={`gd-query-panel-tab-config-item__detail ${className}`}>
      <span className="gd-query-panel-tab-config-item__description">
        {header}
      </span>
      <ToggleSwitch displayLabels="left" value={value} onChange={onChange} />
    </div>
  );
}
