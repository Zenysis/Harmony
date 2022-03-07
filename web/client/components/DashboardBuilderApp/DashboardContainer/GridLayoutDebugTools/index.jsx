// @flow
// NOTE(stephen): This component is built to enable debugging and tweaking of
// the new dashboard layout settings by an @zenysis dashboard user. The code was
// put together quickly and should not necessarily be used as an example of high
// quality production code.
import * as React from 'react';

import Button from 'components/ui/Button';
import LayoutDebugPanel from 'components/DashboardBuilderApp/DashboardContainer/GridLayoutDebugTools/LayoutDebugPanel';
import TextSizingDebugPanel from 'components/DashboardBuilderApp/DashboardContainer/GridLayoutDebugTools/TextSizingDebugPanel';
import type { GridLayout } from 'components/DashboardBuilderApp/DashboardContainer/hooks/useGridLayout';

type Props = {
  onApplyLayoutOverrides: ($Shape<GridLayout>) => void,
  ...GridLayout,
};

const ALLOW_DEBUG_TOGGLE =
  __DEV__ ||
  (window.__JSON_FROM_BACKEND.user &&
    window.__JSON_FROM_BACKEND.user.username &&
    window.__JSON_FROM_BACKEND.user.username.endsWith('@zenysis.com'));

const WRAPPER_STYLE = {
  bottom: 0,
  left: 0,
  padding: 8,
  position: 'fixed',
};

function GridLayoutDebugTools({
  onApplyLayoutOverrides,
  ...gridLayout
}: Props) {
  // HACK(stephen): It is safe to do this check without violating hook ordering
  // requirements since this is a constant that cannot be modified after the
  // page is loaded.
  /* eslint-disable react-hooks/rules-of-hooks */
  if (!ALLOW_DEBUG_TOGGLE) {
    return null;
  }

  // If the user hits ctrl+shift+z, we enable the debug mode.
  // NOTE(stephen): The listener is not removed even though it probably should
  // be.
  const [showDebugButton, setShowDebugButton] = React.useState(false);
  React.useEffect(() => {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.keyCode === 90 && e.ctrlKey && e.shiftKey) {
        setShowDebugButton(true);
      }
    });
  }, []);

  const [showDebugPanel, setShowDebugPanel] = React.useState(false);

  if (!showDebugButton) {
    return null;
  }

  return (
    <div style={WRAPPER_STYLE}>
      {showDebugPanel && (
        <>
          <TextSizingDebugPanel />
          <LayoutDebugPanel
            onApplyLayoutOverrides={onApplyLayoutOverrides}
            {...gridLayout}
          />
        </>
      )}
      <Button
        intent="success"
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        outline
      >
        {showDebugPanel ? 'Hide' : 'Debug'}
      </Button>
    </div>
  );
}

export default (React.memo(
  GridLayoutDebugTools,
): React.AbstractComponent<Props>);
