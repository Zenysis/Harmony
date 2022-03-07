// @flow
import * as React from 'react';

import SingleBandSettingControl from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl/SingleBandSettingControl';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { BandSetting } from 'models/visualizations/LineGraph/LineGraphSettings';

type Props = {
  bands: $ReadOnlyArray<BandSetting>,
  onBandSettingsChange: ($ReadOnlyArray<BandSetting>) => void,
  seriesSettings: SeriesSettings,
};

export default function BandSettingsControl({
  bands,
  onBandSettingsChange,
  seriesSettings,
}: Props): React.Node {
  const onBandChange = (band: BandSetting, idx: number) => {
    const newBands = [...bands];
    newBands[idx] = band;
    onBandSettingsChange(newBands);
  };
  const onBandRemove = (idxToRemove: number) => {
    const newBands = bands.filter((_, idx: number) => idx !== idxToRemove);
    onBandSettingsChange(newBands);
  };
  return (
    <div className="band-settings-control">
      {bands.map((band, idx) => (
        <SingleBandSettingControl
          band={band}
          key={`band--${idx}`} // eslint-disable-line react/no-array-index-key
          id={`band--${idx}`}
          onBandChange={newBand => onBandChange(newBand, idx)}
          onBandRemove={() => onBandRemove(idx)}
          seriesSettings={seriesSettings}
        />
      ))}
    </div>
  );
}
