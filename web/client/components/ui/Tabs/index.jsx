// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';
import Tab from 'components/ui/Tabs/Tab';
import TabContent from 'components/ui/Tabs/internal/TabContent';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { noop } from 'util/util';

type Props = {|
  children: React.ChildrenArray<?React.Element<typeof Tab>>,
  className: string,

  /** The name of the first tab to show. Defaults to the first tab. */
  initialTab?: string, // defaults to first tab

  /** Called when the active tab changes */
  onTabChange: (selectedTabName: string) => void,

  /**
   * The spacing between each tab heading. Any valid padding value is allowed
   * here, so you can either pass a percentage width as a string, or an exact
   * pixel width as a number.
   */
  tabHeaderSpacing: string | number,

  /** The title to render next to the tab header */
  title: string,

  /** An optional tooltip to render next to the title */
  titleTooltip: string,
|};

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
 */
export default class Tabs extends React.Component<Props, State> {
  static defaultProps = {
    className: '',
    initialTab: undefined,
    onTabChange: noop,
    tabHeaderSpacing: 50,
    title: '',
    titleTooltip: '',
  };

  state = {
    selectedTab:
      this.props.initialTab ||
      React.Children.toArray(this.props.children)[0].props.name,
  };

  @memoizeOne
  computeNonNullTabs(
    tabs: React.ChildrenArray<?React.Element<typeof Tab>>,
  ): $ReadOnlyArray<React.Element<typeof Tab>> {
    const nonNullTabs = [];
    React.Children.forEach(tabs, tab => {
      if (tab) {
        nonNullTabs.push(tab);
      }
    });
    return nonNullTabs;
  }

  getNonNullTabs(): $ReadOnlyArray<React.Element<typeof Tab>> {
    return this.computeNonNullTabs(this.props.children);
  }

  @autobind
  onTabClick(selectedTab: string) {
    this.setState({ selectedTab }, () => {
      this.props.onTabChange(this.state.selectedTab);
    });
  }

  maybeRenderTabGroupTitle() {
    const { titleTooltip, title } = this.props;
    if (title !== '') {
      return (
        <Heading.Small className="zen-tabs__title" infoTooltip={titleTooltip}>
          {title}
        </Heading.Small>
      );
    }
    return null;
  }

  renderTabContents() {
    const tabs = this.getNonNullTabs().map(tab => {
      const { name } = tab.props;
      return (
        <TabContent key={name} isActive={name === this.state.selectedTab}>
          {tab}
        </TabContent>
      );
    });
    return <div className="zen-tabs__contents-container">{tabs}</div>;
  }

  renderTabHeader() {
    const renderableTabs = this.getNonNullTabs();
    const { tabHeaderSpacing, title } = this.props;
    const tabHeaders = renderableTabs.map(tab => {
      const { name, headerClassName, testId } = tab.props;
      return (
        <TabHeader
          key={name}
          className={headerClassName}
          name={name}
          isActive={name === this.state.selectedTab}
          onTabClick={this.onTabClick}
          marginRight={tabHeaderSpacing}
          useLightWeightHeading={title !== ''}
          testId={testId}
        />
      );
    });
    return (
      <div className="zen-tabs__header-row">
        {this.maybeRenderTabGroupTitle()}
        {tabHeaders}
      </div>
    );
  }

  render() {
    const { className } = this.props;
    return (
      <div className={`zen-tabs ${className}`}>
        {this.renderTabHeader()}
        {this.renderTabContents()}
      </div>
    );
  }
}
