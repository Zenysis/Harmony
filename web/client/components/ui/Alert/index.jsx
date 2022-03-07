// @flow
import * as React from 'react';
import classNames from 'classnames';

import Colors from 'components/ui/Colors';
import Icon from 'components/ui/Icon';
import InfoTooltip from 'components/ui/InfoTooltip';

type Props = {
  /** The title of the alert. */
  title: React.Node,

  /**
   * Display the Alert with a Card style instead of a flat style.
   * This is useful if the Alert is being shown outside of a panel and needs to
   * look more distinct.
   */
  card?: boolean,

  /**
   * The content of the alert. When a string is passed, default text formatting
   * will be applied.
   */
  children?: React.Node,

  className?: string,

  /** The intent of the alert. */
  // TODO(stephen, pablo): The Intents.js file is too restrictive for what we
  // want to express here. Consolidate usages.
  intent?: 'none' | 'success' | 'warning' | 'error',

  /**
   * If set, the alert will show a "remove" icon which, when clicked, will
   * trigger this callback.
   */
  onRemove?: (() => void) | void,

  /** If set, no icon will be shown. */
  noIcon?: boolean,

  /** If set, no border will be shown on the left side of the alert. */
  noTrim?: boolean,

  /** The id of the alert. */
  id?: string,

  /** Tooltip text to be displayed on icon hover.  */
  tooltipText?: string,
};

const INTENT_TO_ICON = {
  error: 'svg-error-sign',
  none: 'svg-info-sign',
  success: 'svg-success-sign',
  warning: 'svg-warning-sign',
};

const INTENT_TO_COLOR = {
  error: Colors.ERROR,
  none: Colors.BLUE_PRIMARY,
  success: Colors.SUCCESS,
  warning: Colors.WARNING,
};

/**
 * The `Alert` component is used to give feedback to the user about an action or
 * state.
 */
function Alert({
  title,

  card = false,
  children = null,
  className = '',
  intent = 'none',
  onRemove = undefined,
  noIcon = false,
  noTrim = false,
  id = '',
  tooltipText = '',
}: Props) {
  const fullClassName = classNames('ui-alert', className, {
    'ui-alert--card': card,
  });
  const blockClassName = classNames('ui-alert__block', {
    'ui-alert__block--card': card,
    'ui-alert__block--no-trim': noTrim,
  });
  const color = INTENT_TO_COLOR[intent];

  const trimStyle = {
    borderLeft: `3px solid ${!noTrim ? color : 'transparent'}`,
  };

  const maybeRenderIcon = (): React.Node => {
    if (noIcon) {
      return null;
    }
    if (tooltipText !== '') {
      return (
        <InfoTooltip
          iconClassName="ui-alert__icon"
          iconStyle={{ color }}
          iconType={INTENT_TO_ICON[intent]}
          text={tooltipText}
        />
      );
    }
    return (
      <Icon
        className="ui-alert__icon"
        style={{ color }}
        type={INTENT_TO_ICON[intent]}
      />
    );
  };

  // If the children is a string, wrap it in a div and apply default formatting.
  // prettier-ignore
  const content = typeof children === 'string'
    ? <div className="ui-alert__content-text">{children}</div>
    : children;
  return (
    <div className={fullClassName} style={trimStyle} id={id}>
      <div className={blockClassName}>
        {maybeRenderIcon()}
        <div className="ui-alert__title">{title}</div>
        {onRemove !== undefined && (
          <div
            className="ui-alert__remove-button"
            onClick={onRemove}
            role="button"
          >
            <Icon className="ui-alert__remove-button-icon" type="remove" />
          </div>
        )}
        {content !== null && <div className="ui-alert__content">{content}</div>}
      </div>
    </div>
  );
}

export default (React.memo(Alert): React.AbstractComponent<Props>);
