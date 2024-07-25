// @flow
import * as React from 'react';

import type { DownloadSizeID } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/types';

type SetDownloadSizeFn = DownloadSizeID => void;
type SetCustomSizeFn = number => void;
type SetElementEltFn = (?HTMLDivElement) => void;
type SetInputTextFn = string => void;

export default function useDownloadImageTabState(): [
  DownloadSizeID,
  SetDownloadSizeFn,
  number,
  SetCustomSizeFn,
  number,
  SetCustomSizeFn,
  ?HTMLDivElement,
  SetElementEltFn,
  string,
  SetInputTextFn,
  string,
  SetInputTextFn,
] {
  // Tag to identify which type of image we should be downloading
  const [downloadSize, setDownloadSize] = React.useState<DownloadSizeID>(
    'current',
  );

  // State variables for setting the custom width of the map image
  const [customWidth, setCustomWidth] = React.useState<number>(1280);

  // State variables for setting the custom height of the image
  const [customHeight, setCustomHeight] = React.useState<number>(720);

  const [
    downloadableElementElt,
    setDownloadableElementElt,
  ] = React.useState<?HTMLDivElement>();
  // State variables to store the value entered into the custom width text box
  const [inputWidthText, setInputWidthText] = React.useState<string>('1280');

  // State variables to store the value entered into the custom height text box
  const [inputHeightText, setInputHeightText] = React.useState<string>('720');

  return [
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
  ];
}
