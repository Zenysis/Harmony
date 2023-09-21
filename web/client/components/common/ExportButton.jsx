// @flow
import * as React from 'react';

import Button from 'components/ui/Button';
import I18N from 'lib/I18N';
import Toaster from 'components/ui/Toaster';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { render2canvas } from 'components/common/SharingUtil/canvas_util';

type Props = {
  className?: string,
  /** Reference to use when we are capturing a particular part of the page */
  parentElt: ?HTMLElement,
  size?: 'large' | 'medium' | 'small',
};

/**
 * The ExportButton component exists for users to download an image of a single
 * query result on the page in the exact size it is currently rendered.
 */
export default function ExportButton({
  className = '',
  parentElt,
  size = 'medium',
}: Props): React.Node {
  // TODO: This is duplicate code of the DownloadImageButton (just
  // without the state call and no parameters)
  const onClick = React.useCallback(() => {
    if (!parentElt) {
      return;
    }

    const visualizationContainer = parentElt.getElementsByClassName(
      'visualization-container',
    )[0];
    const outputFilename = `Export ${new Date().toUTCString()}.png`;

    // Load the filesaver library in parallel.
    const filesaverLoadPromise = VENDOR_SCRIPTS.filesaver.load();

    render2canvas(visualizationContainer)
      .then(canvas => {
        canvas.toBlob(blob => {
          filesaverLoadPromise.then(() => {
            window.saveAs(blob, outputFilename);
          });
        });
      })
      .finally(() =>
        Toaster.success(
          I18N.text(
            'Image download is complete. Check your Downloads folder.',
            'imageDownloadSuccess',
          ),
        ),
      );
  }, [parentElt]);

  return (
    <Button
      className={`${className} hide-in-screenshot`}
      onClick={onClick}
      size={size}
    >
      <I18N>Export</I18N>
    </Button>
  );
}
