// @flow
import * as React from 'react';

import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';

const MODES = Object.freeze({
  EDIT: 'EDIT',
  DELETE: 'DELETE',
});

type Mode = $Keys<typeof MODES>;

type DefaultProps = {
  onClick: (
    alertDef: AlertDefinition,
    event: SyntheticEvent<HTMLSpanElement>,
  ) => void,
};

type Props = {
  ...DefaultProps,
  alertDef: AlertDefinition,
  mode: Mode,
};

export default class AlertDefActionIcon extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    onClick: () => {},
  };

  static Modes: typeof MODES = MODES;

  @autobind
  onClick(event: SyntheticEvent<HTMLSpanElement>) {
    this.props.onClick(this.props.alertDef, event);
  }

  render(): React.Element<typeof Icon> {
    const { mode } = this.props;
    const classType = mode === MODES.DELETE ? 'remove' : 'edit';
    const ariaName =
      mode === MODES.DELETE
        ? I18N.text('Remove Alert')
        : I18N.textById('Edit Alert');
    return (
      <Icon
        type={classType}
        className="alerts-app__table-action-icon"
        onClick={this.onClick}
        ariaName={ariaName}
      />
    );
  }
}
