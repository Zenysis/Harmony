// @flow
import * as React from 'react';
import classnames from 'classnames';

import DataQualityMap from 'models/DataQualityApp/DataQualityMap';
import IndicatorCharacteristicsTab from 'components/DataQualityApp/IndicatorCharacteristicsTab';
import MetricBox from 'components/DataQualityApp/MetricBox';
import Moment from 'models/core/wip/DateTime/Moment';
import ReportingCompletenessTab from 'components/DataQualityApp/ReportingCompletenessTab';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import Well from 'components/ui/Well';
import autobind from 'decorators/autobind';
import { isTabEnabled, TAB_NAMES } from 'components/DataQualityApp/util';
import type Dimension from 'models/core/wip/Dimension';
import type Field from 'models/core/wip/Field';
import type TimeInterval from 'models/core/wip/DateTime/TimeInterval';
import type { Filters, TabName } from 'components/DataQualityApp/util';

type Props = {
  dateFilterOptions: $ReadOnlyArray<Moment>,
  dataQualityMap: DataQualityMap,
  field: Field,
  filters: Filters,
  geographyDimensions: $ReadOnlyArray<Dimension>,
  loading: boolean,
  onTabChange: (selectedTab: TabName) => void,
  selectedTab: TabName,
  timeInterval: TimeInterval,
};

const NUM_TABS = 2;
const TEXT = t('DataQualityApp.DataQualityTabs');

const TAB_TITLES = {
  [TAB_NAMES.INDICATOR_CHARACTERISTICS]: TEXT.indicatorCharacteristics,
  [TAB_NAMES.REPORTING_COMPLETENESS]: TEXT.reportingCompleteness,
  [TAB_NAMES.OUTLIER_ANALYSIS]: TEXT.outlierAnalysis,
};

export default class DataQualityTabs extends React.Component<Props> {
  @autobind
  getTabMaxScore(tabName: string): number {
    const overallQuality = this.props.dataQualityMap.overall();

    if (tabName === TAB_NAMES.INDICATOR_CHARACTERISTICS) {
      return overallQuality.indicatorCharacteristics().maxScore();
    }
    if (tabName === TAB_NAMES.REPORTING_COMPLETENESS) {
      return overallQuality.reportingCompleteness().maxScore();
    }

    return overallQuality.outlierAnalysis().maxScore();
  }

  @autobind
  getFiltersUniqueId(): string {
    const { filters } = this.props;

    const dimensionValueFilterId = filters.dimensionValue
      ? filters.dimensionValue
          .dimensionValues()
          .map(dimensionValue => dimensionValue.id())
          .join()
      : '';

    return `${dimensionValueFilterId}${filters.time.id()}`;
  }

  @autobind
  getTabScore(tabName: string): number {
    const overallQuality = this.props.dataQualityMap.overall();

    if (tabName === TAB_NAMES.INDICATOR_CHARACTERISTICS) {
      return overallQuality.indicatorCharacteristics().score();
    }
    if (tabName === TAB_NAMES.REPORTING_COMPLETENESS) {
      return overallQuality.reportingCompleteness().score();
    }

    return overallQuality.outlierAnalysis().score();
  }

  @autobind
  onTabChange(selectedTabName: string) {
    const { onTabChange } = this.props;
    analytics.track('DQL Tab selected', { selectedTabName });
    onTabChange(((selectedTabName: $Cast): TabName));
  }

  @autobind
  renderHeader(
    name: string,
    onClick: () => void,
    isActive: boolean,
    index: number,
    disabled?: boolean = false,
  ): React.Node {
    const { loading } = this.props;

    const className = classnames('dq-tab__header', {
      'dq-tab__header--active': isActive,
      'dq-tab__header--disabled': disabled,
    });

    const score = this.getTabScore(name);
    const maxScore = this.getTabMaxScore(name);

    const tabTitle = TAB_TITLES[name];

    return (
      <MetricBox
        className={className}
        loading={loading}
        key={name}
        metricName={tabTitle}
        metricValue={score}
        metricMaxValue={maxScore}
        onClick={onClick}
      />
    );
  }

  renderTabContent(content: React.Node, tabIndex: number): React.Node {
    const pointerStyle = {
      left: `${(tabIndex - 0.5) * (100 / NUM_TABS)}%`,
    };

    return (
      <Well className="dq-tab">
        <div style={pointerStyle} className="dq-tab__pointer" />
        {content}
      </Well>
    );
  }

  renderIndicatorCharacteristicsTab(
    tabIndex: number,
  ): React.Element<typeof Tab> {
    const { dataQualityMap, loading } = this.props;

    const overallQuality = dataQualityMap.overall();

    const content = (
      <IndicatorCharacteristicsTab
        dataQuality={overallQuality}
        loading={loading}
      />
    );

    return (
      <Tab
        name={TAB_NAMES.INDICATOR_CHARACTERISTICS}
        disabled={
          !isTabEnabled(TAB_NAMES.INDICATOR_CHARACTERISTICS, overallQuality)
        }
      >
        {this.renderTabContent(content, tabIndex)}
      </Tab>
    );
  }

  renderReportingCompletenessTab(tabIndex: number): React.Element<typeof Tab> {
    const {
      dateFilterOptions,
      dataQualityMap,
      field,
      filters,
      geographyDimensions,
      loading,
      timeInterval,
    } = this.props;

    const overallQuality = dataQualityMap.overall();
    const reportingCompleteness = overallQuality.reportingCompleteness();

    // Force remount to update tab filters if global filters have changed.
    const key = this.getFiltersUniqueId();

    const content = (
      <ReportingCompletenessTab
        dateFilterOptions={dateFilterOptions}
        field={field}
        geographyDimensions={geographyDimensions}
        initialFilters={filters}
        key={key}
        loading={loading}
        reportingCompleteness={reportingCompleteness}
        initialTimeInterval={timeInterval}
      />
    );

    return (
      <Tab
        name={TAB_NAMES.REPORTING_COMPLETENESS}
        disabled={
          !isTabEnabled(TAB_NAMES.REPORTING_COMPLETENESS, overallQuality)
        }
      >
        {this.renderTabContent(content, tabIndex)}
      </Tab>
    );
  }

  render(): React.Node {
    const { selectedTab } = this.props;

    return (
      <React.Fragment>
        <h2 className="dq-tabs__title">{TEXT.title}</h2>
        <Tabs.Controlled
          className="dq-tabs"
          onTabChange={this.onTabChange}
          renderHeader={this.renderHeader}
          selectedTab={selectedTab}
        >
          {/* HACK(david): Manually pass through the position of the tab so that
          it can be used to position the tab pointer when that tab is selected
          */}
          {this.renderIndicatorCharacteristicsTab(1)}
          {this.renderReportingCompletenessTab(2)}
        </Tabs.Controlled>
      </React.Fragment>
    );
  }
}
