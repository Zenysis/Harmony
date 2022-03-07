// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';
import Tab from 'components/ui/Tabs/Tab';
import TabContent from 'components/ui/Tabs/internal/TabContent';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { noop } from 'util/util';

type DefaultProps = {
  className: string,

  /** Class to be applied to the contents of each tab */
  contentsClassName: string,

  /** Class to be applied to the div wrapping the tab headers */
  headerRowClassName: string,

  /** Optional prop to render a custom element to the right of the tab header */
  headerRowRightContent?: React.Node,

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

  /** Called when the active tab changes */
  onTabChange: (selectedTabName: string) => void,

  /** The name of the tab to show. */
  selectedTab: string,
};

/**
 * A controlled version of the tabs component. It is controlled through the
 * selectedTab and onTabChange props.
 *
 * @visibleName Tabs.Controlled
 */
export default class ControlledTabs extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    className: '',
    contentsClassName: '',
    headerRowClassName: '',
    headerRowRightContent: undefined,
    renderHeader: undefined,
    tabHeaderSpacing: 50,
    tabHeadingSize: 'small',
    title: '',
    titleTooltip: '',
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

  getTabClickCallback(name: string, disabled: boolean = false): () => void {
    return disabled ? noop : () => this.onTabClick(name);
  }

  @autobind
  onTabClick(selectedTab: string) {
    this.props.onTabChange(selectedTab);
  }

  maybeRenderTabGroupTitle(): React.Node {
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

  maybeRenderHeaderRowRightContent(): React.Node {
    const { headerRowRightContent } = this.props;

    if (headerRowRightContent === undefined) {
      return null;
    }
    return (
      <div className="zen-tabs__right-content">{headerRowRightContent}</div>
    );
  }

  renderTabContents(): React.Node {
    const { contentsClassName } = this.props;

    const tabs = this.getNonNullTabs().map(tab => {
      const { containerType, name, lazyLoad } = tab.props;

      return (
        <TabContent
          className={contentsClassName}
          containerType={containerType}
          key={name}
          isActive={name === this.props.selectedTab}
          lazyLoad={lazyLoad || false}
        >
          {tab}
        </TabContent>
      );
    });
    return <div className="zen-tabs__contents-container">{tabs}</div>;
  }

  renderTabHeaders(): React.Node {
    const renderableTabs = this.getNonNullTabs();
    const {
      renderHeader,
      selectedTab,
      tabHeaderSpacing,
      tabHeadingSize,
      title,
    } = this.props;
    return renderableTabs.map((tab, index) => {
      const { disabled, name, headerClassName, testId } = tab.props;
      const isActive = name === selectedTab;
      const onTabClick = this.getTabClickCallback(name, disabled);
      if (renderHeader) {
        return (
          <React.Fragment key={name}>
            {renderHeader(name, onTabClick, isActive, index, disabled, testId)}
          </React.Fragment>
        );
      }

      return (
        <TabHeader
          className={headerClassName}
          disabled={disabled}
          isActive={isActive}
          key={name}
          marginRight={tabHeaderSpacing}
          name={name}
          onTabClick={onTabClick}
          testId={testId}
          useLightWeightHeading={title !== ''}
          tabHeadingSize={tabHeadingSize}
        />
      );
    });
  }

  renderTabHeaderRow(): React.Node {
    const { headerRowClassName } = this.props;
    return (
      <div className={`zen-tabs__header-row ${headerRowClassName}`}>
        {this.maybeRenderTabGroupTitle()}
        {this.renderTabHeaders()}
        {this.maybeRenderHeaderRowRightContent()}
      </div>
    );
  }

  render(): React.Element<'div'> {
    const { className } = this.props;
    return (
      <div className={`zen-tabs ${className}`}>
        {this.renderTabHeaderRow()}
        {this.renderTabContents()}
      </div>
    );
  }
}
