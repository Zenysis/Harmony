// @flow
import * as React from 'react';

type Props = {
  children: React.Node,

  /**
   * The name of this tab. It must be unique, and it is the name that is
   * passed to the `onTabChange` in `<Tabs>`
   */
  name: string,

  /** The class name to be applied on the tab's body */
  className?: string,

  /**
   * The type of container to use for the tab:
   * - `'default'`: Default styling for the tab with built in padding
   * - `'no padding'`: A tab container without any padding.
   */
  containerType?: 'default' | 'no padding',

  /** Determines whether a user can navigate to this tab. */
  disabled?: boolean,

  /** The class name to be applied on the tab's header */
  headerClassName?: string,

  /**
   * If this tab is expensive to render, you might not want it to mount until
   * it actually becomes active. Setting this to true means that the contents
   * of this tab will remain `null` until it's time to render it.
   */
  lazyLoad?: boolean,

  /**
   * This gets added as a `data-testid` attribute on the tab's header. Use this
   * only when you need to select a tab in a webdriver test. The xpath to select
   * this tab's header would be:
   *
   * `//div[@data-testid="yourTestId"]`
   */
  testId?: string,
};

/**
 * `<Tab>` can be wrapped by either [`<Tabs>`](#tabs) or
 * [`<TabbedModal>`](#tabbedmodal)
 */
export default function Tab({
  children,
  name, // eslint-disable-line no-unused-vars
  className = '',
  containerType = 'default', // eslint-disable-line no-unused-vars
  disabled = false, // eslint-disable-line no-unused-vars
  headerClassName = '', // eslint-disable-line no-unused-vars
  lazyLoad = false, // eslint-disable-line no-unused-vars
  testId = undefined, // eslint-disable-line no-unused-vars
}: Props): React.Element<'div'> {
  return <div className={`zen-tab ${className}`}>{children}</div>;
}
