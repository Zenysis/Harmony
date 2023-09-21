// @flow
import * as React from 'react';

import type {
  ReactMapGLInteractionState,
  Viewport,
} from 'components/ui/visualizations/MapCore/types';

const ReactMapGLNavigationControl = React.lazy(() =>
  import('react-map-gl/dist/es6/components/navigation-control'),
);

type Props = {
  captureClick?: boolean,
  captureDoubleClick?: boolean,
  captureDrag?: boolean,
  captureScroll?: boolean,
  children?: React.Node | void,
  className?: string,
  compassLabel?: string,
  onViewportChange?: (Viewport, ReactMapGLInteractionState | void) => void,
  onViewStateChange?: mixed => void,
  showCompass?: boolean,
  showZoom?: boolean,
  zoomInLabel?: string,
  zoomOutLabel?: string,
};

// TODO: Figure out an appropriate fallback. It might be different for
// different users of the tool, which is why I stubbed out an empty string for
// now.
export default function NavigationControl(props: Props): React.Node {
  // NOTE: Work around limitations in the react-map-gl implementation
  // where the navigation control does not actually pass in the user's
  // interaction state to the onViewportChange callback.
  // NOTE: Using a `useMemo` here instead of `useCallback` since
  // react-map-gl will use a context-based `onViewportChange` method if the prop
  // version is `undefined`.
  const { onViewportChange } = props;
  const onViewportChangeOverride = React.useMemo(() => {
    if (onViewportChange === undefined) {
      return undefined;
    }

    return viewport => onViewportChange(viewport, { isZooming: true });
  }, [onViewportChange]);

  return (
    <React.Suspense fallback="">
      <ReactMapGLNavigationControl
        {...props}
        onViewportChange={onViewportChangeOverride}
      />
    </React.Suspense>
  );
}
