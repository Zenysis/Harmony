// @flow
import * as React from 'react';

type Props = {|
  children: React.Node,

  /** The class name to be applied on the tab's body */
  className: string,

  /** The class name to be applied on the tab's header */
  headerClassName: string, // eslint-disable-line react/no-unused-prop-types

  /**
   * The name of this tab. It must be unique, and it is the name that is
   * passed to the `onTabChange` in `<Tabs>`
   */
  name: string, // eslint-disable-line react/no-unused-prop-types

  /**
   * This gets added as a `zen-test-id` attribute on the tab's header. Use this
   * only when you need to select a tab in a webdriver test. The xpath to select
   * this tab's header would be:
   *
   * `//div[@zen-test-id="yourTestId"]`
   */
  testId?: string, // eslint-disable-line react/no-unused-prop-types
|};

const defaultProps = {
  className: '',
  headerClassName: '',
  testId: undefined,
};

/**
 * `<Tab>` can be wrapped by either [`<Tabs>`](#tabs) or
 * [`<TabbedModal>`](#tabbedmodal)
 */
export default function Tab(props: Props) {
  const { children, className } = props;
  return <div className={`zen-tab ${className}`}>{children}</div>;
}

Tab.defaultProps = defaultProps;
