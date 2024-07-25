// @flow
import * as React from 'react';

import ToggleSwitch from 'components/ui/ToggleSwitch';

type Props = {
  className?: string,
  header: string,
  id?: string,
  onChange: () => void,
  value: boolean,
};

export default function QueryPanelToggleSwitch({
  className = '',
  header,
  id,
  onChange,
  value,
}: Props): React.Node {
  return (
    <div className={`gd-query-panel-tab-config-item__detail ${className}`}>
      <span className="gd-query-panel-tab-config-item__description">
        {header}
      </span>
      <ToggleSwitch
        displayLabels="left"
        id={id}
        onChange={onChange}
        value={value}
      />
    </div>
  );
}
