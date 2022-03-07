// @flow
import * as React from 'react';
import Promise from 'bluebird';

import QueryResult from 'components/QueryResult';
import waitForMapboxMapLoad from 'components/common/SharingUtil/waitForMapboxMapLoad';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ChartSize } from 'components/ui/visualizations/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { StyleObject } from 'types/jsCore';

type Props = {
  ...ChartSize,
  onRender: HTMLDivElement => void,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  viewType: ResultViewType,
};

// This is the time we should wait before triggering the onRender callback.
// NOTE(stephen): This is an inexact science. Since the visualizations use
// third-party libraries, it is possible that the new rendering size will cause
// the library to do more work or make extra network requests than the one
// that is currently in view.
const RENDER_DELAY = 600;

// HACK(stephen): Special handling for map visualization since that is the only
// viz type that has a variable loading time. Try to get a reference to the
// actual MapboxGL map held by the `react-map-gl` `MapGL` component that the map
// viz renders.
// TODO(stephen): Figure out a better way for visualizations to signal that they
// have been loaded. For now, the Map viz is the only one that matters so I'm
// not implementing a more robust solution.
function waitForMapLoad(
  viewType: ResultViewType,
  containerElt: HTMLDivElement,
): Promise<void> {
  if (viewType !== 'MAP') {
    return Promise.resolve();
  }

  // Find the MapboxGL element inside the viz container that react-map-gl will
  // render.
  const mapboxElements = containerElt.querySelectorAll(
    '.visualization .mapboxgl-map',
  );
  if (mapboxElements.length !== 1) {
    return Promise.resolve();
  }

  return waitForMapboxMapLoad(mapboxElements[0]);
}

/**
 * Render the provided QueryResultSpec off screen so the QueryResult can be
 * easily exported.
 */
export default class DownloadableQueryResult extends React.Component<Props> {
  _mainDivElt: $ElementRefObject<'div'> = React.createRef();
  _timeoutId: TimeoutID | void = undefined;

  componentDidMount() {
    this._timeoutId = setTimeout(() => {
      const { onRender, viewType } = this.props;
      const { current } = this._mainDivElt;
      if (!current) {
        return;
      }

      waitForMapLoad(viewType, current).then(() => onRender(current));
    }, RENDER_DELAY);
  }

  shouldComponentUpdate(): boolean {
    // DownloadableQueryResult should never have the queryResultSpec changed
    // behind the scenes. It is strictly a use-once, render, throw away type
    // of component.
    return false;
  }

  componentWillUnmount() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
  }

  getStyle(): StyleObject {
    const { height, width } = this.props;
    const { outerWidth } = window;

    // Position the element off the screen with the desired size so it can be
    // converted to a canvas without affecting the current layout.
    return {
      height,
      width,
      position: 'fixed',
      textAlign: 'initial',
      transform: `translate3d(${outerWidth}px, 0, 0)`,
    };
  }

  render(): React.Node {
    const { queryResultSpec, querySelections, viewType } = this.props;
    return (
      <div ref={this._mainDivElt} style={this.getStyle()}>
        <QueryResult
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          viewType={viewType}
        />
      </div>
    );
  }
}
