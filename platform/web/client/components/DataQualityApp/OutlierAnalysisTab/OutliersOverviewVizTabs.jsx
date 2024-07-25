// @flow
import * as React from 'react';

import Dimension from 'models/core/wip/Dimension';
import Field from 'models/core/wip/Field';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import OutliersBoxPlot from 'components/DataQualityApp/OutlierAnalysisTab/OutliersBoxPlot';
import OutliersTable from 'components/DataQualityApp/OutlierAnalysisTab/OutliersTable';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';
import {
  OUTLIER_ANALYSIS_URL_PARAMS,
  updateURLParameter,
} from 'components/DataQualityApp/util';
import { OVERVIEW_VIZ_NAMES } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import { getQueryParam } from 'util/util';
import type { BoxPlotDataPoint } from 'components/ui/visualizations/BoxPlot/types';
import type { DataRow } from 'models/visualizations/Table/types';
import type { Filters } from 'components/DataQualityApp/util';
import type {
  OutlierType,
  OverviewViz,
} from 'components/DataQualityApp/OutlierAnalysisTab/util';

type Props = {
  field: Field,
  filters: Filters,
  geographyDimensions: $ReadOnlyArray<Dimension>,
  geographyGroupBy: Dimension,
  lowestGranularityGeographyDimension: Dimension,
  onBoxPlotDataPointClick: BoxPlotDataPoint => void,
  onTableRowClick: DataRow => void,
  outlierType: OutlierType,
};

const TAB_TITLES = {
  [OVERVIEW_VIZ_NAMES.BOX_PLOT]: I18N.text('Box Plot'),
  [OVERVIEW_VIZ_NAMES.TABLE]: I18N.text('Table'),
};

const TAB_ICONS = {
  [OVERVIEW_VIZ_NAMES.BOX_PLOT]: 'svg-box-plot-visualization',
  [OVERVIEW_VIZ_NAMES.TABLE]: 'svg-table-visualization',
};

function OutliersOverviewVizTabs({
  field,
  filters,
  geographyDimensions,
  geographyGroupBy,
  lowestGranularityGeographyDimension,
  onBoxPlotDataPointClick,
  onTableRowClick,
  outlierType,
}: Props) {
  const [selectedViz, setSelectedViz] = React.useState<OverviewViz>(
    OVERVIEW_VIZ_NAMES.BOX_PLOT,
  );

  const updateSelectedVizFromURL = React.useCallback(() => {
    const selectedVizParam = getQueryParam(
      OUTLIER_ANALYSIS_URL_PARAMS.OVERVIEW_VIZ,
    );

    if (selectedVizParam === selectedViz) {
      return;
    }

    if (Object.values(OVERVIEW_VIZ_NAMES).includes(selectedVizParam)) {
      setSelectedViz(((selectedVizParam: $Cast): OverviewViz));
    } else {
      setSelectedViz(OVERVIEW_VIZ_NAMES.BOX_PLOT);
    }
  }, [selectedViz, setSelectedViz]);

  // Pull the selected viz from the url when the component first loads
  React.useEffect(() => {
    updateSelectedVizFromURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update the selected viz if the user uses the back and forward browser
  // buttons
  React.useEffect(() => {
    window.addEventListener('popstate', updateSelectedVizFromURL);

    return () =>
      window.removeEventListener('popstate', updateSelectedVizFromURL);
  }, [updateSelectedVizFromURL]);

  const onVizSelected = React.useCallback(
    newSelectedViz => {
      updateURLParameter(
        OUTLIER_ANALYSIS_URL_PARAMS.OVERVIEW_VIZ,
        newSelectedViz,
      );
      setSelectedViz(newSelectedViz);
    },
    [setSelectedViz],
  );

  const renderHeader = (name: string, onClick: () => void) => {
    const icon = (
      <Icon
        className="dq-outliers-overview-viz-tabs__tab-header-icon"
        type={TAB_ICONS[name]}
      />
    );

    return (
      <div
        key={TAB_TITLES[name]}
        className="dq-outliers-overview-viz-tabs__tab-header"
        onClick={onClick}
        role="button"
      >
        <Group.Horizontal flex>
          <Group.Item alignItems="center" flex>
            {icon}
          </Group.Item>
          {TAB_TITLES[name]}
        </Group.Horizontal>
      </div>
    );
  };

  return (
    <div className="dq-viz-container dq-outliers-overview-viz-tabs">
      <Tabs.Controlled
        contentsClassName="dq-outliers-overview-viz-tabs__contents"
        headerRowClassName="dq-outliers-overview-viz-tabs__header-row"
        onTabChange={onVizSelected}
        renderHeader={renderHeader}
        selectedTab={selectedViz}
      >
        <Tab name={OVERVIEW_VIZ_NAMES.BOX_PLOT}>
          <OutliersBoxPlot
            field={field}
            filters={filters}
            geographyGroupBy={geographyGroupBy}
            lowestGranularityGeographyDimension={
              lowestGranularityGeographyDimension
            }
            onDataPointClick={onBoxPlotDataPointClick}
            outlierType={outlierType}
          />
        </Tab>
        <Tab name={OVERVIEW_VIZ_NAMES.TABLE}>
          <OutliersTable
            field={field}
            filters={filters}
            geographyGroupBys={geographyDimensions}
            onRowClick={onTableRowClick}
            outlierType={outlierType}
          />
        </Tab>
      </Tabs.Controlled>
    </div>
  );
}

export default (React.memo(
  OutliersOverviewVizTabs,
): React.AbstractComponent<Props>);
