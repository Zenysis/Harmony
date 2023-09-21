// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { exportToExcel } from 'util/export';
import type Dimension from 'models/core/wip/Dimension';
import type LocationReportingInfo from 'models/DataQualityApp/LocationReportingInfo';
import type { ExportDataRow, XLSHeader } from 'util/export';
import type { TableHeader } from 'components/ui/Table';

type Props = {
  dimensions: $ReadOnlyArray<Dimension>,
  locationReportingResults: $ReadOnlyArray<LocationReportingInfo>,
  searchText: string,
};

const VALUE_HEADERS = [
  {
    id: I18N.text('# Periods With Report'),
    sortFn: Table.Sort.number(rowData => rowData.numPeriodsWithReport()),
  },
  {
    id: I18N.text('# Periods With No Report'),
    sortFn: Table.Sort.number(rowData => rowData.numPeriodsWithNoReport()),
  },
  {
    id: I18N.text('%% of Periods With Report'),
    sortFn: Table.Sort.number(rowData => rowData.percentagePeriodsWithReport()),
  },
  {
    id: I18N.text('Days Since Last Report'),
    sortFn: Table.Sort.number(rowData => rowData.silentDays()),
  },
  {
    id: I18N.text('Last Report'),
    sortFn: Table.Sort.moment(rowData => rowData.lastReport()),
  },
];

const DATE_FORMAT = 'YYYY-MM-DD';

export default class ReportingFacilitiesTable extends React.PureComponent<Props> {
  @memoizeOne
  buildTableHeaders(
    dimensions: $ReadOnlyArray<Dimension>,
  ): $ReadOnlyArray<TableHeader<LocationReportingInfo>> {
    const dimensionHeaders = dimensions.map(dimension => ({
      id: dimension.name(),
      searchable: rowData => rowData.geographyHierarchy()[dimension.id()],
      sortFn: Table.Sort.string(
        rowData => rowData.geographyHierarchy()[dimension.id()] || '',
      ),
    }));

    return [...dimensionHeaders, ...VALUE_HEADERS];
  }

  @memoizeOne
  buildXLSHeaders(
    dimensions: $ReadOnlyArray<Dimension>,
  ): $ReadOnlyArray<XLSHeader> {
    const tableHeaders = this.buildTableHeaders(dimensions);
    return tableHeaders.map(tableHeader => ({
      key: tableHeader.id,
      label: tableHeader.id,
    }));
  }

  getXLSRow(rowData: LocationReportingInfo): ExportDataRow {
    const { dimensions } = this.props;

    const dimensionValues = dimensions.map(
      dimension => rowData.geographyHierarchy()[dimension.id()],
    );

    const dimensionCells: { [string]: string, ... } = {};

    dimensionValues.forEach((dimensionValue, index) => {
      dimensionCells[dimensions[index].name()] = dimensionValue;
    });

    return {
      ...dimensionCells,
      [I18N.textById('# Periods With Report')]: rowData.numPeriodsWithReport(),
      [I18N.textById(
        '# Periods With No Report',
      )]: rowData.numPeriodsWithNoReport(),
      [I18N.textById(
        '%% of Periods With Report',
      )]: rowData.percentagePeriodsWithReport(),
      [I18N.textById('Days Since Last Report')]: rowData.silentDays(),
      [I18N.textById('Last Report')]: rowData.lastReport().format(DATE_FORMAT),
    };
  }

  @autobind
  onDownloadData() {
    const { dimensions, locationReportingResults } = this.props;
    const rows = locationReportingResults.map(rowData =>
      this.getXLSRow(rowData),
    );
    const headers = this.buildXLSHeaders(dimensions);

    exportToExcel(I18N.text('Reporting Facilities'), headers, rows);
  }

  @autobind
  renderDownloadButton(): React.Node {
    return (
      <button
        className="zen-table-download-button"
        onClick={this.onDownloadData}
        type="button"
      >
        <Icon type="download" /> {I18N.text('Download Data')}
      </button>
    );
  }

  @autobind
  renderTableRow(
    rowData: LocationReportingInfo,
  ): React.Element<typeof Table.Row> {
    const { dimensions } = this.props;

    const dimensionValues = dimensions.map(
      dimension => rowData.geographyHierarchy()[dimension.id()],
    );

    const key = dimensionValues.join();

    return (
      <Table.Row id={key}>
        {dimensionValues.map((dimensionValue, index) => (
          <Table.Cell key={dimensions[index].id()}>{dimensionValue}</Table.Cell>
        ))}
        <Table.Cell>{rowData.numPeriodsWithReport()}</Table.Cell>
        <Table.Cell>{rowData.numPeriodsWithNoReport()}</Table.Cell>
        <Table.Cell>{rowData.percentagePeriodsWithReport()}%</Table.Cell>
        <Table.Cell>{rowData.silentDays()}</Table.Cell>
        <Table.Cell>{rowData.lastReport().format(DATE_FORMAT)}</Table.Cell>
      </Table.Row>
    );
  }

  render(): React.Node {
    const { dimensions, locationReportingResults, searchText } = this.props;

    const headers = this.buildTableHeaders(dimensions);
    return (
      <Table
        data={locationReportingResults}
        headers={headers}
        pageSize={10}
        renderActionButtons={this.renderDownloadButton}
        renderRow={this.renderTableRow}
        searchText={searchText}
      />
    );
  }
}
