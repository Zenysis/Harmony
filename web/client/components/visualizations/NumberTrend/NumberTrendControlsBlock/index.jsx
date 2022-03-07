// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import { Option } from 'components/visualizations/common/controls/DropdownControl';
import type { ControlsBlockProps } from 'components/visualizations/common/types/controlsBlockProps';

const TEXT = t('visualizations.NumberTrend.Settings');
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
        flex
        alignItems="center"
        justifyContent="space-between"
        style={{ width: '50%' }}
      >
        {TEXT.displayLastValue}
        <Checkbox
          className="number-trend-settings-control-element"
          value={controls.showLastValue()}
          onChange={val => onControlsSettingsChange('showLastValue', val)}
        />
      </Group.Horizontal>
    );
  }

  function renderPrimaryFieldSelection() {
    return (
      <Group.Horizontal
        flex
        alignItems="center"
        firstItemFlexValue={1}
        justifyContent="space-between"
      >
        {TEXT.primaryField}
        <Dropdown
          buttonClassName="number-trend-settings-control-element"
          value={controls.selectedField()}
          onSelectionChange={val =>
            onControlsSettingsChange('selectedField', val)
          }
        >
          {fieldOptions}
        </Dropdown>
      </Group.Horizontal>
    );
  }

  function renderSecondaryFieldSelection() {
    // TODO(nina): We should build this option into the dropdown component
    const options = [
      <Option key="0" value={NO_SELECTION}>
        {t('ui.Dropdown.noSelection')}
      </Option>,
      ...fieldOptions,
    ];

    const secondaryField = controls.secondarySelectedField();

    return (
      <Group.Horizontal
        flex
        alignItems="center"
        justifyContent="space-between"
        style={{ width: '50%' }}
        firstItemFlexValue={1}
      >
        {TEXT.secondaryField}
        <Dropdown
          buttonClassName="number-trend-settings-control-element"
          value={secondaryField === undefined ? NO_SELECTION : secondaryField}
          onSelectionChange={val =>
            onControlsSettingsChange(
              'secondarySelectedField',
              val === NO_SELECTION ? undefined : val,
            )
          }
        >
          {options}
        </Dropdown>
      </Group.Horizontal>
    );
  }

  return (
    <Group.Vertical>
      <Group.Horizontal
        flex
        spacing="none"
        alignItems="center"
        marginBottom="m"
        spacingUnit="em"
        itemStyle={{ width: '50%' }}
      >
        {renderPrimaryFieldSelection()}
        <Group.Horizontal
          flex
          alignItems="center"
          marginLeft="m"
          spacingUnit="em"
        >
          {TEXT.displayAsPill}
          <Checkbox
            value={controls.displayValueAsPill()}
            onChange={val =>
              onControlsSettingsChange('displayValueAsPill', val)
            }
          />
        </Group.Horizontal>
      </Group.Horizontal>
      {renderSecondaryFieldSelection()}
      {maybeRenderShowLastValue()}
    </Group.Vertical>
  );
}
