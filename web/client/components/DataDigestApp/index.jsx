// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import * as Zen from 'lib/Zen';
import DataDigestService from 'services/DataDigestService';
import DatasourceDigestTree from 'models/DataDigestApp/DatasourceDigestTree';
import DatasourceOverview from 'components/DataDigestApp/DatasourceOverview';
import Group from 'components/ui/Group';
import PipelineOverview from 'components/DataDigestApp/PipelineOverview';
import ProgressBar from 'components/ui/ProgressBar';
import Tab from 'components/ui/Tabs/Tab';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import Tabs from 'components/ui/Tabs';
import Toaster from 'components/ui/Toaster';
import { TAB_NAMES } from 'components/DataDigestApp/constants';
import { environment } from 'util/graphql';

const TAB_TITLES = {
  [TAB_NAMES.PIPELINE_OVERVIEW_TAB]: 'Pipeline Overview',
  [TAB_NAMES.DATASOURCE_OVERVIEW_TAB]: 'Datasource Overview',
};

const DEFAULT_TAB_NAME = TAB_NAMES.PIPELINE_OVERVIEW_TAB;

const VALID_TAB_NAMES = Object.values(TAB_NAMES);

type Props = {};

const GEO_FIELD_ORDERING = window.__JSON_FROM_BACKEND.geoFieldOrdering;
const DIMENSION_PARENTS = {};
GEO_FIELD_ORDERING.forEach((value, idx) => {
  DIMENSION_PARENTS[value] = GEO_FIELD_ORDERING.slice(0, idx + 1);
});

export function renderToDOM(elementId?: string = 'app'): void {
  const elt: ?HTMLElement = document.getElementById(elementId);
  invariant(elt, `Element ID does not exist: ${elementId}`);
  ReactDOM.render(<DataDigestApp />, elt);
}

function DataDigestApp(): React.Node {
  const [activeTab, setActiveTab] = React.useState<string>(DEFAULT_TAB_NAME);
  const [
    datasourceDigestTree,
    setDatasourceDigestTree,
  ] = React.useState<DatasourceDigestTree>(
    DatasourceDigestTree.create({
      datasourceDigests: Zen.Map.create(),
    }),
  );


  const [urlDatasource, setUrlDatasource] = React.useState<string>('');

  const updateActiveTab = React.useCallback(
    (tab: string): void => {
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const currentTabParam = urlParams.get('tab');

      if (tab !== activeTab || currentTabParam == null) {
        setActiveTab(tab);
        urlParams.set('tab', tab);

        // If the tab changes away from datasource, delete the datasource param
        if (tab !== TAB_NAMES.DATASOURCE_OVERVIEW_TAB) {
          urlParams.delete('datasource');
        }
        window.location.hash = urlParams;
      }
    },
    [activeTab],
  );

  React.useEffect(() => {
    // This file manages fetching all parameters from the URL as it is the component
    // that has the hashchange event listener, so it will be able to update on front
    // and back buttons
    const loadSelectedTabFromURL = () => {
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const selectedTab = urlParams.get('tab');
      const datasource = urlParams.get('datasource');

      if (selectedTab && VALID_TAB_NAMES.includes(selectedTab)) {
        updateActiveTab(selectedTab);
        if (datasource) {
          setUrlDatasource(datasource);
        }
      } else {
        if (selectedTab) {
          Toaster.warning('Invalid URL tab name. Defaulting to pipeline tab');
        }
        updateActiveTab(DEFAULT_TAB_NAME);
      }
    };

    window.addEventListener('hashchange', loadSelectedTabFromURL);
    loadSelectedTabFromURL();
    Promise.resolve(DataDigestService.getDatasourceDigestTree()).then(
      datasourceDigestTreeResult => {
        setDatasourceDigestTree(datasourceDigestTreeResult);
      },
    );
    return () =>
      window.removeEventListener('hashchange', loadSelectedTabFromURL);
  }, [updateActiveTab]);

  // NOTE: This is necessary to allow the tab name and displayed
  // be different. This allows our tab names to follow camelcase convention
  // while displaying a user friendly tab title.
  const renderTabHeader = (
    name: string,
    onClick: () => void,
    isActive: boolean,
  ): React.Element<typeof TabHeader> => {
    return (
      <TabHeader
        key={name}
        isActive={isActive}
        marginRight={50}
        name={TAB_TITLES[name]}
        onTabClick={onClick}
        testId={`${name}-tab`}
        useLightWeightHeading={false}
      />
    );
  };

  if (datasourceDigestTree.datasourceDigests().isEmpty()) {
    return <ProgressBar className="data-digest" />;
  }

  return (
    <RelayEnvironmentProvider environment={environment}>
      <Group.Vertical flex spacing="xxxs">
        <Tabs.Controlled
          className="data-digest"
          onTabChange={updateActiveTab}
          renderHeader={renderTabHeader}
          selectedTab={activeTab}
        >
          <Tab name={TAB_NAMES.PIPELINE_OVERVIEW_TAB}>
            <PipelineOverview />
          </Tab>
          <Tab lazyLoad name={TAB_NAMES.DATASOURCE_OVERVIEW_TAB}>
            <DatasourceOverview
              datasourceDigestTree={datasourceDigestTree}
              initialDatasource={urlDatasource}
            />
          </Tab>
        </Tabs.Controlled>
      </Group.Vertical>
    </RelayEnvironmentProvider>
  );
}

export default (React.memo(DataDigestApp): React.AbstractComponent<Props>);
