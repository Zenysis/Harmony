// @flow
import * as React from 'react';

import AlertDefinition from 'models/AlertsApp/AlertDefinition';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';

const MODES = Object.freeze({
  DELETE: 'DELETE',
  EDIT: 'EDIT',
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

const defaultProps: DefaultProps = {
  onClick: () => {},
};

export const Modes: typeof MODES = MODES;

export default function AlertDefActionIcon(
  props: Props,
): React.Element<typeof Icon> {
  const { alertDef, mode } = props;

  function onClick(event: SyntheticEvent<HTMLSpanElement>) {
    props.onClick(alertDef, event);
  }

  const classType = React.useMemo(
    () => (mode === MODES.DELETE ? 'remove' : 'edit'),
    [mode],
  );

  const ariaName = React.useMemo(
    () =>
      mode === Modes.DELETE
        ? I18N.text('Remove Alert')
        : I18N.textById('Edit Alert'),
    [mode],
  );

  return (
    <Icon
      ariaName={ariaName}
      className="alerts-app__table-action-icon"
      onClick={onClick}
      type={classType}
    />
  );
}

AlertDefActionIcon.defaultProps = defaultProps;
