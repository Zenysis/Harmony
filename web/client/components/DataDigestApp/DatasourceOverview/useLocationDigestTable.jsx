// @flow
import * as React from 'react';

import InfoTooltip from 'components/ui/InfoTooltip';
import Table from 'components/ui/Table';
import useXLSDownload from 'components/DataDigestApp/useXLSDownload';
import { locationDataToIdentifier } from 'models/DataDigestApp/LocationsDigestData';
import type LocationsDigestData, {
  LocationInfo,
} from 'models/DataDigestApp/LocationsDigestData';
import type { ExportDataRow } from 'util/export';
import type { TableHeader } from 'components/ui/Table';

function locationInfoToExportableRow(
  locationInfo: LocationInfo,
): ExportDataRow {
  const { sourceData, canonicalData } = locationInfo;
  const row = {};
  sourceData.forEach((val, dimensionName) => {
    row[`source_${dimensionName}`] = val;
  });
  canonicalData.forEach((val, dimensionName) => {
    row[`canonical_${dimensionName}`] = val;
  });
  return row;
}

const ICON_STYLE = {
  position: 'relative',
  top: 2,
};

/**
 * Given a LocationsDigestData model, get the information needed to render a table.
 *
 * Returns a tuple of: the table headers, the table data (to be passed in the
 * Table component's `data` prop), a function to render a table row (to be
 * passed in the Table component's `renderRow` function), and a function to
 * download the data as an Excel file.
 *
 * @param {LocationsDigestData | void} locationDigestData The
 * LocationsDigestData we want to render in a table
 */
export default function useLocationDigestTable(
  locationDigestData: LocationsDigestData | void,
): [
  $ReadOnlyArray<TableHeader<LocationInfo>>,
  $ReadOnlyArray<LocationInfo>,
  (row: LocationInfo) => React.Element<typeof Table.Row>,
  (filename: string, data: $ReadOnlyArray<LocationInfo>) => void,
] {
  const tableHeaders = React.useMemo(() => {
    if (locationDigestData) {
      const getSourceValue = dimension => locationData =>
        locationData.sourceData.get(dimension) || '';
      const getCanonicalValue = dimension => locationData =>
        locationData.canonicalData.get(dimension) || '';

      const sourceDataHeaders = locationDigestData
        .dimensions()
        .map(dimension => ({
          id: `source_${dimension}`,
          displayContent: (
            <>
              Source {dimension}
              <InfoTooltip
                text={`The ${dimension} as it is in the source data`}
                iconStyle={ICON_STYLE}
              />
            </>
          ),
          sortFn: Table.Sort.string(getSourceValue(dimension)),
          searchable: getSourceValue(dimension),
        }));
      const canonicalDataHeaders = locationDigestData
        .dimensions()
        .map(dimension => ({
          id: `canonical_${dimension}`,
          displayContent: (
            <>
              Canonical {dimension}
              <InfoTooltip
                text={`The ${dimension} as it shows in Zenysis`}
                iconStyle={ICON_STYLE}
              />
            </>
          ),
          sortFn: Table.Sort.string(getCanonicalValue(dimension)),
          searchable: getCanonicalValue(dimension),
        }));

      return sourceDataHeaders.concat(canonicalDataHeaders);
    }
    return [];
  }, [locationDigestData]);

  const renderTableRow = React.useCallback(locationData => {
    const { sourceData, canonicalData } = locationData;
    const sourceDataCells = [
      ...sourceData.entries(),
    ].map(([dimensionName, val]) => (
      <Table.Cell key={`source_${dimensionName}_${val}`}>{val}</Table.Cell>
    ));
    const canonicalDataCells = [
      ...canonicalData.entries(),
    ].map(([dimensionName, val]) => (
      <Table.Cell key={`canonical_${dimensionName}_${val}`}>{val}</Table.Cell>
    ));

    return (
      <Table.Row id={locationDataToIdentifier(sourceData, canonicalData)}>
        {sourceDataCells}
        {canonicalDataCells}
      </Table.Row>
    );
  }, []);

  const csvHeaders = React.useMemo(
    () => tableHeaders.map(tableHeader => tableHeader.id),
    [tableHeaders],
  );
  const downloadDataFn = useXLSDownload(
    csvHeaders,
    locationInfoToExportableRow,
  );

  return [
    tableHeaders,
    locationDigestData ? locationDigestData.locations() : [],
    renderTableRow,
    downloadDataFn,
  ];
}
