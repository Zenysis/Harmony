// @flow
import * as React from 'react';
import Promise from 'bluebird';
import classNames from 'classnames';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import * as Zen from 'lib/Zen';
import AuthorizationService from 'services/AuthorizationService';
import DataQualityInsightSummary from 'models/AdvancedQueryApp/Insights/DataQualityInsight/DataQualityInsightSummary';
import Field from 'models/core/wip/Field';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import QueryBuilder from 'components/AdvancedQueryApp/QueryFormPanel/QueryBuilder';
import QuerySelections from 'models/core/wip/QuerySelections';
import Spacing from 'components/ui/Spacing';
import Tab from 'components/ui/Tabs/Tab';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import Tabs from 'components/ui/Tabs';
import Tooltip from 'components/ui/Tooltip';
import {
  RESOURCE_TYPES,
  SITE_PERMISSIONS,
} from 'services/AuthorizationService/registry';
import { autobind, memoizeOne } from 'decorators';
import { cancelPromise } from 'util/promiseUtil';
import { environment } from 'util/graphql';
import { noop } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';

const ENABLE_ANALYTICAL_INSIGHTS = false;

const titleInsights = I18N.text('Insights');
const titleQuality = I18N.text('Quality');

const INSIGHTS_TAB_NAME = ENABLE_ANALYTICAL_INSIGHTS
  ? titleInsights
  : titleQuality;

const BUILD_QUERY_TAB_NAME = I18N.text('Build Query');

const LOADING_SPINNER = (
  <Spacing flex justifyContent="center" marginTop="xxxl">
    <LoadingSpinner />
  </Spacing>
);

type Props = {
  currentQueryTab: QueryTabItem,
  onQuerySelectionsChange: QuerySelections => void,
  // NOTE: For saving to links
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  tabsAreEnabled: boolean,
};

type State = {
  analyticalInsightsData: void,
  canViewDataQuality: boolean,
  dataQualityInsightsData: void | {
    +[fieldId: string]: DataQualityInsightSummary,
    ...,
  },
  loadingAnalyticalInsights: boolean,
  loadingDataQualityInsights: boolean,

  // the previous query tab we were on
  prevQueryTab: QueryTabItem | void,

  selectedFieldId: string | void,

  // are we on the query tab or insights tab?
  selectedFormTab: string,
};

export default class QueryFormPanel extends React.PureComponent<Props, State> {
  state: State = {
    analyticalInsightsData: undefined,
    canViewDataQuality: false,
    dataQualityInsightsData: undefined,
    loadingAnalyticalInsights: false,
    loadingDataQualityInsights: false,
    // eslint-disable-next-line react/no-unused-state
    prevQueryTab: undefined,
    selectedFieldId: undefined,
    selectedFormTab: BUILD_QUERY_TAB_NAME,
  };

  // Track the outstanding insights promise so we can cancel it when the
  // component unmounts.
  _analyticalInsightsPromise: Promise<mixed> = Promise.resolve();
  _dataQualityInsightsPromise: Promise<mixed> = Promise.resolve();
  _dqlAuthPromise: Promise<mixed> = Promise.resolve();

  static getDerivedStateFromProps(props: Props, state: State): State {
    if (
      state.prevQueryTab === undefined ||
      state.prevQueryTab.id() !== props.currentQueryTab.id()
    ) {
      // if we've updated the query tab, then reset the form to the
      // "Build Query" tab, so we don't stay on the Insights tab
      return {
        ...state,
        prevQueryTab: props.currentQueryTab,
        selectedFormTab: BUILD_QUERY_TAB_NAME,
      };
    }

    return state;
  }

  componentDidMount() {
    this._dqlAuthPromise = AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.VIEW_DATA_QUALITY,
      RESOURCE_TYPES.SITE,
    ).then(canViewDataQuality => {
      this.setState({ canViewDataQuality });
    });
  }

  componentWillUnmount() {
    cancelPromise(this._analyticalInsightsPromise);
    cancelPromise(this._dataQualityInsightsPromise);
    cancelPromise(this._dqlAuthPromise);
  }

  updateInsights(prevQuerySelections: QuerySelections | void = undefined) {
    const { querySelections } = this.props;
    const { canViewDataQuality } = this.state;

    // If querySelctions has not changed, we do not need to check for new
    // insights.
    if (
      querySelections === prevQuerySelections ||
      querySelections === undefined ||
      (prevQuerySelections !== undefined &&
        querySelections.isQueryEqual(prevQuerySelections))
    ) {
      return;
    }

    // Cancel the outstanding promise since we don't want to get into a data
    // race where the previous promise takes longer to resolve than the new one,
    // causing us to call `setState` with old data.
    cancelPromise(this._analyticalInsightsPromise);
    cancelPromise(this._dataQualityInsightsPromise);

    if (ENABLE_ANALYTICAL_INSIGHTS) {
      // clear existing data so it will show loading
      this.setState(
        { analyticalInsightsData: undefined, loadingAnalyticalInsights: false },
        () => {},
      );
    }
  }

  @memoizeOne
  countInsights(
    analyticalInsightsData: void,
    dataQualityInsightsData: void | {
      +[fieldId: string]: DataQualityInsightSummary,
      ...,
    },
    fieldIds: $ReadOnlyArray<string>,
  ): number {
    return fieldIds.reduce((numInsights, fieldId) => {
      const numAnalyticalInsightsForField =
        analyticalInsightsData !== undefined
          ? analyticalInsightsData[fieldId].insights().length
          : 0;
      const numDataQualityInsightsForField =
        dataQualityInsightsData !== undefined
          ? dataQualityInsightsData[fieldId].insights().length
          : 0;

      return (
        numInsights +
        numAnalyticalInsightsForField +
        numDataQualityInsightsForField
      );
    }, 0);
  }

  @memoizeOne
  buildSelectedFieldId(
    fields: Zen.Array<Field>,
    currentSelectedFieldId: string | void,
  ): string {
    // If the current selected field ID still exists in the query, preserve it
    // as the current selection.
    if (
      currentSelectedFieldId !== undefined &&
      fields.find(f => f.id() === currentSelectedFieldId)
    ) {
      return currentSelectedFieldId;
    }

    return fields.first().id();
  }

  getSelectedFieldId(): string | void {
    const { selectedFieldId } = this.state;
    const fields = this.props.querySelections.fields();
    const output = !fields.isEmpty()
      ? this.buildSelectedFieldId(fields, selectedFieldId)
      : undefined;

    return output;
  }

  @memoizeOne
  buildInsightsFieldIds(fields: Zen.Array<Field>): $ReadOnlyArray<string> {
    return fields.mapValues(f => f.id());
  }

  shouldShowInsightsTab(): boolean {
    const { canViewDataQuality } = this.state;
    return false;
  }

  @autobind
  onUpdateSelectedFieldId(fieldId: string) {
    this.setState({ selectedFieldId: fieldId });
  }

  @autobind
  onTabChange(selectedTab: string) {
    this.setState({ selectedFormTab: selectedTab });

    // NOTE: Due to data quality outliers memory usage we
    // currently only want to run the insights query when the insights tab is
    // opened
    // TODO: Update insights whenever the query changes when we resolve
    // the high memory usage issues.
    if (selectedTab === titleInsights || selectedTab === titleQuality) {
      this.updateInsights();
    }
  }

  maybeRenderInsightsCountBadge(): React.Node {
    const { querySelections } = this.props;
    const { analyticalInsightsData, dataQualityInsightsData } = this.state;

    const insightsCount = this.countInsights(
      analyticalInsightsData,
      dataQualityInsightsData,
      this.buildInsightsFieldIds(querySelections.fields()),
    );
    if (insightsCount === 0) {
      return null;
    }

    // Maximum number of insights to show in the count is 9
    const badgeText = insightsCount > 9 ? '9+' : `${insightsCount}`;
    return (
      <div className="aqt-query-form-panel__insights-count-badge">
        <span className="aqt-query-form-panel__insights-count-text">
          {badgeText}
        </span>
      </div>
    );
  }

  maybeRenderInsights(): React.Node {
    return null;
  }

  renderQueryBuilder(): React.Node {
    const { onQuerySelectionsChange, querySelections } = this.props;

    // if we can't view the insights tab then this is the only
    // tab visible. In `renderTabHeader` we hide the headers in that case,
    // and instead we choose to render a larger heading here
    return (
      <React.Suspense fallback={LOADING_SPINNER}>
        {!this.shouldShowInsightsTab() && (
          <Heading.Large className="aqt-query-form-panel__title">
            {I18N.textById('Build Query')}
          </Heading.Large>
        )}
        <QueryBuilder
          onQuerySelectionsChange={onQuerySelectionsChange}
          querySelections={querySelections}
        />
      </React.Suspense>
    );
  }

  @autobind
  renderTabHeader(
    name: string,
    onClick: () => void,
    isActive: boolean,
    tabIndex: number,
    disabled?: boolean,
    testId?: string,
  ): React.Node {
    if (!this.shouldShowInsightsTab()) {
      // if we can't view data quality tab, then hide all tab headers because there
      // will be only 1 tab visible
      return null;
    }

    // TODO: removing tab count header temporarily, will add back when we
    // resume work on analytical insights.
    // const insightsCountBadge =
    //   tabIndex === 1 ? this.maybeRenderInsightsCountBadge() : null;
    const insightsCountBadge = null;
    const header = (
      <>
        <TabHeader
          disabled={disabled}
          isActive={isActive}
          marginRight={0}
          name={name}
          onTabClick={disabled ? noop : onClick}
          testId={testId}
          useLightWeightHeading={false}
        />
        {insightsCountBadge}
      </>
    );

    if ((name === titleQuality || name === titleInsights) && disabled) {
      return (
        <Tooltip
          content={I18N.text(
            'Please select an indicator to view Quality score and details',
          )}
          popoverClassName="aqt-query-form-panel__tab-header-popover"
        >
          {header}
        </Tooltip>
      );
    }

    return header;
  }

  render(): React.Node {
    const { tabsAreEnabled } = this.props;
    const { selectedFormTab } = this.state;

    // TODO: rename quality tab back to insights when we resume work on
    // analytical insights.
    const selectedFieldId = this.getSelectedFieldId();
    const noSelectedFields = selectedFieldId === undefined;
    const className = classNames(
      'aqt-query-form-panel advanced-query-app__main-column',
      {
        'advanced-query-app__main-column--disabled-tabs': !tabsAreEnabled,
        'aqt-query-form-panel__insights-pane': this.shouldShowInsightsTab(),
      },
    );

    return (
      <RelayEnvironmentProvider environment={environment}>
        <Tabs.Controlled
          className={className}
          onTabChange={this.onTabChange}
          renderHeader={this.renderTabHeader}
          selectedTab={selectedFormTab}
          tabHeaderSpacing={0}
        >
          <Tab containerType="no padding" name={BUILD_QUERY_TAB_NAME}>
            {this.renderQueryBuilder()}
          </Tab>
          <Tab
            containerType="no padding"
            disabled={noSelectedFields}
            name={INSIGHTS_TAB_NAME}
            testId="insights-tab"
          >
            {this.maybeRenderInsights()}
          </Tab>
        </Tabs.Controlled>
      </RelayEnvironmentProvider>
    );
  }
}
