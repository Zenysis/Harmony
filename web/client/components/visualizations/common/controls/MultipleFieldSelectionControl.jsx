// @flow
import * as React from 'react';
import pluralize from 'pluralize';

import BootstrapSelect from 'components/bootstrap_select';
import Control from 'components/visualizations/common/controls/Control';
import type Field from 'models/core/Field';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

// TODO(pablo): T1607 - change this to use common/Dropdown,

type Props = VisualizationControlProps<$ReadOnlyArray<string>> & {
  fields: $ReadOnlyArray<Field>,

  label: string,
};

const defaultProps = {
  ...Control.defaultColumnCounts,
  label: pluralize(t('query_result.controls.selected_field')),
};

export default function MultipleFieldSelectionControl(props: Props) {
  const {
    controlKey,
    onValueChange,
    value,
    label,
    fields,
    ...passThroughControlProps
  } = props;
  const onChange = event =>
    onValueChange(controlKey, $(event.currentTarget).val() || []);
  const options = fields.map(field => (
    <option key={field.id()} value={field.id()}>
      {field.label()}
    </option>
  ));

  return (
    <Control label={label} {...passThroughControlProps}>
      <BootstrapSelect
        className="form-control btn-group-xs"
        multiple
        data-selected-text-format="count > 0"
        data-width="fit"
        title="Select indicators"
        value={value}
        onChange={onChange}
      >
        {options}
      </BootstrapSelect>
    </Control>
  );
}

MultipleFieldSelectionControl.defaultProps = defaultProps;
