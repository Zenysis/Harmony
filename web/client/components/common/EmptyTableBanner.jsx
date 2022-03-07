// @flow
import * as React from 'react';

import Heading from 'components/ui/Heading';
import Icon from 'components/ui/Icon';

type Props = {
  show: boolean,
  title: string,
  subTitle: string,
};

/**
 * The EmptyTableBanner gets displayed in a data catalog/ field setup
  style tables when the table is empty
 */
export default function EmptyTableBanner({
  show,
  title,
  subTitle,
}: Props): React.Node {
  if (!show) {
    return null;
  }
  return (
    <div className="empty-table-banner" role="row">
      <Icon type="svg-no-data-results" />
      <div className="empty-table-banner__title">
        <Heading className="empty-table-banner__sub-title" size="large">
          {title}
        </Heading>
        {subTitle}
      </div>
    </div>
  );
}
