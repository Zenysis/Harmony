// @flow
import * as React from 'react';

import Control from 'components/visualizations/common/controls/Control';
import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
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

    // TODO: Refactor this to use the InputControl and DropdownControl
    // components
    return (
      <Control
        // TODO: Extract the goal-lines-section__box class to a component
        // to wrap groups of controls
        className={`goal-lines-section__box ${className}`}
      >
        <LabelWrapper
          className="goal-lines-section__control"
          label={I18N.textById('Value')}
          labelClassName="settings-modal__control-label"
        >
          <InputText.Uncontrolled
            debounce
            id={`value-${goalLine.id}`}
            initialValue={`${value}`}
            onChange={this.onValueChange}
            placeholder={I18N.text('e.g. 100', 'eg100')}
            type="number"
          />
        </LabelWrapper>
        <LabelWrapper
          className="goal-lines-section__control"
          label={I18N.textById('Label')}
          labelClassName="settings-modal__control-label"
        >
          <InputText.Uncontrolled
            debounce
            id={`label-${goalLine.id}`}
            initialValue={label}
            onChange={this.onLabelChange}
            placeholder={I18N.text('e.g. Target', 'egTarget')}
          />
        </LabelWrapper>
        <LabelWrapper
          className="goal-lines-section__control"
          label={I18N.textById('Axis')}
          labelClassName="settings-modal__control-label"
        >
          <Dropdown
            defaultDisplayContent={axis}
            onSelectionChange={newAxis =>
              onGoalLineSettingsChange({ ...goalLine, axis: newAxis })
            }
            value={axis}
          >
            {AXES_OPTIONS}
          </Dropdown>
        </LabelWrapper>
      </Control>
    );
  }
}
