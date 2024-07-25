// @flow
import * as React from 'react';

import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import I18N from 'lib/I18N';
import type CustomField from 'models/core/Field/CustomField';
import type Field from 'models/core/wip/Field';
import type QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

// TODO: We don't really want to support the field or
// custom field being passed around in the settings modal. We should be able to
// get everything we need from the QueryResultSeries.
type FieldShape = QueryResultSeries | CustomField | Field;

type Props = {
  ...VisualizationControlProps<string>,
  buttonMinWidth?: number,
  fields: $ReadOnlyArray<FieldShape>,
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
  label = I18N.textById('Selected field'),
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
      <Option key={fieldId} unselectable={unselectable} value={fieldId}>
        {field.get('label')}
      </Option>
    );
  });

  return (
    <DropdownControl
      buttonMinWidth={buttonMinWidth}
      controlKey={controlKey}
      label={label}
      labelClassName={labelClassName}
      menuMaxWidth={400}
      menuWidth="auto"
      onValueChange={onValueChange}
      showButtonContentsOnHover
      value={value}
    >
      {options}
    </DropdownControl>
  );
}
