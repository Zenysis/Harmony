// @flow
import type { ChartSize } from 'components/ui/visualizations/types';
import type { DownloadSizeID } from 'components/QueryResult/QueryResultActionButtons/DownloadQueryModal/types';

export const CURRENT_SIZE = 'current';
export const DOWNLOAD_SIZE_DIMENSIONS: { [DownloadSizeID]: ChartSize } = {
  // Image aspect ratio 4:3
  fullscreen: {
    height: 1440,
    width: 1920,
  },

  // Image aspect ratio 16:9
  widescreen: {
    height: 1080,
    width: 1920,
  },
};

export const DOWNLOAD_SIZES = ['fullscreen', 'widescreen', 'current'];
