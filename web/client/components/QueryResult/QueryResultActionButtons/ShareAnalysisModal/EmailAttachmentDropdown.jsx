// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Dropdown from 'components/ui/Dropdown';
import ExportTableQueryEngine from 'models/QueryResult/QueryResultActionButtons/ExportButton/ExportTableQueryEngine';
import LabelWrapper from 'components/ui/LabelWrapper';
import LegacyQuery from 'components/visualizations/common/legacy/Query';
import SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import TableQueryResultData from 'components/visualizations/Table/models/TableQueryResultData';
import TableQueryResultState from 'components/visualizations/Table/models/TableQueryResultState';
import autobind from 'decorators/autobind';
import buildFilename from 'components/QueryResult/QueryResultActionButtons/ExportButton/buildFilename';
import getFieldsFromQueryResultSpec from 'components/QueryResult/QueryResultActionButtons/ExportButton/getFieldsFromQueryResultSpec';
import {
  BACKEND_GRANULARITIES,
  BUCKET_TYPE,
} from 'components/QueryResult/timeSeriesUtil';
import { EXPORT_SELECTIONS } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { cancelPromises } from 'util/promiseUtil';
import { exportCsvData } from 'components/QueryResult/QueryResultActionButtons/ExportButton/exportToExcel';
import { fieldIdsToName, IndicatorLookup } from 'indicator_fields';
import { uniqueId } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';

const EXPORT_TEXT = t('QueryApp.ExportButton');
const TEXT = t('query_result.common.share_analysis');

type Props = {
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections | SimpleQuerySelections,
  setAttachments: (
    exportSelection: string,
    filename: string,
    content: string,
  ) => void,
  attachmentOptions: $ReadOnlyArray<string>,
  setSelectedAttachments: (selectedValues: any) => void,
};

export default class EmailAttachmentDropdown extends React.PureComponent<Props> {
  _queryPromises: { [string]: Promise<any> } = {};

  componentWillUnmount() {
    cancelPromises(this._queryPromises);
  }

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
      // eslint-disable-next-line no-console
      .catch(failure => console.error(failure));
    return this._queryPromises[promiseId];
  }

  getSimpleQuerySelections(): SimpleQuerySelections {
    const { querySelections } = this.props;
    const simpleQuerySelections =
      querySelections instanceof SimpleQuerySelections
        ? querySelections
        : ((querySelections: any): QuerySelections).simpleQuerySelections();
    return simpleQuerySelections;
  }

  exportJsonData() {
    const legacySelections = this.getSimpleQuerySelections().legacySelections();

    this.fetchLegacyData(legacySelections, [
      BACKEND_GRANULARITIES.ALL,
      BACKEND_GRANULARITIES[BUCKET_TYPE.MONTH],
    ]).then(({ rawResponse }) => {
      const result = JSON.stringify(rawResponse, undefined, 2);
      const filename = buildFilename(
        fieldIdsToName[rawResponse.fieldsToDisplay[0]],
        'json',
      );
      const exportSelection = EXPORT_SELECTIONS.JSON;
      this.props.setAttachments(exportSelection, filename, result);
    });
  }

  fetchTableData(
    queryResultSpec: QueryResultSpec,
    timeGranularity: string,
  ): Promise<TableQueryResultData> {
    const promiseId = uniqueId();
    const queryEngine = new ExportTableQueryEngine(timeGranularity);
    const querySelections = this.getSimpleQuerySelections();

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

  fetchAndExportToCsv(
    exportSelection: string,
    queryResultSpec: QueryResultSpec,
    timeGranularity: string,
    includeTimestamp?: boolean = false,
  ): void {
    this.fetchTableData(queryResultSpec, timeGranularity).then(
      (queryResultData: TableQueryResultData) => {
        const additionalColumns = includeTimestamp ? ['timestamp'] : [];

        const resultData = exportCsvData(
          queryResultData,
          getFieldsFromQueryResultSpec(queryResultSpec),
          additionalColumns,
        );
        this.props.setAttachments(
          exportSelection,
          resultData.filename,
          resultData.content,
        );
      },
    );
  }

  exportCsvWithConstituents() {
    const { queryResultSpec } = this.props;

    const newQueryResultSpec = queryResultSpec._updateVisualizationSettings(
      RESULT_VIEW_TYPES.TABLE,
      vizSettings => {
        const seriesObjects = vizSettings.seriesSettings().seriesObjects();
        const newSeriesObjects = {};

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

    this.fetchAndExportToCsv(
      EXPORT_SELECTIONS.EXCEL_WITH_CONSTITUENTS,
      newQueryResultSpec,
      BACKEND_GRANULARITIES.ALL,
    );
  }

  getExportSelection(exportSelection: string): void {
    switch (exportSelection) {
      case EXPORT_SELECTIONS.EXCEL_ALL:
        return this.fetchAndExportToCsv(
          EXPORT_SELECTIONS.EXCEL_ALL,
          this.props.queryResultSpec,
          BACKEND_GRANULARITIES.ALL,
        );
      case EXPORT_SELECTIONS.EXCEL_TIME_SERIES:
        return this.fetchAndExportToCsv(
          EXPORT_SELECTIONS.EXCEL_TIME_SERIES,
          this.props.queryResultSpec,
          BACKEND_GRANULARITIES.MONTH,
          true,
        );
      case EXPORT_SELECTIONS.JSON:
        return this.exportJsonData();
      case EXPORT_SELECTIONS.EXCEL_WITH_CONSTITUENTS:
        return this.exportCsvWithConstituents();
      default:
        throw new Error('Invalid export selection');
    }
  }

  @autobind
  onAttachmentChange(selectedValues: $ReadOnlyArray<string>) {
    selectedValues.forEach(val => {
      this.getExportSelection(val);
    });
    this.props.setSelectedAttachments(selectedValues);
  }

  renderExportOption(value: string, text: string) {
    return (
      <Dropdown.Option key={value} value={value}>
        {text}
      </Dropdown.Option>
    );
  }

  render() {
    const optionItems = [
      this.renderExportOption(
        EXPORT_SELECTIONS.EXCEL_ALL,
        EXPORT_TEXT.options.all,
      ),
      this.renderExportOption(
        EXPORT_SELECTIONS.EXCEL_WITH_CONSTITUENTS,
        EXPORT_TEXT.options.allWithConstituents,
      ),
      this.renderExportOption(
        EXPORT_SELECTIONS.EXCEL_TIME_SERIES,
        EXPORT_TEXT.options.timeSeries,
      ),
      this.renderExportOption(EXPORT_SELECTIONS.JSON, EXPORT_TEXT.options.json),
    ];
    return (
      <LabelWrapper
        className="share-message-label"
        inline
        label={TEXT.attachDataText}
      >
        <Dropdown.Multiselect
          className="email-attachment-dropdown"
          value={this.props.attachmentOptions}
          onSelectionChange={this.onAttachmentChange}
          defaultDisplayContent={TEXT.attachDataDropdownLabel}
        >
          {optionItems}
        </Dropdown.Multiselect>
      </LabelWrapper>
    );
  }
}
