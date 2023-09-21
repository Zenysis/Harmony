// @flow
import * as React from 'react';

const ReactMapGLSource = React.lazy(() =>
  import('react-map-gl/dist/es6/components/source'),
);

type Props = {
  children: React.Node,
  id?: string,
  type: string,
  ...
};

// TODO: Figure out an appropriate fallback. It might be different for
// different users of the tool, which is why I stubbed out an empty string for
// now.
export default function Source(props: Props): React.Node {
  return (
    <React.Suspense fallback="">
      <ReactMapGLSource {...props} />
    </React.Suspense>
  );
}
