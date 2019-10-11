import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import update from 'immutability-helper';

import BaseDashboard from 'components/dashboard/base_dashboard';
import {
  buildGroup,
  GeoResultBuilder,
  mergeRawAggregateResults,
} from 'components/dashboard/dashboard_util';
import { ProgramAreaLookup } from 'indicator_fields';
import ZenClient from 'util/ZenClient';

const CONFIG = window.__JSON_FROM_BACKEND.dashboard;

// TODO(stephen): Don't hardcode sort granularity
// TODO(stephen): Allow the user to change the level
export const SORT_GRANULARITY = 'month';

function _buildGroupSubpageUrl(groupLinkId) {
  if (!groupLinkId) {
    return '';
  }
  // HACK: Manually compose the base url to ensure that we don't include
  // existing subpages in the new url.
  // TODO(stephen): The backend should be able to help with this
  const pieces = window.location.pathname.split('/');
  const baseUrl = pieces.slice(0, pieces.indexOf('geo') + 2).join('/');
  return `${baseUrl}/${groupLinkId}${window.location.search}`;
}

function _buildIndicatorGroups(groupTags, data) {
  if (!data.length) {
    return [];
  }

  const output = [];
  if (groupTags.length) {
    groupTags.forEach((tag) => {
      if (ProgramAreaLookup[tag]) {
        const groupData = [];
        data.forEach((item) => {
          if (ProgramAreaLookup[tag][item.fieldId]) {
            groupData.push(item);
          }
        });
        const groupUrl = _buildGroupSubpageUrl(CONFIG.groupIdLookup[tag]);
        output.push(buildGroup(tag, groupData, groupUrl));
      }
    });
  }

  // TODO(ian, stephen): Properly tag any indicators that will be displayed.
  // This is a workaround for NACOSA
  if (!output.length) {
    output.push(buildGroup('All Indicators', data, 'all-indicators'));
  }
  return output;
}

class GeoDashboardApp extends Component {
  static renderToDOM(elementId = 'app') {
    ReactDOM.render(<GeoDashboardApp />, document.getElementById(elementId));
  }

  constructor() {
    super();

    this.state = {
      loading: true,
      data: [],
      detailedGroups: [],
    };
  }

  componentDidMount() {
    // TODO(stephen): Need a more consistent way to retrieve start and end
    // dates.
    const startDate = moment(CONFIG.dashboardDate)
      .subtract(13, 'month')
      .format('YYYY-MM-DD');

    // The backend can specify the exact query granularities and start/end
    // dates needed to power the geo dashboard. This allows for a large
    // performance improvement since only the data needed for display
    // will be requested.
    // TODO(stephen): Add this logic to the field dashboard too.
    const queries = [];
    CONFIG.queryGranularities.forEach((granularityConfig) => {
      queries.push({
        fields: CONFIG.fields,
        filters: CONFIG.filters,
        granularities: [granularityConfig.granularity],
        start_date: granularityConfig.startDate,
        end_date: granularityConfig.endDate,
      });
    });

    // If no query granularities were specified in the config, we can default
    // to a very broad query that will capture all the data we need.
    if (!queries.length) {
      queries.push({
        granularity: CONFIG.granularity,
        fields: CONFIG.fields,
        filters: CONFIG.filters,
        start_date: startDate,
        end_date: CONFIG.dashboardDate,
        granularities: ['month', 'quarter', 'year', 'all'],
      });
    }

    Promise.all(queries.map(query => ZenClient.post('aggregate', query))).then(
      (queryResults) => {
        const data = mergeRawAggregateResults(queryResults);
        const builder = new GeoResultBuilder(SORT_GRANULARITY, CONFIG.geoKey);
        const result = builder.processResponse(data);
        const indicatorGroups = _buildIndicatorGroups(
          CONFIG.detailedGroups,
          result,
        );
        this.setState(
          update(this.state, {
            data: { $set: result },
            detailedGroups: { $set: indicatorGroups },
            loading: { $set: false },
          }),
        );
      },
    );
  }

  render() {
    const denomSuffix = t('dashboard.field_rank.denominator_label');
    return (
      <BaseDashboard
        data={this.state.data}
        denomSuffix={denomSuffix}
        detailedGroups={this.state.detailedGroups}
        groupSectionTitle={t('dashboard.program_area_label')}
        pageTitle={CONFIG.title}
        pageSubtitle={CONFIG.subtitle}
        childPages={CONFIG.children}
      >
        {this.state.loading ? <h1>Loading...</h1> : null}
      </BaseDashboard>
    );
  }
}

export default GeoDashboardApp;
