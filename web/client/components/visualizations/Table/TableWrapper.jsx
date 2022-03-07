// @flow
import * as React from 'react';

import RiskScoreTable from 'components/visualizations/Table/RiskScore/RiskScoreTable';
import Table from 'components/visualizations/Table';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'TABLE'>;

export default function TableWrapper(
  props: Props,
): React.Element<typeof Table> | React.Element<typeof RiskScoreTable> {
  return <Table {...props} />;
}
