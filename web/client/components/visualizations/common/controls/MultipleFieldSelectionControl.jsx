// @flow
import * as React from 'react';
import pluralize from 'pluralize';

import Control from 'components/visualizations/common/controls/Control';
import Dropdown from 'components/ui/Dropdown';
import type CustomField from 'models/core/Field/CustomField';
import type Field from 'models/core/wip/Field';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = {
  ...VisualizationControlProps<$ReadOnlyArray<string>>,
  fields: $ReadOnlyArray<CustomField | Field>,

  label?: string,
};

export default function MultipleFieldSelectionControl({
  controlKey,
  onValueChange,
  value,
  fields,
  label = pluralize(t('query_result.controls.selected_field')),
}: Props): React.Node {
  const onChange = React.useCallback(
    newValues => onValueChange(controlKey, newValues),
    [controlKey, onValueChange],
  );
  const options = fields.map(field => (
    <Dropdown.Option key={field.get('id')} value={field.get('id')}>
      {field.get('label')}
    </Dropdown.Option>
  ));

  return (
    <Control label={label}>
      <Dropdown.Multiselect
        defaultDisplayContent="Select indicators"
        onSelectionChange={onChange}
        value={value}
      >
        {options}
      </Dropdown.Multiselect>
    </Control>
  );
}
