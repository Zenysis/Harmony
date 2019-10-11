// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import TableQueryResultState from 'components/visualizations/Table/models/aqt/TableQueryResultState';
import autobind from 'decorators/autobind';
import exportFieldMapping from 'components/QueryResult/QueryResultActionButtons/ExportButton/exportFieldMapping';
import exportToExcel from 'components/QueryResult/QueryResultActionButtons/ExportButton/exportToExcel';
import getFieldsFromQueryResultSpec from 'components/QueryResult/QueryResultActionButtons/ExportButton/getFieldsFromQueryResultSpec';
import { EXPORT_SELECTIONS } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';
import { cancelPromises } from 'util/promiseUtil';
import { uniqueId } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ExportSelection } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';

type Props = {
  label: React.Node,
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections,
  buttonClassName: string,
  className: string,
};

const TEXT = t('QueryApp.ExportButton');
const HOVER_TEXT = t('dashboard.DashboardItem.export');

export default class AQTExportDropdown extends React.PureComponent<Props> {
  _queryPromises: { [string]: Promise<any> } = {};

  componentWillUnmount() {
    cancelPromises(this._queryPromises);
  }

  @autobind
  onExportSelection(
    exportSelection: ExportSelection,
    event: SyntheticEvent<HTMLElement>,
  ): void {
    switch (exportSelection) {
      case EXPORT_SELECTIONS.EXCEL_ALL:
        return this.onExportAllExcelClick(event);
      case EXPORT_SELECTIONS.FIELD_MAPPING:
        return exportFieldMapping(event);
      default:
        throw new Error('[AQTExportDropdown] Invalid export selection');
    }
  }

  onExportAllExcelClick(event: SyntheticEvent<HTMLElement>) {
    const { querySelections, queryResultSpec } = this.props;
    event.preventDefault();

    // Run the query and store the promise so that we can
    // clean it up later if needed
    const promiseId = uniqueId();
    this._queryPromises[promiseId] = TableQueryResultState.runQuery(
      querySelections,
      queryResultSpec,
    ).then(queryResultState => {
      delete this._queryPromises[promiseId];
      const fields = getFieldsFromQueryResultSpec(queryResultSpec);
      return exportToExcel(queryResultState.queryResult(), fields);
    });
    analytics.track('Export to Excel');
  }

  render() {
    const { label } = this.props;

    return (
      <Dropdown
        buttonClassName={this.props.buttonClassName}
        className={this.props.className}
        dataContent={HOVER_TEXT}
        displayCurrentSelection={false}
        defaultDisplayContent={label}
        onSelectionChange={this.onExportSelection}
        value={undefined}
      >
        <Dropdown.Option value={EXPORT_SELECTIONS.EXCEL_ALL}>
          {TEXT.options.all}
        </Dropdown.Option>
        <Dropdown.Option value={EXPORT_SELECTIONS.FIELD_MAPPING}>
          {TEXT.options.fieldMapping}
        </Dropdown.Option>
      </Dropdown>
    );
  }
}
