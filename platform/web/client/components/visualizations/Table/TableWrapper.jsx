// @flow
import * as React from 'react';

import Table from 'components/visualizations/Table';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'TABLE'>;

export default function TableWrapper(
  props: Props,
): React.Element<typeof Table> {
  return <Table {...props} />;
}
