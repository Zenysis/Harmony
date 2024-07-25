// @flow
import * as React from 'react';

import Caret from 'components/ui/Caret';
import ColorBlock from 'components/ui/ColorBlock';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { MapLabelProperties } from 'models/visualizations/MapViz/types';

type Props = {
  onValueChange: (controlKey: string, value: any) => void,
  selectedLabelsToDisplay: MapLabelProperties,
  seriesSettings: SeriesSettings,
};

export default function MapLabelSelectionControl({
  onValueChange,
  selectedLabelsToDisplay,
  seriesSettings,
}: Props): React.Node {
  function renderColorPickerRow(id: string) {
    const onColorChange = val => {
      const newLabels = { ...selectedLabelsToDisplay };
      newLabels[id].color = val.hex;
      return onValueChange('selectedLabelsToDisplay', newLabels);
    };

    const obj = selectedLabelsToDisplay[id];

    return (
      <div key={id} className="map-multi-label-color-picker-row">
        <div className="color-control__color-block" role="button">
          <ColorBlock
            color={obj.color}
            enableColorPicker
            onColorChange={onColorChange}
            shape="circle"
            size={20}
          />
          <Caret className="color-control__caret" />
        </div>
        <span className="map-multi-label-color-picker-row__label">
          {obj.label}
        </span>
      </div>
    );
  }

  function renderDropdown() {
    const seriesObjects = seriesSettings.seriesObjects();
    const onChange = newValues => {
      const newLabels = {};
      newValues.forEach(val => {
        if (selectedLabelsToDisplay[val] !== undefined) {
          newLabels[val] = selectedLabelsToDisplay[val];
        } else {
          // Default to series default colors, and sync label with series label
          newLabels[val] = {
            color: seriesObjects[val].color(),
            label: seriesObjects[val].label(),
          };
        }
      });
      return onValueChange('selectedLabelsToDisplay', newLabels);
    };

    const options = Object.keys(seriesObjects).map(id => (
      <Dropdown.Option key={id} value={id}>
        {seriesObjects[id].label()}
      </Dropdown.Option>
    ));

    return (
      <Dropdown.Multiselect
        defaultDisplayContent={I18N.text('0 selected')}
        onSelectionChange={onChange}
        value={Object.keys(selectedLabelsToDisplay)}
      >
        {options}
      </Dropdown.Multiselect>
    );
  }

  return (
    <div className="map-multi-label-settings">
      <span className="map-multi-label-settings__title">
        <I18N>Show Series</I18N>
      </span>
      <div className="map-multi-label-settings__controls">
        {renderDropdown()}
        {Object.keys(selectedLabelsToDisplay).map(id =>
          renderColorPickerRow(id),
        )}
      </div>
    </div>
  );
}
