// @flow
import * as React from 'react';

import AlertMessage, { ALERT_TYPE } from 'components/common/AlertMessage';
import SeriesRow from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/SeriesRow';
import SettingsBlock from 'components/common/visualizationSettings/SettingsPage/SettingsBlock';
import SettingsPage from 'components/common/visualizationSettings/SettingsPage';
import Table from 'components/ui/Table';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { TABLE_HEADERS } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/constants';
import type SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import type {
  SeriesRowData,
  SeriesTableHeader,
} from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/constants';
import type { SeriesRowEvents } from 'components/visualizations/common/SettingsModal/SeriesSettingsTab/SeriesRow';

export type SeriesSettingsEvents = SeriesRowEvents;

export type SeriesBlockOptions = {
  canEditOrder: boolean,
  canEditDataLabelFormat: boolean,
  canEditDataLabelFontSize: boolean,
  canEditSeriesLabel: boolean,
  canEditYAxis: boolean,
  canEditColor: boolean,
  canToggleConstituents: boolean,
  canToggleSeriesValue: boolean,
  canToggleVisibility: boolean,
};

type Props = $Merge<SeriesBlockOptions, SeriesRowEvents> & {
  settings: SeriesSettings,
};

const TEXT = t('visualizations.common.SettingsModal.SeriesSettingsTab');

export default class SeriesSettingsTab extends React.PureComponent<Props> {
  static eventNames: Array<$Keys<SeriesRowEvents>> = SeriesRow.eventNames;
  static defaultProps = {
    canEditDataLabelFormat: false,
    canEditDataLabelFontSize: false,
    canEditOrder: false,
    canEditSeriesLabel: true,
    canEditYAxis: false,
    canEditColor: false,
    canToggleConstituents: false,
    canToggleSeriesValue: false,
    canToggleVisibility: false,
  };

  // Get only the headers that this.props says should be visible
  getHeaders(): Array<SeriesTableHeader> {
    return TABLE_HEADERS.filter(header => this.props[header.propKey]);
  }

  @memoizeOne
  getSeriesTableData(
    seriesOrder: $ReadOnlyArray<string>,
  ): Array<SeriesRowData> {
    return seriesOrder.map((seriesId, idx) => ({ seriesId, idx }));
  }

  maybeRenderInstructions() {
    if (this.props.canEditOrder) {
      const { reorderBarsInstructions } = TEXT;
      return (
        <AlertMessage type={ALERT_TYPE.INFO}>
          <span className="glyphicon glyphicon-info-sign" />{' '}
          {reorderBarsInstructions}
        </AlertMessage>
      );
    }
    return null;
  }

  @autobind
  renderSeriesRow(rowData: SeriesRowData) {
    const { seriesId, idx } = rowData;
    const headerNames = this.getHeaders().map(header => header.id);
    const {
      onSeriesOrderChange,
      onSeriesSettingsLocalChange,
      onSeriesSettingsGlobalChange,
      settings,
    } = this.props;
    const { seriesOrder, seriesObjects } = settings.modelValues();
    const visibleSeries = Object.keys(seriesObjects).reduce(
      (acc, key) => (seriesObjects[key].isVisible() ? acc + 1 : acc),
      0,
    );

    // Don't let users toggle visibility if it would make everything invisible
    return (
      <Table.Row key={seriesId}>
        <SeriesRow
          index={idx}
          series={seriesObjects[seriesId]}
          headers={headerNames}
          isFirstRow={idx === 0}
          isLastRow={idx === seriesOrder.length - 1}
          allowVisibilityToggle={visibleSeries !== 1}
          onSeriesOrderChange={onSeriesOrderChange}
          onSeriesSettingsLocalChange={onSeriesSettingsLocalChange}
          onSeriesSettingsGlobalChange={onSeriesSettingsGlobalChange}
        />
      </Table.Row>
    );
  }

  // Render two different settings block treatments based on how many series
  // settings can be changed. If there is only one setting that can be changed,
  // use the setting title as the SettingsBlock title and skip rendering a
  // table. This keeps the SettingsBlock visual style consistent with other
  // tabs. If there is more than one setting to render, then render a full
  // Table that can better organize multiple setting options.
  renderSettingsBlock() {
    const seriesOrder = this.props.settings.seriesOrder();
    const headers = this.getHeaders();
    const singleSetting = headers.length === 1;
    const tableData = this.getSeriesTableData(seriesOrder);

    // TODO(pablo): this is not an ideal usecase for a Table component. Consider
    // creating a generic List UI component. Using a Table here actually adds
    // unnecessary indirection to generate the row data and render each row.
    if (!singleSetting) {
      return (
        <Table
          data={tableData}
          headers={headers}
          isHoverable={false}
          renderRow={this.renderSeriesRow}
        />
      );
    }

    return (
      <SettingsBlock
        className="series-settings-tab--single-setting"
        title={headers[0].displayContent}
      >
        <Table
          showHeaders={false}
          data={tableData}
          headers={headers}
          renderRow={this.renderSeriesRow}
          isHoverable={false}
        />
      </SettingsBlock>
    );
  }

  render() {
    return (
      <SettingsPage className="series-settings-tab">
        {this.renderSettingsBlock()}
        {this.maybeRenderInstructions()}
      </SettingsPage>
    );
  }
}
