// @flow
import * as React from 'react';
import classnames from 'classnames';

type Props = {
  pageHeight: number,
  pageNumber: number,
  repositioningTiles: boolean,
};

/**
 * A label for where a page break would appear in a dashboard when downloaded as
 * a pdf.
 */
export default function PageBreakMarker({
  pageNumber,
  pageHeight,
  repositioningTiles,
}: Props): React.Node {
  const height = (pageNumber - 1) * pageHeight;

  const lineClass = classnames('gd-page-break-marker__line', {
    'gd-page-break-marker__line--full-width': repositioningTiles,
  });

  return (
    <div className="gd-page-break-marker">
      <div className={lineClass} style={{ top: height }} />
      <p className="gd-page-break-marker__label" style={{ top: height }}>
        {pageNumber}
      </p>
    </div>
  );
}
