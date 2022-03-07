// @flow
import * as React from 'react';

import ImageDownloadableQueryResult from 'components/common/SharingUtil/ImageDownloadableQueryResult';
import getScaledStyle from 'components/common/SharingUtil/getScaledStyle';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type {
  DownloadSizeID,
  Size,
} from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/types';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { StyleObject } from 'types/jsCore';

type Props = {
  containerSize: Size,
  downloadSize: DownloadSizeID,
  // Callback to receive the visualization container element for rendering and
  // processing.
  height: number,
  setDownloadableElementElt: HTMLDivElement => void,
  querySelections: QuerySelections,
  queryResultSpec: QueryResultSpec,
  viewType: ResultViewType,
  width: number,
};

export default function DownloadableImageElement({
  containerSize,
  downloadSize,
  height,
  setDownloadableElementElt,
  queryResultSpec,
  querySelections,
  viewType,
  width,
}: Props): React.Node {
  const mainDivElt: $ElementRefObject<'div'> = React.useRef(null);

  // Contains the scale factor and other transformations to apply to our
  // preview image
  const [scaledStyle, setScaledStyle] = React.useState<StyleObject | void>(
    undefined,
  );

  React.useEffect(() => {
    const { current } = mainDivElt;
    if (!current) {
      return;
    }

    const calculatedScaledStyle = getScaledStyle(height, width, containerSize);
    setScaledStyle(calculatedScaledStyle);
  }, [mainDivElt, containerSize, height, width]);

  return (
    <React.Fragment>
      {/* 
      HACK(stephen.byarugaba): Hidden element that updates DownloadableElement Elt via onRender
      The Element rendered under scaled div bellow makes distorted images due to parent divs' scaling.
       */}
      <ImageDownloadableQueryResult
        height={height}
        key={downloadSize}
        isOffScreen
        onRender={setDownloadableElementElt}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        viewType={viewType}
        width={width}
      />

      <div
        ref={mainDivElt}
        style={{
          height,
          width,
          ...scaledStyle,
        }}
      >
        <ImageDownloadableQueryResult
          height={height}
          key={downloadSize}
          onRender={() => undefined}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          viewType={viewType}
          width={width}
        />
      </div>
    </React.Fragment>
  );
}
