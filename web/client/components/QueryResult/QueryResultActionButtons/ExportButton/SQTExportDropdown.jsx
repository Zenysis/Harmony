// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import ExportTableQueryEngine from 'models/QueryResult/QueryResultActionButtons/ExportButton/ExportTableQueryEngine';
import LegacyQuery from 'components/visualizations/common/legacy/Query';
import TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import TableQueryResultState from 'components/visualizations/Table/models/TableQueryResultState';
import autobind from 'decorators/autobind';
import exportFieldMapping from 'components/QueryResult/QueryResultActionButtons/ExportButton/exportFieldMapping';
import exportToExcel from 'components/QueryResult/QueryResultActionButtons/ExportButton/exportToExcel';
import exportToJSON from 'components/QueryResult/QueryResultActionButtons/ExportButton/exportToJSON';
import getFieldsFromQueryResultSpec from 'components/QueryResult/QueryResultActionButtons/ExportButton/getFieldsFromQueryResultSpec';
import {
  BACKEND_GRANULARITIES,
  BUCKET_TYPE,
} from 'components/QueryResult/timeSeriesUtil';
import { EXPORT_SELECTIONS } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';
import { IndicatorLookup } from 'indicator_fields';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { cancelPromises } from 'util/promiseUtil';
import { uniqueId } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { ExportSelection } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';

type Props = {
  label: React.Node,
  queryResultSpec: QueryResultSpec,
  querySelections: SimpleQuerySelections,
  buttonClassName: string,
  className: string,
};

const TEXT = t('QueryApp.ExportButton');
const HOVER_TEXT = t('dashboard.DashboardItem.export');

export default class SQTExportDropdown extends React.PureComponent<Props> {
  _queryPromises: { [string]: Promise<any> } = {};

  componentWillUnmount() {
    cancelPromises(this._queryPromises);
  }

  fetchAndExportToExcel(
    queryResultSpec: QueryResultSpec,
    querySelections: SimpleQuerySelections,
    timeGranularity: string,
    includeTimestamp?: boolean = false,
  ): void {
    this.fetchTableData(queryResultSpec, querySelections, timeGranularity)
      .then((queryResultData: TableQueryResultData) => {
        const additionalColumns = includeTimestamp ? ['timestamp'] : [];
        return exportToExcel(
          queryResultData,
          getFieldsFromQueryResultSpec(queryResultSpec),
          additionalColumns,
        );
      })
      .then(() => window.toastr.success(TEXT.successMessage));
  }

  // TODO(stephen): The Export component will need to be refactored as we move
  // to per visualization querying. In the future, export might be its own
  // type of visualization with its own endpoint powering it.
  fetchLegacyData(
    selections: Zen.Serialized<SimpleQuerySelections>,
    timeGranularities?: Array<string> | void = undefined,
  ) {
    // Run the query and store the promise so that we can
    // clean it up later if needed
    const promiseId = uniqueId();
    this._queryPromises[promiseId] = new LegacyQuery()
      .buildRequest(selections, timeGranularities)
      .run()
      .then(result => {
        delete this._queryPromises[promiseId];
        return result;
      })
      .catch(failure => console.error(failure));
    return this._queryPromises[promiseId];
  }

  // Use the table query when exporting to excel since it is in a natural
  // format for this.
  fetchTableData(
    queryResultSpec: QueryResultSpec,
    querySelections: SimpleQuerySelections,
    timeGranularity: string,
  ): Promise<TableQueryResultData> {
    // Run the query and store the promise so that we can
    // clean it up later if needed
    const promiseId = uniqueId();
    const queryEngine = new ExportTableQueryEngine(timeGranularity);

    this._queryPromises[promiseId] = TableQueryResultState.updateQueryEngine(
      queryEngine,
    )
      .runQuery(querySelections, queryResultSpec)
      .then(queryResultState => {
        delete this._queryPromises[promiseId];
        return queryResultState.queryResult();
      });
    return this._queryPromises[promiseId];
  }

  @autobind
  onExportSelection(
    exportSelection: ExportSelection,
    event: SyntheticEvent<HTMLElement>,
  ): void {
    switch (exportSelection) {
      case EXPORT_SELECTIONS.EXCEL_ALL:
        return this.onExportAllExcelClick(event);
      case EXPORT_SELECTIONS.EXCEL_WITH_CONSTITUENTS:
        return this.onExportExcelWithConstituentsClick(event);
      case EXPORT_SELECTIONS.EXCEL_TIME_SERIES:
        return this.onExportExcelTimeseriesClick(event);
      case EXPORT_SELECTIONS.FIELD_MAPPING:
        return exportFieldMapping(event);
      case EXPORT_SELECTIONS.JSON:
        return this.onExportJSONClick(event);
      default:
        throw new Error('[SQTExportDropdown] Invalid export selection');
    }
  }

  onExportAllExcelClick(event: SyntheticEvent<HTMLElement>) {
    event.preventDefault();
    this.fetchAndExportToExcel(
      this.props.queryResultSpec,
      this.props.querySelections,
      BACKEND_GRANULARITIES.ALL,
    );
    analytics.track('Export to Excel');
  }

  onExportExcelTimeseriesClick(event: SyntheticEvent<HTMLElement>) {
    event.preventDefault();
    this.fetchAndExportToExcel(
      this.props.queryResultSpec,
      this.props.querySelections,
      BACKEND_GRANULARITIES.MONTH,
      true,
    );
    analytics.track('Export time series to Excel');
  }

  onExportExcelWithConstituentsClick(event: SyntheticEvent<HTMLElement>) {
    event.preventDefault();
    const { querySelections, queryResultSpec } = this.props;

    // Build a new QueryResultSpec with the table's series settings changed to
    // show constituents. This will allow the default TableQueryResultState to
    // automatically detect that constituents should be shown.
    const newQueryResultSpec = queryResultSpec._updateVisualizationSettings(
      RESULT_VIEW_TYPES.TABLE,
      vizSettings => {
        const seriesObjects = vizSettings.seriesSettings().seriesObjects();
        const newSeriesObjects = {};

        // Change the series object settings for each series that has
        // constituents to mark it as "showConstituents".
        Object.keys(seriesObjects).forEach(fieldId => {
          const indicator = IndicatorLookup[fieldId] || {};
          const constituents =
            indicator.children || indicator.constituents || [];
          const hasConstituents = constituents.length > 0;
          newSeriesObjects[fieldId] = seriesObjects[fieldId].showConstituents(
            hasConstituents,
          );
        });

        return vizSettings.seriesSettings(
          vizSettings.seriesSettings().seriesObjects(newSeriesObjects),
        );
      },
    );

    this.fetchAndExportToExcel(
      newQueryResultSpec,
      querySelections,
      BACKEND_GRANULARITIES.ALL,
    );
    analytics.track('Export constituents to Excel');
  }

  onExportJSONClick(event: SyntheticEvent<HTMLElement>) {
    const { querySelections } = this.props;
    event.preventDefault();
    // NOTE(stephen): Currently using the GTA JSON format for this.
    this.fetchLegacyData(querySelections.legacySelections(), [
      BACKEND_GRANULARITIES.ALL,
      BACKEND_GRANULARITIES[BUCKET_TYPE.MONTH],
    ]).then(({ rawResponse }) => {
      const blob = new window.Blob(
        [JSON.stringify(rawResponse, undefined, 2)],
        { type: 'text/json;charset=utf-8;' },
      );
      exportToJSON(blob, 'json', rawResponse.fieldsToDisplay[0]);
      window.toastr.success(TEXT.successMessage);
      analytics.track('Export to JSON');
    });
  }

  render() {
    const { label } = this.props;

    return (
      <Dropdown.Uncontrolled
        initialValue={undefined}
        buttonClassName={this.props.buttonClassName}
        className={this.props.className}
        dataContent={HOVER_TEXT}
        displayCurrentSelection={false}
        defaultDisplayContent={label}
        onSelectionChange={this.onExportSelection}
      >
        <Dropdown.Option value={EXPORT_SELECTIONS.EXCEL_ALL}>
          {TEXT.options.all}
        </Dropdown.Option>
        <Dropdown.Option value={EXPORT_SELECTIONS.EXCEL_WITH_CONSTITUENTS}>
          {TEXT.options.allWithConstituents}
        </Dropdown.Option>
        <Dropdown.Option value={EXPORT_SELECTIONS.EXCEL_TIME_SERIES}>
          {TEXT.options.timeSeries}
        </Dropdown.Option>
        <Dropdown.Option value={EXPORT_SELECTIONS.FIELD_MAPPING}>
          {TEXT.options.fieldMapping}
        </Dropdown.Option>
        <Dropdown.Option value={EXPORT_SELECTIONS.JSON}>
          {TEXT.options.json}
        </Dropdown.Option>
      </Dropdown.Uncontrolled>
    );
  }
}
