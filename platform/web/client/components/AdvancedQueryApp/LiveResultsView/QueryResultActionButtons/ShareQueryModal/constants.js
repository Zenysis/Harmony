// @flow
import type { ChartSize } from 'components/ui/visualizations/types';
import type { DownloadSizeID } from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryModal/types';

export const FULLSCREEN = 'fullscreen';
export const WIDESCREEN = 'widescreen';
export const CURRENT_SIZE = 'current';
export const CUSTOM_SIZE = 'custom';

export const DOWNLOAD_SIZE_DIMENSIONS: { [DownloadSizeID]: ChartSize, ... } = {
  // Image aspect ratio 4:3
  [FULLSCREEN]: {
    height: 1440,
    width: 1920,
  },

  // Image aspect ratio 16:9
  [WIDESCREEN]: {
    height: 1080,
    width: 1920,
  },
};

export const DOWNLOAD_SIZES: $ReadOnlyArray<DownloadSizeID> = [
  FULLSCREEN,
  WIDESCREEN,
  CURRENT_SIZE,
  CUSTOM_SIZE,
];
