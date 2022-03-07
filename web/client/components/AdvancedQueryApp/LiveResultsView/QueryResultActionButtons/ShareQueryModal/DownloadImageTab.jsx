// @flow
import * as React from 'react';

import AnnotateButton from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/AnnotateButton';
import DownloadableImageElement from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/DownloadableImageElement';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import RadioGroup from 'components/ui/RadioGroup';
import useDownloadImageTabState from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/hooks/useDownloadImageTabState';
import useElementSize from 'lib/hooks/useElementSize';
import {
  CURRENT_SIZE,
  CUSTOM_SIZE,
  DOWNLOAD_SIZE_DIMENSIONS,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/constants';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { render2canvas } from 'components/common/SharingUtil/canvas_util';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ResultViewType } from 'components/QueryResult/viewTypes';

type Props = {
  // Callback to receive the visualization container element for rendering and
  // processing.
  getVisualizationContainerElt: () => HTMLElement,
  isDownloadImageClicked: boolean,
  onImageIsDownloaded: () => void,
  querySelections: QuerySelections,
  queryResultSpec?: QueryResultSpec,
  viewType: ResultViewType,
};

export default function DownloadImageTab({
  getVisualizationContainerElt,
  isDownloadImageClicked,
  onImageIsDownloaded,
  queryResultSpec,
  querySelections,
  viewType,
}: Props): React.Node {
  const [size, previewContainerRef] = useElementSize();
  const [
    downloadSize,
    setDownloadSize,
    customWidth,
    setCustomWidth,
    customHeight,
    setCustomHeight,
    downloadableElementElt,
    setDownloadableElementElt,
    inputWidthText,
    setInputWidthText,
    inputHeightText,
    setInputHeightText,
  ] = useDownloadImageTabState();

  const getWidth = () => {
    if (downloadSize === CUSTOM_SIZE) {
      return customWidth;
    }

    if (downloadSize === CURRENT_SIZE) {
      return getVisualizationContainerElt().offsetWidth;
    }

    return DOWNLOAD_SIZE_DIMENSIONS[downloadSize].width;
  };

  const getHeight = () => {
    if (downloadSize === CUSTOM_SIZE) {
      return customHeight;
    }

    if (downloadSize === CURRENT_SIZE) {
      return getVisualizationContainerElt().offsetHeight;
    }

    return DOWNLOAD_SIZE_DIMENSIONS[downloadSize].height;
  };

  const onDownloadElement = (elt: ?HTMLElement) => {
    if (!elt) {
      return;
    }

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
        analytics.track('Download Image', {
          sizeId: downloadSize,

          // NOTE(stephen): This debug information is useful for us to better
          // debug issues with downloading images (like blurriness) later.
          devicePixelRatio: window.devicePixelRatio,
          imageHeight: getHeight(),
          imageWidth: getWidth(),
          pixelDepth: window.screen.pixelDepth,
        });
        onImageIsDownloaded();
      });
  };

  const onInputHeightTextChange = (val: string) => {
    if (val !== '' && val !== '0') {
      setCustomHeight(Number(val));
    }
    setInputHeightText(val);
  };

  // NOTE(nina, stephen.byarugaba): We introduce this indirection where we don't always directly
  // set the value of the image's custom width. Instead, we store the inputted
  // value. This is because we need to verify that there is no empty value
  // before setting the width, BUT also need to allow the input text box
  // to display an empty value. Thus, the actual preview image's width won't
  // change until there is not an empty (or zero) value. This is to address
  // a bug where setting the height/width to zero and THEN an actual value
  // is causing parts of the map to not properly render and show whitespace
  // instead.
  const onInputWidthTextChange = (val: string) => {
    if (val !== '' && val !== '0') {
      setCustomWidth(Number(val));
    }
    setInputWidthText(val);
  };

  // TODO(stephen.byarugaba, anyone): This component should own onDownloadClick instead
  // of relying on a flag passed from ShareQueryModal.
  React.useEffect(() => {
    if (isDownloadImageClicked) {
      onDownloadElement(downloadableElementElt);
    }
  });

  // TODO(stephen.byarugaba):  make it reusable, common elements between this Image export
  // and the GIS version of Image export. use custom hook for maintaining the values,
  // and a reusable component to actually render the custom size input form
  function maybeRenderCustomSizeInputs() {
    if (downloadSize !== 'custom') {
      return undefined;
    }
    return (
      <Group.Item>
        <Group.Vertical
          spacing="s"
          className="download-image-tab__custom-image--inputs-wrapper"
          padding="m"
        >
          <LabelWrapper inline label={I18N.textById('Width (pixels):')}>
            <InputText
              value={inputWidthText}
              onChange={onInputWidthTextChange}
              type="number"
            />
          </LabelWrapper>
          <LabelWrapper inline label={I18N.textById('Height (pixels):')}>
            <InputText
              value={inputHeightText}
              onChange={onInputHeightTextChange}
              type="number"
            />
          </LabelWrapper>
        </Group.Vertical>
      </Group.Item>
    );
  }

  function maybeRenderImagePreview() {
    if (!queryResultSpec) {
      return null;
    }

    return (
      <DownloadableImageElement
        height={getHeight()}
        downloadSize={downloadSize}
        setDownloadableElementElt={setDownloadableElementElt}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        viewType={viewType}
        width={getWidth()}
        containerSize={size}
      />
    );
  }

  function renderAddAnnotation() {
    return (
      <Group.Item marginTop="m">
        <div className="download-query-tab-block">
          <div className="download-query-tab-block__label">
            {I18N.text('Annotate')}
          </div>
          <div className="download-query-tab-block__options">
            <AnnotateButton
              getVisualizationContainerElt={getVisualizationContainerElt}
            />
          </div>
        </div>
      </Group.Item>
    );
  }

  function renderImageSizeOptions() {
    return (
      <Group.Vertical flex spacing="none">
        <div className="download-query-tab-block__stacked-label">
          {I18N.text('Image size')}
        </div>
        <div className="download-query-tab-block__options">
          <RadioGroup
            value={downloadSize}
            onChange={setDownloadSize}
            direction="vertical"
          >
            <RadioGroup.Item value="current">
              {I18N.textById('Current size')}
            </RadioGroup.Item>
            <RadioGroup.Item value="widescreen">
              {I18N.text('Widescreen')}
            </RadioGroup.Item>
            <RadioGroup.Item value="fullscreen">
              {I18N.text('Fullscreen')}
            </RadioGroup.Item>
            <RadioGroup.Item value="custom">
              {I18N.textById('Custom size')}
            </RadioGroup.Item>
          </RadioGroup>
        </div>
      </Group.Vertical>
    );
  }

  return (
    <div className="download-image-tab__body">
      <div className="download-image-tab__first-col">
        {renderImageSizeOptions()}
        {maybeRenderCustomSizeInputs()}
        {renderAddAnnotation()}
      </div>
      <div ref={previewContainerRef} className="download-image-tab__second-col">
        {maybeRenderImagePreview()}
      </div>
    </div>
  );
}
