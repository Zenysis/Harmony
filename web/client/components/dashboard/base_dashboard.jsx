import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DashboardSection from 'components/dashboard/dashboard_section';
import {
  RankedCardDisplay,
  RankedListDisplay,
} from 'components/dashboard/ranked_display';
import { SORT_GRANULARITY } from 'components/geo_dashboard_app';
import PageTitle from 'components/ui/PageTitle';

const RANKED_LIST_ITEM_COUNT = 10;
class BaseDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hideMissingValues: {},
    };

    this.toggleHideMissingValues = this.toggleHideMissingValues.bind(this);
  }

  toggleHideMissingValues(title) {
    const { hideMissingValues } = this.state;
    hideMissingValues[title] =
      hideMissingValues[title] === null ? true : !hideMissingValues[title];
    this.setState({
      hideMissingValues,
    });
  }

  renderChildPages() {
    // TODO(stephen): Compute child url using a config fn (or have it passed
    // from backend).
    // Make sure we keep the selected group ids in the url, if they are set
    // and we are on the geo page.
    let baseUrl = window.location.pathname;
    const fieldIndex = baseUrl.indexOf('/field/');
    if (fieldIndex !== -1) {
      baseUrl = `${baseUrl.substring(0, fieldIndex)}/geo/Dash`;
    }
    const childBlocks = Object.keys(this.props.childPages).map((key) => {
      const links = this.props.childPages[key].map(child => (
        <div className="page-link" key={`${key}.${child}`}>
          <a href={`${baseUrl}?${key}=${child}`}>{child}</a>
        </div>
      ));

      return (
        <DashboardSection key={key} title={t(`select_filter.${key}`)}>
          <div>{links}</div>
        </DashboardSection>
      );
    });

    return <div className="dashboard-page-links">{childBlocks}</div>;
  }

  renderDetailedGroups() {
    const groups = this.props.detailedGroups.map((group) => {
      if (group.data.length) {
        const hideMissingValues =
          this.state.hideMissingValues[group.title] || false;
        return (
          <DashboardSection
            key={group.title}
            title={group.title}
            titleLink={group.url}
            hideMissingValues={hideMissingValues}
            toggleHideMissingValues={this.toggleHideMissingValues}
          >
            <div className="detailed-group">
              <RankedCardDisplay
                data={group.data}
                denomSuffix={this.props.denomSuffix}
                historicalLevel={SORT_GRANULARITY}
                maxVisible={-1}
                hideMissingValues={hideMissingValues}
              />
            </div>
          </DashboardSection>
        );
      }
      return null;
    });

    return !groups.length ? null : (
      <div className="detailed-group-results">{groups}</div>
    );
  }

  renderRankedLists() {
    const { data } = this.props;
    if (data.length < 2) {
      return null;
    }

    if (data.length < 2 * RANKED_LIST_ITEM_COUNT) {
      return (
        <DashboardSection title={t('dashboard.ranked_lists.combined_title')}>
          <RankedListDisplay
            data={data.slice()}
            historicalLevel={SORT_GRANULARITY}
            maxVisible={data.length}
          />
        </DashboardSection>
      );
    }

    return (
      <div className="ranked-list-group">
        <DashboardSection title={t('dashboard.ranked_lists.best_title')}>
          <RankedListDisplay
            data={data.slice()}
            historicalLevel={SORT_GRANULARITY}
          />
        </DashboardSection>
        <DashboardSection title={t('dashboard.ranked_lists.worst_title')}>
          <RankedListDisplay
            data={data.slice().reverse()}
            historicalLevel={SORT_GRANULARITY}
          />
        </DashboardSection>
      </div>
    );
  }

  renderTitleBlock() {
    const { pageSubtitle, pageTitle } = this.props;
    return <PageTitle title={pageTitle} subtitle={pageSubtitle} />;
  }

  render() {
    // TODO(stephen): remove "geo" class prefixes
    return (
      <div className="geo-dashboard">
        {this.renderTitleBlock()}
        {this.props.children}
        {this.renderRankedLists()}
        {this.renderDetailedGroups()}
        {this.renderChildPages()}
      </div>
    );
  }
}

BaseDashboard.propTypes = {
  data: PropTypes.array.isRequired,
  detailedGroups: PropTypes.array.isRequired,
  pageTitle: PropTypes.string.isRequired,

  childPages: PropTypes.object,
  children: PropTypes.node,
  // TODO(stephen): Kinda annoying to have to pass this all the way down
  denomSuffix: PropTypes.string,
  // eslint-disable-next-line react/no-unused-prop-types
  groupMaxVisible: PropTypes.number,
  // eslint-disable-next-line react/no-unused-prop-types
  groupSectionTitle: PropTypes.string,
  pageSubtitle: PropTypes.string,
};

BaseDashboard.defaultProps = {
  childPages: {},
  denomSuffix: '',
  groupMaxVisible: 4,
  groupSectionTitle: '',
  pageSubtitle: '',
  children: undefined,
};

export default BaseDashboard;
