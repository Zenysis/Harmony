// @flow
import * as React from 'react';

import FallbackPill from 'components/DataCatalogApp/common/FallbackPill';

/**
 * The FallbackBreadcrumbPath shows a placeholder where the BreadcrumbPath will
 * eventually be shown. It occupies the same height that the normal
 * BreadcrumbPath will take up, so the user will not see any disruption when the
 * UI transitions from the fallback to the full component.
 */
export default function FallbackBreadcrumbPath(): React.Element<
  typeof FallbackPill,
> {
  return <FallbackPill containerHeight={32} height={22} width={180} />;
}
