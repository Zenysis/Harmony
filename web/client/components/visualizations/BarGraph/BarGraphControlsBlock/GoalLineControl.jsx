// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import Dropdown from 'components/ui/Dropdown';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import {
  Y1_AXIS,
  Y2_AXIS,
} from 'components/visualizations/common/SettingsModal/AxesSettingsTab/constants';
import { autobind } from 'decorators';
import type { GoalLineData } from 'components/ui/visualizations/common/MetricAxis/types';

type DefaultProps = {
  className: string,
};

type Props = {
  ...DefaultProps,
  goalLine: GoalLineData,
  onGoalLineSettingsChange: (goalLine: GoalLineData) => void,
};

const TEXT = t(
  'visualizations.common.SettingsModal.GeneralSettingsTab.GoalLineSection',
);

const AXES_OPTIONS = [
  <Dropdown.Option key={Y1_AXIS} value={Y1_AXIS}>
    Y1
  </Dropdown.Option>,
  <Dropdown.Option key={Y2_AXIS} value={Y2_AXIS}>
    Y2
  </Dropdown.Option>,
];

function isValidValue(value: string) {
  return !Number.isNaN(Number(value)) && value !== '';
}

export default class GoalLineControl extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    className: '',
  };

  @autobind
  onValueChange(rawValue: string) {
    const { goalLine, onGoalLineSettingsChange } = this.props;
    if (isValidValue(rawValue)) {
      onGoalLineSettingsChange({ ...goalLine, value: Number(rawValue) });
    }
  }

  @autobind
  onLabelChange(newLabel: string) {
    const { goalLine, onGoalLineSettingsChange } = this.props;
    onGoalLineSettingsChange({ ...goalLine, label: newLabel });
  }

  render(): React.Node {
    const { className, goalLine, onGoalLineSettingsChange } = this.props;
    const { axis, label, value } = goalLine;

    // TODO(david): Refactor this to use the InputControl and DropdownControl
    // components
    return (
      <Control
        // TODO(david): Extract the goal-lines-section__box class to a component
        // to wrap groups of controls
        className={`goal-lines-section__box ${className}`}
      >
        <LabelWrapper
          className="goal-lines-section__control"
          labelClassName="settings-modal__control-label"
          label={TEXT.value}
        >
          <InputText.Uncontrolled
            debounce
            id={`value-${goalLine.id}`}
            initialValue={`${value}`}
            placeholder={TEXT.defaultValue}
            onChange={this.onValueChange}
            type="number"
          />
        </LabelWrapper>
        <LabelWrapper
          className="goal-lines-section__control"
          labelClassName="settings-modal__control-label"
          label={TEXT.label}
        >
          <InputText.Uncontrolled
            debounce
            id={`label-${goalLine.id}`}
            initialValue={label}
            placeholder={TEXT.defaultLabel}
            onChange={this.onLabelChange}
          />
        </LabelWrapper>
        <LabelWrapper
          className="goal-lines-section__control"
          label={TEXT.axis}
          labelClassName="settings-modal__control-label"
        >
          <Dropdown
            value={axis}
            onSelectionChange={newAxis =>
              onGoalLineSettingsChange({ ...goalLine, axis: newAxis })
            }
            defaultDisplayContent={axis}
          >
            {AXES_OPTIONS}
          </Dropdown>
        </LabelWrapper>
      </Control>
    );
  }
}
