// @flow
import * as React from 'react';

import InfoTooltip from 'components/ui/InfoTooltip';
import { uniqueId } from 'util/util';

const TEXT = t('ui.ToggleSwitch');

type ButtonClickEvent = SyntheticEvent<HTMLButtonElement>;

type Props = {|
  /**
   * Gets called when the toggle is clicked.
   * @param {SyntheticEvent.button} event The click event
   */
  onChange: (event: ButtonClickEvent) => void,

  /**
   * An additional classname you would like to pass to the active switch.
   */
  activeClassName: string,

  /**
   * If the switch is enabled.
   */
  value: boolean,

  /**
   * Text that shows up as a label for the disabled side of the toggle.
   */
  disabledLabel: string,

  /**
   * Text that shows up as a label for the enabled side of the toggle.
   */
  enabledLabel: string,

  /**
   * Icon that shows up as a label for the enabled side of the toggle.
   */
  enabledIcon?: string,

  /**
   * Icon that shows up as a label for the disabled side of the toggle.
   */
  disabledIcon?: string,

  /**
   * Tooltip that shows up on hover for the toggle.
   */
  tooltip?: string,
|};

/**
 * A simple toggle to enable/disable something.
 * This is a controlled component, so the `value` must be provided by the
 * parent. The toggle's state is not being tracked internally.
 */
export default class ToggleSwitch extends React.PureComponent<Props> {
  static defaultProps = {
    disabledLabel: TEXT.disabled,
    enabledLabel: TEXT.enabled,
    activeClassName: '',
    tooltip: '',
    enabledIcon: undefined,
    disabledIcon: undefined,
  };

  _toggleOnId = uniqueId();
  _toggleOffId = uniqueId();

  render() {
    const {
      disabledLabel,
      activeClassName,
      enabledLabel,
      enabledIcon,
      disabledIcon,
      onChange,
      value,
      tooltip,
    } = this.props;

    const enabledIconDiv = enabledIcon ? (
      <i className={`glyphicon ${enabledIcon}`} />
    ) : null;
    const disabledIconDiv = disabledIcon ? (
      <i className={`glyphicon ${disabledIcon}`} />
    ) : null;
    const leftActiveClass = !value ? `active-toggle ${activeClassName}` : '';
    const rightActiveClass = value ? `active-toggle ${activeClassName}` : '';
    const iconStyle = { color: '#fff' };
    const infoTooltip = tooltip ? (
      <InfoTooltip text={tooltip} iconStyle={iconStyle} />
    ) : null;

    return (
      <div className="zen-switch">
        {infoTooltip}
        <input
          id={this._toggleOnId}
          className={`toggle toggle-left ${leftActiveClass}`}
          name="toggle"
          value={!value}
          type="radio"
          onChange={onChange}
        />
        <label htmlFor={this._toggleOnId} className="btn">
          {enabledIconDiv}
          {enabledLabel}
        </label>
        <input
          id={this._toggleOffId}
          className={`toggle toggle-right ${rightActiveClass}`}
          name="toggle"
          value={value}
          type="radio"
          onChange={onChange}
        />
        <label htmlFor={this._toggleOffId} className="btn">
          {disabledIconDiv}
          {disabledLabel}
        </label>
      </div>
    );
  }
}
