// @flow
import * as React from 'react';

import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import type CustomField from 'models/core/Field/CustomField';
import type Field from 'models/core/wip/Field';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

// TODO(stephen, anyone): We don't really want to support the field or
// custom field being passed around in the settings modal. We should be able to
// get everything we need from the QueryResultSeries.
type FieldShape = QueryResultSeries | CustomField | Field;

type Props = {
  ...VisualizationControlProps<string>,
  fields: $ReadOnlyArray<FieldShape>,

  buttonMinWidth?: number,
  label?: string,
  labelClassName?: string,
  seriesSettings?: SeriesSettings | void,
};

export default function SingleFieldSelectionControl({
  controlKey,
  fields,
  onValueChange,
  value,
  buttonMinWidth = undefined,
  label = t('query_result.controls.selected_field'),
  labelClassName = '',
  seriesSettings = undefined,
}: Props): React.Node {
  const options = fields.map(field => {
    const fieldId = field.get('id');
    const seriesObject =
      seriesSettings !== undefined
        ? seriesSettings.getSeriesObject(fieldId)
        : undefined;
    const unselectable =
      seriesObject !== undefined ? !seriesObject.isVisible() : false;
    return (
      <Option key={fieldId} value={fieldId} unselectable={unselectable}>
        {field.get('label')}
      </Option>
    );
  });

  return (
    <DropdownControl
      showButtonContentsOnHover
      controlKey={controlKey}
      value={value}
      onValueChange={onValueChange}
      buttonMinWidth={buttonMinWidth}
      label={label}
      labelClassName={labelClassName}
      menuWidth="auto"
      menuMaxWidth={400}
    >
      {options}
    </DropdownControl>
  );
}
