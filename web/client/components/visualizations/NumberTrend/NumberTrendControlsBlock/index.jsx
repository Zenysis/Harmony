// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import { Option } from 'components/visualizations/common/controls/DropdownControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

// While dropdowns can take 'undefined' as a value to indicate no selection,
// they can't actually take 'undefined' as a value that a user could select,
// i.e., a user can never SELECT a 'No selection' option
const NO_SELECTION = '';

type Props = ControlsBlockProps<'NUMBER_TREND'>;

export default function NumberTrendControlsBlock(props: Props): React.Node {
  const { controls, fields, groupBySettings, onControlsSettingsChange } = props;
  const fieldOptions = fields.map(field => (
    <Option key={field.get('id')} value={field.get('id')}>
      {field.get('label')}
    </Option>
  ));

  function maybeRenderShowLastValue() {
    if (
      !groupBySettings
        .groupings()
        .keys()
        .includes('timestamp')
    ) {
      return null;
    }
    return (
      <Group.Horizontal
        alignItems="center"
        flex
        justifyContent="space-between"
        style={{ width: '50%' }}
      >
        <I18N id="displayLastValue">Display last value</I18N>
        <Checkbox
          className="number-trend-settings-control-element"
          onChange={val => onControlsSettingsChange('showLastValue', val)}
          value={controls.showLastValue()}
        />
      </Group.Horizontal>
    );
  }

  function renderPrimaryFieldSelection() {
    return (
      <Group.Horizontal
        alignItems="center"
        firstItemFlexValue={1}
        flex
        justifyContent="space-between"
      >
        <I18N>Primary Field</I18N>
        <Dropdown
          buttonClassName="number-trend-settings-control-element"
          onSelectionChange={val =>
            onControlsSettingsChange('selectedField', val)
          }
          value={controls.selectedField()}
        >
          {fieldOptions}
        </Dropdown>
      </Group.Horizontal>
    );
  }

  function renderSecondaryFieldSelection() {
    // TODO: We should build this option into the dropdown component
    const options = [
      <Option key="0" value={NO_SELECTION}>
        {I18N.text('No selection')}
      </Option>,
      ...fieldOptions,
    ];

    const secondaryField = controls.secondarySelectedField();

    return (
      <Group.Horizontal
        alignItems="center"
        firstItemFlexValue={1}
        flex
        justifyContent="space-between"
        style={{ width: '50%' }}
      >
        <I18N>Secondary Field</I18N>
        <Dropdown
          buttonClassName="number-trend-settings-control-element"
          onSelectionChange={val =>
            onControlsSettingsChange(
              'secondarySelectedField',
              val === NO_SELECTION ? undefined : val,
            )
          }
          value={secondaryField === undefined ? NO_SELECTION : secondaryField}
        >
          {options}
        </Dropdown>
      </Group.Horizontal>
    );
  }

  return (
    <Group.Vertical>
      <Group.Horizontal
        alignItems="center"
        flex
        itemStyle={{ width: '50%' }}
        marginBottom="m"
        spacing="none"
        spacingUnit="em"
      >
        {renderPrimaryFieldSelection()}
        <Group.Horizontal
          alignItems="center"
          flex
          marginLeft="m"
          spacingUnit="em"
        >
          <I18N>Display as pill</I18N>
          <Checkbox
            onChange={val =>
              onControlsSettingsChange('displayValueAsPill', val)
            }
            value={controls.displayValueAsPill()}
          />
        </Group.Horizontal>
      </Group.Horizontal>
      {renderSecondaryFieldSelection()}
      {maybeRenderShowLastValue()}
    </Group.Vertical>
  );
}
