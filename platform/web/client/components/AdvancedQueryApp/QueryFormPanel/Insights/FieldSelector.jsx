// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';

type Props = {
  fieldIds: $ReadOnlyArray<string>,
  onUpdateSelectedFieldId: string => void,
  selectedFieldId: string,
  seriesSettings: SeriesSettings,
};

export default function FieldSelector({
  fieldIds,
  onUpdateSelectedFieldId,
  selectedFieldId,
  seriesSettings,
}: Props): React.Element<'div'> {
  const getFieldLabel = React.useCallback(
    (fieldId: string) => {
      const seriesObject = seriesSettings.getSeriesObject(fieldId);
      return seriesObject === undefined ? fieldId : seriesObject.label();
    },
    [seriesSettings],
  );

  return (
    <div className="insights-fields-selector">
      <div className="insights-fields-selector__label">
        <I18N>Selected Indicator</I18N>
      </div>
      <div className="insights-fields-selector__dropdown">
        <Dropdown
          buttonClassName="insights-fields-selector__button"
          onSelectionChange={onUpdateSelectedFieldId}
          value={selectedFieldId}
        >
          {fieldIds.map(fieldId => (
            <Dropdown.Option
              key={fieldId}
              className="insights-fields-selector__option"
              value={fieldId}
            >
              {getFieldLabel(fieldId)}
            </Dropdown.Option>
          ))}
        </Dropdown>
      </div>
    </div>
  );
}
