// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import { noop } from 'util/util';

type Props = {
  children: React.Node,

  /** The page name to include in the progress header */
  name: string,

  className?: string,

  /** Validate that the current page has met all necessary conditions */
  disableMainButton?: boolean,

  mainButtonText?: string,

  /**
   * The action to take when clicking the main button. Automatically
   * progresses to the next page, or closes the modal on the last page
   */
  onMainButtonClick?: (e: SyntheticEvent<>) => void,
};

/**
 * One page for the Progress Modal
 */
export default function Page({
  children,
  name, // eslint-disable-line no-unused-vars
  className = '',
  // getDisableMainButton = () => false, // eslint-disable-line no-unused-vars
  disableMainButton = false, // eslint-disable-line no-unused-vars
  mainButtonText = I18N.textById('Next'), // eslint-disable-line no-unused-vars
  onMainButtonClick = noop, // eslint-disable-line no-unused-vars
}: Props): React.Node {
  return <div className={className}>{children}</div>;
}
