// @flow
import * as React from 'react';

import ControlledTabs from 'components/ui/Tabs/ControlledTabs';
import Tab from 'components/ui/Tabs/Tab';
import autobind from 'decorators/autobind';
import { noop } from 'util/util';

type DefaultProps = {
  className: string,

  /** Class to be applied to the tab contents */
  contentsClassName: string,

  /** Class to be applied to the div wrapping the tab headers */
  headerRowClassName: string,

  /** Optional prop to render a custom element to the right of the tab header */
  headerRowRightContent?: React.Node,

  /** The name of the first tab to show. Defaults to the first tab. */
  initialTab?: string, // defaults to first tab

  /** Called when the active tab changes */
  onTabChange: (selectedTabName: string) => void,

  /**
   * Optional prop to render a custom tab header.
   * @param {string} name The tab header's unique name
   * @param {Function} onClick The callback you must call somewhere in your
   * custom tab header to make it clickable
   * @param {boolean} isActive If the tab is currently active
   * @param {number} tabIndex The tab's index in the array of tabs
   * @param {boolean} disabled If the current tab is disabled
   * @param {string} testId  Can be used as a `data-testid` attribute on the
   * header. This is only needed for webdriver tests.
   */
  renderHeader?: (
    name: string,
    onClick: () => void,
    isActive: boolean,
    tabIndex: number,
    disabled?: boolean,
    testId?: string,
  ) => React.Node,

  // TODO(abby): enforce spacing variables for tabHeaderSpacing
  /**
   * The spacing between each tab heading. Any valid padding value is allowed
   * here, so you can either pass a percentage width as a string, or an exact
   * pixel width as a number.
   */
  tabHeaderSpacing: string | number,

  /** The size of the heading to use in the tab headers */
  tabHeadingSize: 'small' | 'medium' | 'large',

  /** The title to render next to the tab header */
  title: string,

  /** An optional tooltip to render next to the title */
  titleTooltip: string,
};

type Props = {
  ...DefaultProps,
  children: React.ChildrenArray<?React.Element<typeof Tab>>,
};

type State = {
  selectedTab: string,
};

/**
 * An easy way to create a series of tabs.
 * All children must be of type `<Tab>`.
 *
 * This is an **uncontrolled** component, meaning that the state of which tab
 * to show is handled internally by this component. You cannot control which
 * tab to show via a prop. You can only specify the _initial_ tab.
 *
 * For a controlled version use [`<Tabs.Controlled>`](#controlledtabs)
 */
export default class Tabs extends React.Component<Props, State> {
  static defaultProps: DefaultProps = {
    className: '',
    contentsClassName: '',
    headerRowClassName: '',
    headerRowRightContent: undefined,
    initialTab: undefined,
    onTabChange: noop,
    renderHeader: undefined,
    tabHeaderSpacing: 50,
    tabHeadingSize: 'small',
    title: '',
    titleTooltip: '',
  };

  static Controlled: typeof ControlledTabs = ControlledTabs;

  state: State = {
    selectedTab:
      this.props.initialTab ||
      React.Children.toArray(this.props.children)[0].props.name,
  };

  @autobind
  onTabChange(selectedTab: string) {
    this.setState({ selectedTab }, () =>
      this.props.onTabChange(this.state.selectedTab),
    );
  }

  render(): React.Element<typeof ControlledTabs> {
    const { selectedTab } = this.state;

    const {
      children,
      initialTab,
      onTabChange,
      ...passThroughProps
    } = this.props;
    return (
      <ControlledTabs
        onTabChange={this.onTabChange}
        selectedTab={selectedTab}
        {...passThroughProps}
      >
        {children}
      </ControlledTabs>
    );
  }
}
