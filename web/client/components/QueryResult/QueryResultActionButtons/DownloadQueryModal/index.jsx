// @flow
import * as React from 'react';
import invariant from 'invariant';

import DownloadImageTab from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/DownloadImageTab';
import DownloadableQueryResult from 'components/QueryResult/QueryResultActionButtons/DownloadableQueryResult';
import RadioGroup, { RadioItem } from 'components/common/RadioGroup';
import Tab from 'components/ui/Tabs/Tab';
import TabbedModal from 'components/ui/TabbedModal';
import TableQueryResultState from 'components/visualizations/Table/models/aqt/TableQueryResultState';
import autobind from 'decorators/autobind';
import exportToExcel from 'components/QueryResult/QueryResultActionButtons/ExportButton/exportToExcel';
import getFieldsFromQueryResultSpec from 'components/QueryResult/QueryResultActionButtons/ExportButton/getFieldsFromQueryResultSpec';
import withScriptLoader from 'components/common/withScriptLoader';
import {
  CURRENT_SIZE,
  DOWNLOAD_SIZE_DIMENSIONS,
} from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/constants';
import { EXPORT_SELECTIONS } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { cancelPromises } from 'util/promiseUtil';
import { findVisualizationContainerElt } from 'components/QueryResult/QueryResultActionButtons/QueryResultCaptureUtil';
import { render2canvas } from 'components/QueryResult/QueryResultActionButtons/canvas_util';
import { uniqueId } from 'util/util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ChartSize } from 'components/ui/visualizations/types';
import type { DownloadSizeID } from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/types';
import type { ExportSelection } from 'components/QueryResult/QueryResultActionButtons/ExportButton/constants';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

const TEXT = t('query_result.common.download_query');
const DOWNLOAD_AS_IMAGE_TEXT = t('query_result.common.download_as_image');

type Props = {
  querySelections: QuerySelections,
  queryResultSpec: QueryResultSpec,
  onRequestClose: () => void,
  show: boolean,
  viewType: ResultViewType,
};

type State = {
  excelSelection: ExportSelection,
  downloadSize: DownloadSizeID,
  imageIsRendering: boolean,
  selectedTabName: string,
};

class DownloadQueryModal extends React.PureComponent<Props, State> {
  state = {
    downloadSize: CURRENT_SIZE,
    excelSelection: EXPORT_SELECTIONS.EXCEL_ALL,
    imageIsRendering: false,
    selectedTabName: 'Image',
  };

  _queryPromises: { [string]: Promise<any> } = {};
  _ref: $RefObject<'span'> = React.createRef();

  componentWillUnmount() {
    cancelPromises(this._queryPromises);
  }

  @autobind
  updateExcelSelection(excelSelection: ExportSelection) {
    this.setState({ excelSelection });
  }

  // TODO(nina): $ConsolidateButtons - this is direct from exportFieldMapping.js
  // but specifically without the event line
  @autobind
  exportFieldMapping(): void {
    analytics.track('Export field mapping');
    window.location.href = '/api/fields.csv';
    window.toastr.success(t('QueryApp.ExportButton.options').successMessage);
  }

  @autobind
  exportSelection(): void {
    switch (this.state.excelSelection) {
      case EXPORT_SELECTIONS.EXCEL_ALL:
        return this.onExportAllExcelClick();
      case EXPORT_SELECTIONS.FIELD_MAPPING:
        return this.exportFieldMapping();
      default:
        throw new Error('[AQTDownloadQueryButton] Invalid download selection');
    }
  }

  @autobind
  getVisualizationContainerElt(): HTMLDivElement {
    const vizContainerElt = findVisualizationContainerElt(this._ref);
    invariant(
      vizContainerElt !== undefined,
      'Viz container must exist if we are exporting a screenshot.',
    );
    return vizContainerElt;
  }

  getDownloadSize(): ChartSize {
    const { downloadSize } = this.state;
    if (downloadSize !== CURRENT_SIZE) {
      return DOWNLOAD_SIZE_DIMENSIONS[downloadSize];
    }

    // Calculate the current size of the QueryResult element.
    const vizContainerElt = this.getVisualizationContainerElt();
    const { height, width } = vizContainerElt.getBoundingClientRect();
    return { height, width };
  }

  @autobind
  downloadElement(elt: HTMLDivElement) {
    const visualizationContainer = elt.getElementsByClassName(
      'visualization-container',
    )[0];
    const outputFilename = `Export ${new Date().toUTCString()}.png`;

    // Load the filesaver library in parallel.
    const filesaverLoadPromise = VENDOR_SCRIPTS.filesaver.load();

    // Render the visualization to canvas *after* updating state so that the
    // experience is not jarring for the user.
    render2canvas(visualizationContainer)
      .then(canvas => {
        canvas.toBlob(blob => {
          filesaverLoadPromise.then(() => {
            window.saveAs(blob, outputFilename);
          });
        });
      })
      .finally(() => {
        this.setState(
          {
            imageIsRendering: false,
          },
          () => window.toastr.success(DOWNLOAD_AS_IMAGE_TEXT.success),
        );
      });
  }

  @autobind
  downloadImage() {
    this.setState({ imageIsRendering: true });
  }

  @autobind
  updateCurrentTab(selectedTabName: string): void {
    this.setState({ selectedTabName });
  }

  @autobind
  onSizeChange(downloadSize: DownloadSizeID) {
    this.setState({ downloadSize });
  }

  @autobind
  onChooseDownload(): void {
    if (this.state.selectedTabName === 'Data') {
      this.exportSelection();
    } else {
      this.downloadImage();
    }
  }

  @autobind
  onExportAllExcelClick() {
    const { querySelections, queryResultSpec } = this.props;
    // event.preventDefault();

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

  maybeRenderQueryResult() {
    const { imageIsRendering } = this.state;
    const { queryResultSpec, querySelections, viewType } = this.props;

    if (!imageIsRendering) {
      return null;
    }

    return (
      <DownloadableQueryResult
        onRender={this.downloadElement}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        viewType={viewType}
        {...this.getDownloadSize()}
      />
    );
  }

  renderDownloadDataTab() {
    const excelChoices = (
      <RadioGroup
        value={this.state.excelSelection}
        onChange={this.updateExcelSelection}
      >
        <RadioItem value={EXPORT_SELECTIONS.EXCEL_ALL}>
          {TEXT.options.all}
        </RadioItem>
        <RadioItem value={EXPORT_SELECTIONS.FIELD_MAPPING}>
          {TEXT.options.fieldMapping}
        </RadioItem>
      </RadioGroup>
    );

    return (
      <Tab name={TEXT.data_tab}>
        <div className="download-query-modal-block">
          <div className="download-query-modal-block__contents">
            <div className="download-query-modal-block__contents--stacked-label">
              {TEXT.downloadExcel}
            </div>
            <div className="download-query-modal-block__contents--options">
              {excelChoices}
            </div>
          </div>
        </div>
      </Tab>
    );
  }

  renderDownloadImageTab() {
    return (
      <Tab name={TEXT.image_tab}>
        <DownloadImageTab
          currentSize={this.state.downloadSize}
          getVisualizationContainerElt={this.getVisualizationContainerElt}
          onSizeChange={this.onSizeChange}
        />
        {this.maybeRenderQueryResult()}
      </Tab>
    );
  }

  render() {
    return (
      <span ref={this._ref}>
        <TabbedModal
          onRequestClose={this.props.onRequestClose}
          onTabChange={this.updateCurrentTab}
          show={this.props.show}
          showCloseButton={false}
          title={TEXT.title}
          width={450}
          primaryButtonText={TEXT.title}
          onPrimaryAction={this.onChooseDownload}
        >
          {this.renderDownloadImageTab()}
          {this.renderDownloadDataTab()}
        </TabbedModal>
      </span>
    );
  }
}

export default withScriptLoader(DownloadQueryModal, VENDOR_SCRIPTS.toastr);
