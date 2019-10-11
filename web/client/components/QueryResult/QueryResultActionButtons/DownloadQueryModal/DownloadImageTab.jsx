// @flow
import * as React from 'react';

import AnnotateButton from 'components/QueryResult/QueryResultActionButtons/AnnotateButton';
import RadioGroup, { RadioItem } from 'components/common/RadioGroup';
import { DOWNLOAD_SIZES } from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/constants';
import type { DownloadSizeID } from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/types';

const TEXT = t('query_result.common.download_as_image');
const DQMODAL_TEXT = t('query_result.common.download_query');

const DOWNLOAD_IMAGE_OPTIONS = DOWNLOAD_SIZES.map(sizeId => (
  <RadioItem key={sizeId} value={sizeId}>
    {TEXT.options[sizeId]}
  </RadioItem>
));

type Props = {
  currentSize: DownloadSizeID,

  // Callback to receive the visualization container element for rendering and
  // processing.
  getVisualizationContainerElt: () => HTMLDivElement,
  onSizeChange: DownloadSizeID => void,
};

type State = {};

export default class DownloadImageTab extends React.PureComponent<
  Props,
  State,
> {
  _ref: ?HTMLSpanElement;

  renderDownloadImage() {
    const { currentSize, onSizeChange } = this.props;
    const dimensions = (
      <div className="download-query-modal-block__contents">
        <div className="download-query-modal-block__contents--label">
          {DQMODAL_TEXT.dimensions}
        </div>
        <RadioGroup
          className="download-query-modal-block__contents--options"
          value={currentSize}
          onChange={onSizeChange}
        >
          {DOWNLOAD_IMAGE_OPTIONS}
        </RadioGroup>
      </div>
    );

    return dimensions;
  }

  renderAddAnnotation() {
    const { getVisualizationContainerElt } = this.props;
    const annotate = (
      <div className="download-query-modal-block__contents">
        <div className="download-query-modal-block__contents--label">
          {DQMODAL_TEXT.annotate}
        </div>
        <div className="download-query-modal-block__contents--options">
          <AnnotateButton
            getVisualizationContainerElt={getVisualizationContainerElt}
          />
        </div>
      </div>
    );

    return annotate;
  }

  render() {
    return (
      <div className="download-query-modal-block">
        {this.renderDownloadImage()}
        {this.renderAddAnnotation()}
      </div>
    );
  }
}
