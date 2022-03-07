// @flow
import * as React from 'react';
import Promise from 'bluebird';

import DataQualityService from 'services/wip/DataQualityService';
import Field from 'models/core/wip/Field';
import GroupingDimension from 'models/core/wip/GroupingItem/GroupingDimension';
import HelperText from 'components/DataQualityApp/ReportingCompletenessTab/HelperText';
import InputText from 'components/ui/InputText';
import ProgressBar from 'components/ui/ProgressBar';
import ReportingFacilitiesTable from 'components/DataQualityApp/ReportingCompletenessTab/ReportingFacilitiesTable';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { cancelPromise } from 'util/promiseUtil';
import type Dimension from 'models/core/wip/Dimension';
import type LocationReportingInfo from 'models/DataQualityApp/LocationReportingInfo';
import type { Filters } from 'components/DataQualityApp/util';

type DefaultProps = {
  getLocationReportingTable: typeof DataQualityService.getLocationReportingTable,
};

type Props = {
  ...DefaultProps,
  dimensions: $ReadOnlyArray<Dimension>,
  field: Field,
  filters: Filters,
};

type State = {
  locationReportingResults: $ReadOnlyArray<LocationReportingInfo>,
  loadingLocationData: boolean,
  searchText: string,
};

const TEXT_PATH =
  'DataQualityApp.ReportingCompletenessTab.ReportingFacilitiesTable';
const TEXT = t(TEXT_PATH);

export default class ReportingFacilitiesTableContainer extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps: DefaultProps = {
    getLocationReportingTable: DataQualityService.getLocationReportingTable,
  };

  state: State = {
    searchText: '',
    loadingLocationData: true,
    locationReportingResults: [],
  };

  _locationReportingTablePromise: Promise<void> | void = undefined;

  componentDidMount() {
    this.fetchLocationReportingResults();
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.field !== this.props.field ||
      prevProps.filters !== this.props.filters
    ) {
      this.fetchLocationReportingResults();
    }
  }

  componentWillUnmount() {
    if (this._locationReportingTablePromise) {
      cancelPromise(this._locationReportingTablePromise);
    }
  }

  fetchLocationReportingResults() {
    const {
      dimensions,
      field,
      filters,
      getLocationReportingTable,
    } = this.props;

    this.setState({ loadingLocationData: true }, () => {
      const groupingDimensions = this.getTableGroupByDimensions(dimensions);

      if (this._locationReportingTablePromise) {
        cancelPromise(this._locationReportingTablePromise);
      }

      this._locationReportingTablePromise = getLocationReportingTable(
        field,
        groupingDimensions,
        filters,
      ).then((results: $ReadOnlyArray<LocationReportingInfo>) => {
        this.setState({
          loadingLocationData: false,
          locationReportingResults: results,
        });
      });
    });
  }

  @memoizeOne
  getTableGroupByDimensions(
    geographyDimensions: $ReadOnlyArray<Dimension>,
  ): $ReadOnlyArray<GroupingDimension> {
    return geographyDimensions.map((dimension, index) =>
      GroupingDimension.create({
        dimension: dimension.id(),
        name: dimension.name(),
        // We want to include null values for all levels except the most
        // granular. For example, with the hierarchy
        // [Province, District, Facility], a Facility (the most granular
        // level) can have a parent District that is null. In this case,
        // the facility is a "province-level facility" and it reports
        // directly to a Province. This is ok.
        includeNull: index !== geographyDimensions.length - 1,
      }),
    );
  }

  @autobind
  onSearchTextChange(searchText: string) {
    this.setState({ searchText });
  }

  maybeRenderTable(): React.Node {
    const { dimensions } = this.props;
    const {
      locationReportingResults,
      loadingLocationData,
      searchText,
    } = this.state;

    if (loadingLocationData) {
      return null;
    }

    return (
      <div className="dq-reporting-facilities-table">
        <ReportingFacilitiesTable
          dimensions={dimensions}
          locationReportingResults={locationReportingResults}
          searchText={searchText}
        />
        <InputText
          className="dq-reporting-facilities-table__search-box"
          onChange={this.onSearchTextChange}
          placeholder={TEXT.search}
          value={searchText}
          width={300}
        />
      </div>
    );
  }

  maybeRenderHelperText(): React.Node {
    const { dimensions } = this.props;

    if (!dimensions.length) {
      return null;
    }

    const text = t(`${TEXT_PATH}.helperText`, {
      largestGeoDimension: dimensions[0].name(),
      smallestGeoDimension: dimensions[dimensions.length - 1].name(),
    });

    return <HelperText text={text} />;
  }

  maybeRenderProgressBar(): React.Node {
    const { loadingLocationData } = this.state;

    if (!loadingLocationData) {
      return null;
    }

    return (
      <div className="dq-viz-container__progress-bar-wrapper">
        <ProgressBar className="dq-loading-bar" enabled={loadingLocationData} />
      </div>
    );
  }

  render(): React.Node {
    return (
      <React.Fragment>
        <div className="dq-viz-container">
          <h4 className="dq-viz-title">{TEXT.title}</h4>
          {this.maybeRenderProgressBar()}
          {this.maybeRenderTable()}
        </div>
        {this.maybeRenderHelperText()}
      </React.Fragment>
    );
  }
}
