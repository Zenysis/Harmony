// @flow
// NOTE(stephen): This component is built to enable debugging and tweaking of
// the new dashboard layout settings by an @zenysis dashboard user. The code was
// put together quickly and should not necessarily be used as an example of high
// quality production code.
import * as React from 'react';

import InputText from 'components/ui/InputText';
import useURLPersistence from 'components/DashboardBuilderApp/DashboardContainer/GridLayoutDebugTools/useURLPersistence';
import type { GridLayout } from 'components/DashboardBuilderApp/DashboardContainer/hooks/useGridLayout';

type Props = {
  onApplyLayoutOverrides: ($Shape<GridLayout>) => void,
  ...GridLayout,
};

const DEBUG_PANEL_STYLE = {
  alignItems: 'center',
  backgroundColor: '#f0edff',
  display: 'grid',
  gridGap: 4,
  gridTemplateColumns: 'auto auto',
  padding: 8,
};

function LayoutDebugPanel({
  onApplyLayoutOverrides,
  ...gridLayout
}: Props) {
  // HACK(stephen): Allow users to persist overrides in the URL. Apply them only
  // when the debug panel is first opened.
  const [onUpdateURL, initialState] = useURLPersistence(
    '__debugLayoutOverrides',
    gridLayout,
  );

  // NOTE(stephen): Setting zero dependencies since we want this to only run
  // once when the component first loads.
  React.useEffect(() => {
    onApplyLayoutOverrides(initialState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Directy update the grid layout value in the parent and apply it
  // immediately.
  const onLayoutOverrideChange = (key, valueStr) => {
    const newOverrides = {
      ...gridLayout,
      [key]: Number.parseFloat(valueStr),
    };
    onApplyLayoutOverrides(newOverrides);
    onUpdateURL(newOverrides);
  };

  return (
    <div style={DEBUG_PANEL_STYLE}>
      {Object.keys(gridLayout).map((key: string) => (
        <React.Fragment key={key}>
          {key}
          <InputText
            onChange={value => onLayoutOverrideChange(key, value)}
            type="number"
            value={`${gridLayout[key]}`}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

export default (React.memo(LayoutDebugPanel): React.AbstractComponent<Props>);
