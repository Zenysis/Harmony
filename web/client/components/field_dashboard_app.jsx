import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import update from 'immutability-helper';

import BaseDashboard from 'components/dashboard/base_dashboard';
import {
  buildGroup,
  FieldResultBuilder,
} from 'components/dashboard/dashboard_util';
import { capitalizeEachWord } from 'util/stringUtil';
import DashboardSection from 'components/dashboard/dashboard_section';
import { IndicatorLookup } from 'indicator_fields';
import { processQueryResponse } from 'components/QueryResult/resultUtil';
import QueryResult from 'components/QueryResult';
import QueryResultSpec from 'models/core/QueryResultSpec';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { SORT_GRANULARITY } from 'components/geo_dashboard_app'; // TODO(stephen): EWW
import ZenClient from 'util/ZenClient';

const CONFIG = window.__JSON_FROM_BACKEND.dashboard;

const ENABLED_VIEW_TYPES = [
  RESULT_VIEW_TYPES.MAP,
  RESULT_VIEW_TYPES.TIME,
  RESULT_VIEW_TYPES.CHART,
];

class FieldDashboardApp extends Component {
  static renderToDOM(elementId = 'app') {
    ReactDOM.render(<FieldDashboardApp />, document.getElementById(elementId));
  }

  constructor() {
    super();

    // TODO(stephen): Show loader while query is in progress.
    this.state = {
      loading: true,
      data: [],
      detailedGroups: [],
      queryViewType: RESULT_VIEW_TYPES.TIME,
    };

    this._fieldTitle = capitalizeEachWord(
      IndicatorLookup[CONFIG.fields[0]].text,
    );
    this._queryResultForGraph = null;
    this.changeViewType = {};
    ENABLED_VIEW_TYPES.forEach(type => {
      this.changeViewType[type] = this.changeQueryViewType.bind(this, type);
    });
  }

  componentDidMount() {
    // TODO(stephen): Need a more consistent way to retrieve start and end
    // dates.
    const startDate = moment(CONFIG.dashboardDate)
      .subtract(13, 'month')
      .format('YYYY-MM-DD');

    // TODO(stephen): Filter by geo.
    const params = {
      granularity: CONFIG.granularity,
      fields: CONFIG.fields,
      filters: CONFIG.filters,
      start_date: startDate,
      end_date: CONFIG.dashboardDate,
      granularities: ['month', 'quarter', 'year', 'all'],
    };

    ZenClient.post('aggregate', params).then(data => {
      this.setupTopQuery(params, data);

      const builder = new FieldResultBuilder(
        SORT_GRANULARITY,
        CONFIG.fields[0],
      );
      const result = builder.processResponse(data);

      // Currently only have one group containing all the geos for
      // this field
      const title = t(
        `dashboard.performance_labels_for_geo.${CONFIG.granularity}`,
      );
      const geoGroups = [buildGroup(title, result.slice())];
      const { fields, filters } = params;
      this._queryResultForGraph = processQueryResponse(data, fields, filters);

      this.setState(
        update(this.state, {
          data: { $set: result },
          detailedGroups: { $set: geoGroups },
          loading: { $set: false },
        }),
      );
    });
  }

  setupTopQuery(selections, data) {
    this._topQuerySelections = Object.assign({}, selections);
    // Match the selections object format expected by the visualizations
    // TODO(stephen): Remove this hack
    this._topQuerySelections.startDate = selections.start_date;
    this._topQuerySelections.endDate = selections.end_date;
    this._topQuerySelections.filters = { geography: CONFIG.filters[0] };
    const selectionsModel = SimpleQuerySelections.fromLegacyObject(
      this._topQuerySelections,
    );

    // Set up query result spec, and force the chart to render with
    // the correct controls already enabled
    const queryResultSpec = QueryResultSpec.fromSimpleQuerySelections(
      ENABLED_VIEW_TYPES,
      selectionsModel,
    )
      .updateVisualizationControlValue(
        RESULT_VIEW_TYPES.CHART,
        'resultLimit',
        500,
      )
      .updateVisualizationControlValue(
        RESULT_VIEW_TYPES.TIME,
        'resultLimit',
        500,
      );

    this.setState({
      queryResultSpec,
      querySelections: selectionsModel,
    });

    this._topQueryResponse = data;
  }

  // TODO(stephen, ian): Build field+geo sub pages
  // eslint-disable-next-line class-methods-use-this
  buildChildPages() {
    return CONFIG.children;
  }

  changeQueryViewType(newType) {
    this.setState(
      update(this.state, {
        queryViewType: { $set: newType },
      }),
    );
  }

  render() {
    if (this.state.loading || !this._queryResultForGraph) {
      return <h1>Loading...</h1>;
    }
    const denomSuffix = t(
      `dashboard.geo_rank.denominator_labels.${CONFIG.granularity}`,
    );
    // TODO(stephen): Move class name into base dashboard
    return (
      <div className="field-dashboard">
        <BaseDashboard
          data={this.state.data}
          denomSuffix={denomSuffix}
          detailedGroups={this.state.detailedGroups}
          pageTitle={this._fieldTitle}
          pageSubtitle={CONFIG.subtitle}
          childPages={this.buildChildPages()}
          groupMaxVisible={4}
        >
          <div className="topgraph-container">
            <DashboardSection>
              <div className="graph-display">
                <QueryResult
                  queryResultSpec={this.state.queryResultSpec}
                  querySelections={this.state.querySelections}
                  viewType={this.state.queryViewType}
                  mode={QueryResult.Modes.QUERY_APP_VIEW}
                  selections={this._topQuerySelections}
                  smallMode
                />
              </div>
              <div className="graph-options-row">
                <div
                  aria-label="Map"
                  className="dashboard-icon dashboard-icon-map"
                  onClick={this.changeViewType[RESULT_VIEW_TYPES.MAP]}
                  role="button"
                />
                <div
                  aria-label="Time Series"
                  className="dashboard-icon dashboard-icon-line"
                  onClick={this.changeViewType[RESULT_VIEW_TYPES.TIME]}
                  role="button"
                />
                <div
                  aria-label="Bar graph"
                  className="dashboard-icon dashboard-icon-stacked-bars"
                  onClick={this.changeViewType[RESULT_VIEW_TYPES.CHART]}
                  role="button"
                />
                {/* eslint-disable max-len */}
                <div className="dashboard-icon dashboard-icon-sunburst disabled" />
                <div className="dashboard-icon dashboard-icon-pie disabled" />
                <div className="dashboard-icon dashboard-icon-steamgraph disabled" />
                <div className="dashboard-icon dashboard-icon-bubble-heatmap disabled" />
                <div className="dashboard-icon dashboard-icon-radial-area disabled" />
                {/* eslint-enable max-len */}
              </div>
            </DashboardSection>
          </div>
        </BaseDashboard>
      </div>
    );
  }
}

export default FieldDashboardApp;
