// @flow
import * as React from 'react';

import InfoTooltip from 'components/ui/InfoTooltip';

/**
 * Just a thin wrapper around InfoTooltip to explain where our datasource ids
 * get their names from.
 */
export default function DatasourceNamesExplainer(): React.Node {
  return (
    <InfoTooltip
      iconStyle={{ position: 'relative', top: 2 }}
      text="These datasource names are the translated names for the pipeline datasources and should match datasource names elsewhere in the platform."
    />
  );
}
