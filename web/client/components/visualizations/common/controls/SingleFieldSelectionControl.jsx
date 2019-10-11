// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import DropdownControl, {
  Option,
} from 'components/visualizations/common/controls/DropdownControl';
import Field from 'models/core/Field';
import type { VisualizationControlProps } from 'components/visualizations/common/controls/commonTypes';

type Props = $Merge<
  VisualizationControlProps<string>,
  {
    fields: Array<Field>,

    buttonMinWidth?: number,
    label: string,
  },
>;

const defaultProps = {
  ...Control.defaultColumnCounts,
  buttonMinWidth: undefined,
  label: t('query_result.controls.selected_field'),
};

export default function SingleFieldSelectionControl(props: Props) {
  const { fields, ...passThroughControlProps } = props;
  const options = props.fields.map(field => (
    <Option key={field.id()} value={field.id()}>
      {field.label()}
    </Option>
  ));

  return (
    <DropdownControl {...passThroughControlProps}>{options}</DropdownControl>
  );
}

SingleFieldSelectionControl.defaultProps = defaultProps;
