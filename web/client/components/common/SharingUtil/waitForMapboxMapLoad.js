// @flow
import Promise from 'bluebird';

// HACK(stephen): Special handling for map visualization since that is the only
// viz type that has a variable loading time. Try to get a reference to the
// actual MapboxGL map held by the `react-map-gl` `MapGL` component that the map
// viz renders.
// TODO(stephen): Figure out a better way for visualizations to signal that they
// have been loaded. For now, the Map viz is the only one that matters so I'm
// not implementing a more robust solution.
export default function waitForMapboxMapLoad(
  mapboxElt: HTMLElement,
): Promise<void> {
  return new Promise(resolve => {
    // Find the `react-map-gl` `InteractiveMap` element that should be the
    // grandparent of the MapboxGL element.
    const { parentElement } = mapboxElt;
    if (!parentElement || !parentElement.parentElement) {
      resolve();
      return;
    }

    // The `InteractiveMap` component renders a child with a ref that provides a
    // `getMap` method that will produce a reference to the real MapboxGL map
    // instance variable.
    const mapGLElement = parentElement.parentElement;

    // Find the internal react instance attached to the DOM node.
    // NOTE(stephen): This will probably break with new React versions but that's
    // ok! This is a temporary solution.
    const instanceKey = Object.keys(mapGLElement).find(key =>
      key.startsWith('__reactInternalInstance'),
    );
    if (instanceKey === undefined) {
      resolve();
      return;
    }

    // $FlowExpectedError[prop-missing] - We're being very safe, so this is ok.
    const { child } = mapGLElement[instanceKey];
    if (!child) {
      resolve();
      return;
    }

    const { current } = child.ref || {};
    if (current.getMap === undefined) {
      resolve();
      return;
    }

    const map = current.getMap();

    // HACK(stephen): The `map.loaded()` signal is very poor. It lets you know
    // when all layers have been added to the map, but it does not let you know if
    // any of those layers are *animating*. It's very difficult to actually detect
    // whether an animation event is in progress. So difficult, that I had to go
    // look at the MapboxGL source code to figure out when the `idle` event would
    // or would not get triggered. These properties used below are what MapboxGL
    // uses internally to determine if a repaint will be triggered. When a repaint
    // is triggered, MapboxGL does *not* update its `loaded()` status. So when
    // we rely on the `loaded` status, we also need to detect if a repaint is
    // being triggered.
    // https://github.com/mapbox/mapbox-gl-js/blob/f0cc015/src/ui/map.js#L2540
    const repaintInProgress =
      map._sourcesDirty ||
      map._styleDirty ||
      map._placementDirty ||
      map._repaint;
    if (map.loaded() && !repaintInProgress) {
      resolve();
      return;
    }

    // NOTE(stephen): Using the `idle` event vs the `load` since `load` fires when
    // "the first visually complete rendering of the map has occurred". This might
    // happen even before certain map tile labels have been rendered. Idle will
    // fire when the map is finished fully loading and there are no interactions.
    map.once('idle', () => {
      // HACK(stephen): Wait a few more milliseconds after the idle event fires to
      // ensure that the data rendered is actually committed and visible.
      // Sometimes there is an edge case where the map labels will be fading in
      // when the image is captured.
      // TODO(stephen): Maybe we should just add a new `idle` listener instead of
      // waiting an arbitrary amount of seconds?
      window.setTimeout(resolve, 60);
    });
  });
}
