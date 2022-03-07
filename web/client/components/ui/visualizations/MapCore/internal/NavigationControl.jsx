// @flow
import * as React from 'react';

const ReactMapGLNavigationControl = React.lazy(() =>
  import(
    /* webpackChunkName: "asyncMapChunk" */
    'react-map-gl/dist/es6/components/navigation-control'
  ),
);

type Props = {
  captureClick?: boolean,
  captureDoubleClick?: boolean,
  captureDrag?: boolean,
  captureScroll?: boolean,
  children?: React.Node | void,
  className?: string,
  compassLabel?: string,
  onViewStateChange?: mixed => void,
  onViewportChange?: mixed => void,
  showCompass?: boolean,
  showZoom?: boolean,
  zoomInLabel?: string,
  zoomOutLabel?: string,
};

// TODO(stephen): Figure out an appropriate fallback. It might be different for
// different users of the tool, which is why I stubbed out an empty string for
// now.
export default function NavigationControl(props: Props): React.Node {
  return (
    <React.Suspense fallback="">
      <ReactMapGLNavigationControl {...props} />
    </React.Suspense>
  );
}
