// @flow
import * as React from 'react';

import useToggleBoolean from 'lib/hooks/useToggleBoolean';
import useWindowSize from 'lib/hooks/useWindowSize';

//   860  (threshold width of `react-grid-layout`)
// + 308  (width of expanded side panel)
// + 64   (2*gridContainerHorizontalPadding = 2*32)
// + 48   (2*horizontalPadding*zoomLevel = 2*32*0.75)
// ------
// = 1280
const WIDTH_THRESHOLD = 1280;

/**
 * This hook implements the opening and closing of the CommonSettingsPanel.
 * That may happen in one of two ways:
 *   1) Manually:
 *      The user can open and close the panel.
 *   2) Programatically by screen size:
 *      At smaller screen sizes the panel will auto-close. At larger screen
 *      sizes the panel will auto-open.
 */
export default function useOpenClosePanel(): [boolean, () => void] {
  const { width } = useWindowSize();
  const programaticallyClosePanel = width < WIDTH_THRESHOLD;

  const [closePanel, toggleClosePanel] = useToggleBoolean(
    programaticallyClosePanel,
  );

  React.useEffect(() => {
    if (programaticallyClosePanel !== closePanel) {
      toggleClosePanel();
    }
    // NOTE(isabel): window size-based `programaticallyClosePanel` is the only
    // dependency for this effect. Manual changes to `closePanel` should persist
    // even if contradicting `programaticallyClosePanel` unless a width boundary
    // is crossed, which will trigger this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programaticallyClosePanel]);
  return [closePanel, toggleClosePanel];
}
