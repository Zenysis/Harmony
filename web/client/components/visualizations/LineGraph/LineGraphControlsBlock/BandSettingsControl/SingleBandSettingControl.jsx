// @flow
import * as React from 'react';
import classNames from 'classnames';

import BandBoundControl from 'components/visualizations/LineGraph/LineGraphControlsBlock/BandSettingsControl/BandBoundControl';
import Checkbox from 'components/ui/Checkbox';
import ColorBlock from 'components/ui/ColorBlock';
import InputText from 'components/ui/InputText';
import RemoveItemButton from 'components/ui/RemoveItemButton';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { BandSetting } from 'models/visualizations/LineGraph/LineGraphSettings';
import type { ColorResult } from 'components/ui/ColorBlock';

type Props = {
  band: BandSetting,
  id: string,
  onBandChange: BandSetting => void,
  seriesSettings: SeriesSettings,

  onBandRemove?: (() => void) | void,
};

const TEXT = {
  bandAreaColorLabel: 'Band area color (optional)',
  bandAreaLabelPlaceholder: 'Legend label (optional)',
  lowerBoundLabel: 'Lower bound',
  removeBandLabel: 'Remove this colored band',
  upperBoundLabel: 'Upper bound',
};

export default function SingleBandSettingControl({
  band,
  id,
  onBandChange,
  seriesSettings,

  onBandRemove = undefined,
}: Props): React.Node {
  const defaultFieldId = seriesSettings.seriesOrder()[0];
  const onToggleBound = React.useCallback(
    (isSelected: boolean, type: string) => {
      // NOTE(stephen): The Checkbox `onChange` callback only passes a string and
      // not a more explicit type. We need to refine. Also, Flow requires that
      // computed properties only be primitive literals, so I can't use a computed
      // property to set the new value even though I have refined correctly (
      // because the result is a union of string literals).
      const bandType = type === 'lower' ? 'lower' : 'upper';
      const newBand = { ...band };
      newBand[bandType] = isSelected
        ? { fieldId: defaultFieldId, type: 'field' }
        : undefined;
      onBandChange(newBand);
    },
    [band, defaultFieldId, onBandChange],
  );

  const onBandAreaColorChange = React.useCallback(
    (color: ColorResult) => onBandChange({ ...band, areaColor: color.hex }),
    [band, onBandChange],
  );
  const onBandAreaColorRemove = React.useCallback(
    () => onBandChange({ ...band, areaColor: undefined }),
    [band, onBandChange],
  );
  const onBandAreaLabelChange = React.useCallback(
    (areaLabel: string) => onBandChange({ ...band, areaLabel }),
    [band, onBandChange],
  );

  function EnableBoundCheckbox({ type }: { type: 'lower' | 'upper' }) {
    const enabled = band[type] !== undefined;
    const labelClassName = classNames(
      'single-band-setting-control__bound-label',
      { 'single-band-setting-control__bound-label--enabled': enabled },
    );
    const checkboxId = `${id}--${type}`;
    return (
      <React.Fragment>
        <Checkbox
          className="single-band-setting-control__add-bound-button"
          id={checkboxId}
          onChange={onToggleBound}
          name={type}
          value={enabled}
        />
        <label className={labelClassName} htmlFor={checkboxId}>
          {type === 'lower' ? TEXT.lowerBoundLabel : TEXT.upperBoundLabel}
        </label>
      </React.Fragment>
    );
  }

  return (
    <div className="single-band-setting-control">
      <div className="single-band-setting-control__block">
        <EnableBoundCheckbox type="lower" />
        {band.lower !== undefined && (
          <BandBoundControl
            bound={band.lower}
            onBoundChange={lower => onBandChange({ ...band, lower })}
            seriesSettings={seriesSettings}
          />
        )}
        <EnableBoundCheckbox type="upper" />
        {band.upper !== undefined && (
          <BandBoundControl
            bound={band.upper}
            onBoundChange={upper => onBandChange({ ...band, upper })}
            seriesSettings={seriesSettings}
          />
        )}
        <div className="single-band-setting-control__area-color-block">
          <div className="single-band-setting-control__area-color-block-label">
            {TEXT.bandAreaColorLabel}
          </div>
          <ColorBlock
            // TODO(david): Move towards using null to represent no color as
            // that is a valid explicit slection
            color={band.areaColor === undefined ? null : band.areaColor}
            enableColorPicker
            onColorChange={onBandAreaColorChange}
            onColorRemove={onBandAreaColorRemove}
          />
          <InputText.Uncontrolled
            className="single-band-setting-control__area-color-label-input"
            debounce
            initialValue={band.areaLabel || ''}
            placeholder={TEXT.bandAreaLabelPlaceholder}
            onChange={onBandAreaLabelChange}
          />
          {onBandRemove && (
            <div className="single-band-setting-control__remove-band-button">
              <RemoveItemButton
                onClick={onBandRemove}
                tooltipText={TEXT.removeBandLabel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
