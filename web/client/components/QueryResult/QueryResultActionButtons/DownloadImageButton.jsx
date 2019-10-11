// @flow
import * as React from 'react';
import invariant from 'invariant';

import DownloadableQueryResult from 'components/QueryResult/QueryResultActionButtons/DownloadableQueryResult';
import Dropdown from 'components/ui/Dropdown';
import Icon from 'components/ui/Icon';
import autobind from 'decorators/autobind';
import withScriptLoader from 'components/common/withScriptLoader';
import {
  CURRENT_SIZE,
  DOWNLOAD_SIZE_DIMENSIONS,
  DOWNLOAD_SIZES,
} from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/constants';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { findVisualizationContainerElt } from 'components/QueryResult/QueryResultActionButtons/QueryResultCaptureUtil';
import { render2canvas } from 'components/QueryResult/QueryResultActionButtons/canvas_util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type SimpleQuerySelections from 'models/core/SimpleQuerySelections';
import type { ChartSize } from 'components/ui/visualizations/types';
import type { DownloadSizeID } from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  queryResultSpec: QueryResultSpec,
  querySelections: QuerySelections | SimpleQuerySelections,
  viewType: ResultViewType,
  buttonClassName: string,
  className: string,
  labelClassName: string,
  showLabel: boolean,
};

type State = {
  downloadSize: ChartSize,
  imageIsRendering: boolean,
};

const TEXT = t('query_result.common.download_as_image');

const BUTTON_DISPLAY_CONTENT_WITH_LABEL = (
  <span>
    <Icon type="save-file" />
    <span className="action-button-text">{TEXT.title}</span>
  </span>
);

const BUTTON_DISPLAY_CONTENT = (
  <span>
    <Icon type="save-file" />
  </span>
);

const BUTTON_OPTIONS = DOWNLOAD_SIZES.map(key => (
  <Dropdown.Option key={key} value={key}>
    {TEXT.options[key]}
  </Dropdown.Option>
));

class DownloadImageButton extends React.PureComponent<Props, State> {
  static defaultProps = {
    buttonClassName:
      'action-button dashboard-item-button download-image-button__dropdown-button',
    className: 'download-image-button__dropdown',
    labelClassName: 'action-button-text',
  };

  state: State = {
    downloadSize: DOWNLOAD_SIZE_DIMENSIONS.fullscreen,
    imageIsRendering: false,
  };

  _ref: $RefObject<'span'> = React.createRef();

  getDownloadSize(sizeId: DownloadSizeID) {
    if (sizeId !== CURRENT_SIZE) {
      return DOWNLOAD_SIZE_DIMENSIONS[sizeId];
    }

    // Calculate the current size of the QueryResult element.
    const vizContainerElt = findVisualizationContainerElt(this._ref);
    invariant(
      vizContainerElt !== undefined,
      'Visualization container must exist.',
    );
    const { height, width } = vizContainerElt.getBoundingClientRect();
    return { height, width };
  }

  @autobind
  startDownload(sizeId: DownloadSizeID) {
    this.setState({
      downloadSize: this.getDownloadSize(sizeId),
      imageIsRendering: true,
    });
    analytics.track('Download Image', {
      sizeId,
    });
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
          () => window.toastr.success(TEXT.success),
        );
      });
  }

  maybeRenderQueryResult() {
    const { downloadSize, imageIsRendering } = this.state;
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
        {...downloadSize}
      />
    );
  }

  renderDropdown() {
    const loadingClass = this.state.imageIsRendering ? 'button-loading' : '';
    const content = this.props.showLabel
      ? BUTTON_DISPLAY_CONTENT_WITH_LABEL
      : BUTTON_DISPLAY_CONTENT;

    return (
      <Dropdown
        buttonClassName={this.props.buttonClassName}
        className={`${this.props.className} ${loadingClass}`}
        value={undefined}
        defaultDisplayContent={content}
        onSelectionChange={this.startDownload}
        menuWidth={175}
        dataContent={t('dashboard.DashboardItem.download')}
      >
        {BUTTON_OPTIONS}
      </Dropdown>
    );
  }

  render() {
    return (
      <span ref={this._ref} className="download-image-button">
        {this.renderDropdown()}
        {this.maybeRenderQueryResult()}
      </span>
    );
  }
}

export default withScriptLoader(DownloadImageButton, VENDOR_SCRIPTS.toastr);
