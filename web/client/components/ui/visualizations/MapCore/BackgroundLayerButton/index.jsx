// @flow
import * as React from 'react';

import LabelWrapper from 'components/ui/LabelWrapper';
import OverlayOptionButton from 'components/visualizations/MapViz/common/OverlayOptionButton';
import { MAP_LAYERS } from 'components/ui/visualizations/MapCore/defaults';

type Props = {
  baseLayer: string,
  onBaseLayerChange: (newBaseLayer: string) => void,
};

const TEXT = t('visualizations.MapViz.BackgroundLayerButton');

/**
 * BackgroundLayerButton is an on-map control for changing the current base
 * layer on the map (like satellite, streets, etc.).
 */
export default function BackgroundLayerButton({
  baseLayer,
  onBaseLayerChange,
}: Props): React.Node {
  const options = Object.keys(MAP_LAYERS).map(layer => {
    const inputId = `background--${layer}`;
    return (
      <LabelWrapper
        className="background-layer-button__item"
        contentClassName="background-layer-button__input-wrapper"
        htmlFor={inputId}
        inline
        key={layer}
        label={layer}
        labelAfter
        labelClassName="background-layer-button__item-label"
      >
        <input
          checked={layer === baseLayer}
          id={inputId}
          onChange={() => onBaseLayerChange(layer)}
          type="radio"
          value={layer}
        />
      </LabelWrapper>
    );
  });
  return (
    <OverlayOptionButton
      buttonClassName="background-layer-button__map-button"
      buttonIconType="svg-map-layer"
      buttonTooltipText={TEXT.buttonTooltip}
    >
      <div className="background-layer-button">
        <div className="background-layer-button__title">{TEXT.title}</div>
        <div className="background-layer-button__options">{options}</div>
      </div>
    </OverlayOptionButton>
  );
}
