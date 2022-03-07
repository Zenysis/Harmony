// @flow
import * as React from 'react';

import BackgroundLayerButton from 'components/ui/visualizations/MapCore/BackgroundLayerButton';
import EntityLayer from 'components/visualizations/MapViz/EntityLayer';
import MapCore, {
  NavigationControl,
} from 'components/ui/visualizations/MapCore';
import QueryResultLayer from 'components/visualizations/MapViz/QueryResultLayer';
import QueryScalingContext from 'components/common/QueryScalingContext';
import Visualization from 'components/visualizations/common/Visualization';
import buildAdminBoundaryFilter from 'components/visualizations/MapViz/QueryResultLayer/buildAdminBoundaryFilter';
import extractFeatureFromEvent from 'components/ui/visualizations/MapCore/extractFeatureFromEvent';
import getEntityLayerIdForFeature from 'components/visualizations/MapViz/EntityLayer/getEntityLayerIdForFeature';
import getFeatureForLayer from 'components/visualizations/MapViz/getFeatureForLayer';
import {
  ENTITY_LAYER_ID,
  QUERY_RESULT_LAYER_ID,
  INTERACTIVE_LAYER_IDS,
} from 'components/visualizations/MapViz/defaults';
import { ENTITY_LAYER_SUPPORTED } from 'components/visualizations/MapViz/EntityLayer/defaults';
import { MAP_LAYERS } from 'components/ui/visualizations/MapCore/defaults';
import { autobind, memoizeOne } from 'decorators';
import type EntityLayerProperties from 'models/visualizations/MapViz/EntityLayerProperties';
import type { AdminBoundaryFilterLocation } from 'models/visualizations/MapViz/types';
import type {
  EventFeature,
  MapEvent,
  Viewport,
} from 'components/ui/visualizations/MapCore/types';
import type { StyleObject } from 'types/jsCore';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type DefaultProps = {
  // NOTE(stephen): Allowing children layers to be passed in so that users of
  // the MapViz don't need to hardcode in the layers that they want to draw.
  // Over time, it might become necessary to remove the EntityLayer and
  // QueryResultLayer usage from this component and pass those layers as
  // children. For now, though, we don't know enough about the usage of the
  // MapViz so are content with the restrictions.
  children?: React.Node,
};

type Props = {
  ...VisualizationProps<'MAP'>,
  ...DefaultProps,
};

type State = {
  /** The current feature that a user has clicked/hovered on. */
  activeFeature: EventFeature<{ ... }> | void,
  /** Allow zoom and pan interactions. */
  enableInteractions: boolean,
  /** When a feature is clicked, its popup should remain open even if other
   * features are hovered on. This keeps track of whether we have clicked on
   * the active feature and should keep its popup open.
   */
  isActiveFeatureClicked: boolean,

  /** Flag for when user hovers over map visualization */
  isHovering: boolean,
};

export default class MapViz extends React.PureComponent<Props, State> {
  static defaultProps: DefaultProps = {
    children: null,
  };

  static contextType: typeof QueryScalingContext = QueryScalingContext;
  context: $ContextType<typeof QueryScalingContext>;
  mapContentRef: $ElementRefObject<'div'> = React.createRef();

  state: State = {
    activeFeature: undefined,

    // NOTE(stephen): Always enable interactions for touch devices since hover
    // mouse events will not fire, only click events.
    enableInteractions: navigator.maxTouchPoints > 0,
    isActiveFeatureClicked: false,
    isHovering: false,
  };

  getScaleFactor(): number {
    // NOTE(stephen, nina): Not all users of the MapViz will provide the query scaling
    // context (like DQL).
    if (this.context === undefined) {
      return 1;
    }

    // NOTE(stephen, nina): Ensure the scale factor is never 0 since it doesn't make
    // sense and can lead to divide by zero errors.
    return this.context.scaleFactor || 1;
  }

  getContentStyle(height: number, width: number): StyleObject | void {
    if (this.context === undefined) {
      return undefined;
    }
    const scaleFactor = this.getScaleFactor();
    // NOTE(nina): We are dividing the dimensions by the scale factor because
    // we receive the already-scaled dimensions, so we must unscale. Ideally,
    // we would like to receive the true dimensions from the parent.
    return {
      height: height / scaleFactor,
      width: width / scaleFactor,
      transform: `scale(${scaleFactor})`,
      transformOrigin: 'top left',
    };
  }

  /**
   * Filter the entity layer based on the locations returned in the QueryResult.
   * To avoid polluting the EntityLayer with hacks that involve the QueryResult,
   * we build the filter here.
   */
  @memoizeOne
  buildEntityLayerFilter(
    includeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
    excludeLocations: $ReadOnlyArray<AdminBoundaryFilterLocation>,
  ): $ReadOnlyArray<mixed> | void {
    return buildAdminBoundaryFilter(includeLocations, excludeLocations);
  }

  /**
   * When the user manipulates the viewport, either by zooming or panning,
   * persist the change in the Map controls.
   */
  @autobind
  onViewportChange(viewport: Viewport) {
    const { controls, onControlsSettingsChange } = this.props;
    const [latitude, longitude] = controls.mapCenter();

    // We want to store the zoom level as the generalized zoom level that can
    // work the same on any client. This means we need to reverse any scaling
    // that has been applied to the zoom level. Each zoom level in MapboxGL cuts
    // the meters/pixel distance in half. The  scaled zoom level is
    // Math.log2((2 ** zoomLevel) * scaleFactor), so inverting it gives you this
    // formula.
    // Zoom level docs: https://docs.mapbox.com/help/glossary/zoom-level
    const zoomLevel = viewport.zoom - Math.log2(this.getScaleFactor());
    if (controls.zoomLevel() !== zoomLevel) {
      onControlsSettingsChange('zoomLevel', zoomLevel);
    }
    if (latitude !== viewport.latitude || longitude !== viewport.longitude) {
      onControlsSettingsChange('mapCenter', [
        viewport.latitude,
        viewport.longitude,
      ]);
    }
  }

  @autobind
  onRequestPopupClose() {
    this.setState({ activeFeature: undefined });
  }

  @autobind
  onClick(event: MapEvent) {
    this.setState(({ enableInteractions }) => {
      if (!enableInteractions) {
        return undefined;
      }
      const feature = extractFeatureFromEvent(event);
      return {
        activeFeature: feature,
        isActiveFeatureClicked: feature !== undefined,
      };
    });
  }

  @autobind
  onHover(event: MapEvent) {
    this.setState(({ enableInteractions, isActiveFeatureClicked }) => {
      const newState = { isHovering: true };

      if (!enableInteractions || isActiveFeatureClicked) {
        return newState;
      }
      return { activeFeature: extractFeatureFromEvent(event), ...newState };
    });
  }

  @autobind
  onBaseLayerChange(baseLayer: string) {
    this.props.onControlsSettingsChange('baseLayer', baseLayer);
  }

  @autobind
  onRemoveMarkerLayer(layerId: string) {
    const visibleMarkerLayers = [...this.props.controls.visibleMarkerLayers()];
    this.props.onControlsSettingsChange(
      'visibleMarkerLayers',
      visibleMarkerLayers.filter(id => id !== layerId),
    );
  }

  @autobind
  onAddMarkerLayer(layerId: string) {
    if (!this.props.controls.visibleMarkerLayers().includes(layerId)) {
      const visibleMarkerLayers = [
        ...this.props.controls.visibleMarkerLayers(),
      ];
      visibleMarkerLayers.push(layerId);
      this.props.onControlsSettingsChange(
        'visibleMarkerLayers',
        visibleMarkerLayers,
      );
    }
  }

  @autobind
  onEntityLayerSettingsChange(layerProperties: EntityLayerProperties) {
    this.props.onControlsSettingsChange(
      'entityLayerProperties',
      layerProperties,
    );
  }

  @autobind
  onToggleEntityDisplay(enabled: boolean) {
    if (enabled) {
      this.onAddMarkerLayer(ENTITY_LAYER_ID);
    } else {
      this.onRemoveMarkerLayer(ENTITY_LAYER_ID);
    }
  }

  /**
   * `react-map-gl` tracks all events that happen on the map, whether they occur
   * on the map or on overlays displayed on top of the map. Disable map
   * interactions when the user's mouse is on top of an overlay. Enable them
   * when the mouse is only over the map and not on an overlay.
   */
  @autobind
  onMouseMove(event: MapEvent) {
    const allowInteraction = event.target === this.mapContentRef.current;

    // Introduce fast path to avoid lots of setState calls when user is
    // interacting with the map.
    if (allowInteraction !== this.state.enableInteractions) {
      this.setState({ enableInteractions: allowInteraction });
    }
  }

  @autobind
  onMouseOut() {
    this.setState({ isHovering: false });
  }

  maybeRenderEntityLayer(): React.Node {
    if (!ENTITY_LAYER_SUPPORTED) {
      return null;
    }

    // HACK(stephen): GIANT HACK. Positioning the EntityLegend when it is
    // designed as an independent layer is really annoying. It doesn't know
    // anything about QueryResultLayer (and shouldn't) but sometimes it needs to
    // draw its legend in different places based on the legends drawn by
    // QueryResultLayer. This hack tries to detect which legends will be used by
    // QueryResultLayer and offset the EntityLayer's legend appropriately.
    const { controls, queryResult } = this.props;
    const legendPlacement = queryResult.hasDataForDateIndex(1)
      ? 'bottom-left-offset'
      : 'bottom-left';

    const { activeFeature } = this.state;

    const layerId = getEntityLayerIdForFeature(activeFeature);

    return (
      <EntityLayer
        activeFeature={getFeatureForLayer(activeFeature, layerId)}
        controls={controls.entityLayerProperties()}
        enabled={controls.visibleMarkerLayers().includes(ENTITY_LAYER_ID)}
        mapControls={controls}
        onRequestPopupClose={this.onRequestPopupClose}
        onSettingsChange={this.onEntityLayerSettingsChange}
        onToggleEntityDisplay={this.onToggleEntityDisplay}
        globalFilter={this.buildEntityLayerFilter(
          queryResult.adminBoundaryIncludeLocations(),
          queryResult.adminBoundaryExcludeLocations(),
        )}
        id={ENTITY_LAYER_ID}
        legendPlacement={legendPlacement}
      />
    );
  }

  renderQueryResultLayer(): React.Node {
    const {
      controls,
      groupBySettings,
      legendSettings,
      onControlsSettingsChange,
      queryResult,
      seriesSettings,
    } = this.props;
    const { activeFeature, isHovering } = this.state;
    const onPlaybackSettingsChange = newPlaybackSettings =>
      onControlsSettingsChange('playbackSettings', newPlaybackSettings);

    return (
      <QueryResultLayer
        activeFeature={getFeatureForLayer(activeFeature, QUERY_RESULT_LAYER_ID)}
        controls={controls}
        legendSettings={legendSettings}
        groupBySettings={groupBySettings}
        id={QUERY_RESULT_LAYER_ID}
        isHovering={isHovering}
        onPlaybackSettingsChange={onPlaybackSettingsChange}
        onRequestPopupClose={this.onRequestPopupClose}
        queryResult={queryResult}
        scaleFactor={this.getScaleFactor()}
        seriesSettings={seriesSettings}
      />
    );
  }

  // TODO(nina): This should exist under the MapCore component, but it doesn't
  // because we want to resize these elements. So we need to think about
  // how to pass in children while also enforcing our own styles.
  renderOverlays(): React.Node {
    return (
      <div className="map-viz__overlays">
        <NavigationControl
          className="map-viz__zoom-control hide-on-export"
          showCompass={false}
        />
        <BackgroundLayerButton
          baseLayer={this.props.controls.baseLayer()}
          onBaseLayerChange={this.onBaseLayerChange}
        />
      </div>
    );
  }

  @autobind
  renderMapViz(height: number, width: number): React.Node {
    const { children, controls } = this.props;
    const { enableInteractions } = this.state;
    const [latitude, longitude] = controls.mapCenter();

    return (
      <MapCore
        className="map-viz"
        enableInteractions={enableInteractions}
        height={height}
        layerIdsToLoad={INTERACTIVE_LAYER_IDS}
        latitude={latitude}
        longitude={longitude}
        mapStyle={MAP_LAYERS[controls.baseLayer()]}
        onClick={this.onClick}
        onHover={this.onHover}
        onMouseMove={this.onMouseMove}
        onMouseOut={this.onMouseOut}
        onViewportChange={this.onViewportChange}
        preserveDrawingBuffer
        width={width}
        zoom={controls.zoomLevel() + Math.log2(this.getScaleFactor())}
      >
        <div
          className="map-viz__content"
          // HACK(sophie): react-map-gl prevents scrolling from being passed
          // to child components, which is behavior we don't want, so we
          // prevent react-map-gl from receiving the event
          onScroll={event => event.stopPropagation()}
          style={this.getContentStyle(height, width)}
          ref={this.mapContentRef}
        >
          {this.renderQueryResultLayer()}
          {this.maybeRenderEntityLayer()}
          {this.renderOverlays()}
          {children}
        </div>
      </MapCore>
    );
  }

  render(): React.Node {
    return (
      <Visualization loading={this.props.loading}>
        {this.renderMapViz}
      </Visualization>
    );
  }
}
