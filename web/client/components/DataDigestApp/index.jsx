// @flow
import * as React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import { RelayEnvironmentProvider } from 'react-relay/hooks';

import * as Zen from 'lib/Zen';
import Button from 'components/ui/Button';
import CsvHeaderValidator, {
  dateIsValidFormat,
} from 'components/DataDigestApp/CsvHeaderValidator';
import DataDigestService from 'services/DataDigestService';
import DatasourceDigestTree from 'models/DataDigestApp/DatasourceDigestTree';
import DatasourceOverview from 'components/DataDigestApp/DatasourceOverview';
import Dropdown from 'components/ui/Dropdown';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import LabelWrapper from 'components/ui/LabelWrapper';
import MappingFilesTable from 'components/DataDigestApp/MappingFilesTable';
import PipelineOverview from 'components/DataDigestApp/PipelineOverview';
import ProgressBar from 'components/ui/ProgressBar';
import Spacing from 'components/ui/Spacing';
import Tab from 'components/ui/Tabs/Tab';
import TabHeader from 'components/ui/Tabs/internal/TabHeader';
import Tabs from 'components/ui/Tabs';
import Toaster from 'components/ui/Toaster';
import autobind from 'decorators/autobind';
import { TAB_NAMES } from 'components/DataDigestApp/constants';
import { environment } from 'util/graphql';
import { exportToExcel } from 'util/export';

const TAB_TITLES = {
  [TAB_NAMES.PIPELINE_OVERVIEW_TAB]: 'Pipeline Overview',
  [TAB_NAMES.DATASOURCE_OVERVIEW_TAB]: 'Datasource Overview',
  [TAB_NAMES.MAPPING_FILES_TAB]: 'Mapping Files',
  [TAB_NAMES.CSV_VALIDATION_TAB]: 'CSV Validation',
};

const DEFAULT_TAB_NAME = TAB_NAMES.PIPELINE_OVERVIEW_TAB;

const VALID_TAB_NAMES = Object.values(TAB_NAMES);

type Props = {};

type State = {
  activeTab: string,
  canonicalMappings: Zen.Map<string>,
  datasourceDigestTree: DatasourceDigestTree,
  mappingDigestData: $ReadOnlyArray<$ReadOnlyArray<string>>,
  selectedMappingFile: string,
  selectedValidationMapping: string,
  urlDatasource: string,
};

function getDropdownOptions(
  options: $ReadOnlyArray<string>,
): $ReadOnlyArray<React.Element<typeof Dropdown.Option>> {
  return options.map(option => (
    <Dropdown.Option key={option} value={option}>
      {option}
    </Dropdown.Option>
  ));
}

const GEO_FIELD_ORDERING = window.__JSON_FROM_BACKEND.geoFieldOrdering;
const DIMENSION_PARENTS = {};
GEO_FIELD_ORDERING.forEach((value, idx) => {
  DIMENSION_PARENTS[value] = GEO_FIELD_ORDERING.slice(0, idx + 1);
});

export default class DataDigestApp extends React.PureComponent<Props, State> {
  state: State = {
    activeTab: DEFAULT_TAB_NAME,
    canonicalMappings: Zen.Map.create(),
    datasourceDigestTree: DatasourceDigestTree.create({
      datasourceDigests: Zen.Map.create(),
    }),
    mappingDigestData: [],
    selectedMappingFile: '',
    selectedValidationMapping:
      GEO_FIELD_ORDERING[GEO_FIELD_ORDERING.length - 1],
    urlDatasource: '',
  };

  static renderToDOM(elementId: string = 'app'): void {
    const elt: ?HTMLElement = document.getElementById(elementId);
    invariant(elt, `Element ID does not exist: ${elementId}`);
    ReactDOM.render(<DataDigestApp />, elt);
  }

  componentDidMount(): void {
    window.addEventListener('hashchange', this.loadSelectedTabFromURL);
    this.loadSelectedTabFromURL();
    Promise.all([
      DataDigestService.getDatasourceDigestTree(),
      DataDigestService.getCanonicalMappings(),
    ]).then(([datasourceDigestTree, canonicalMappings]) => {
      const selectedMappingFile = canonicalMappings.keys()[0];
      this.setState(
        {
          canonicalMappings,
          datasourceDigestTree,
          selectedMappingFile,
        },
        this.updateMappingDigestFile,
      );
    });
  }

  componentWillUnmount(): void {
    window.removeEventListener('hashchange', this.loadSelectedTabFromURL);
  }

  @autobind
  updateMappingDigestFile(): void {
    const { canonicalMappings, selectedMappingFile } = this.state;
    if (selectedMappingFile) {
      const fileKey = canonicalMappings.forceGet(selectedMappingFile);

      DataDigestService.getDataDigestFile(fileKey).then(mappingDigestData =>
        this.setState({ mappingDigestData }),
      );
    }
  }

  @autobind
  updateActiveTab(activeTab: string) {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const currentTabParam = urlParams.get('tab');

    if (activeTab !== this.state.activeTab || currentTabParam == null) {
      this.setState({ activeTab });
      urlParams.set('tab', activeTab);

      // If the tab changes away from datasource, delete the datasource param
      if (activeTab !== TAB_NAMES.DATASOURCE_OVERVIEW_TAB) {
        urlParams.delete('datasource');
      }
      window.location.hash = urlParams;
    }
  }

  // This file manages fetching all parameters from the URL as it is the component
  // that has the hashchange event listener, so it will be able to update on front
  // and back buttons
  @autobind
  loadSelectedTabFromURL() {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const selectedTab = urlParams.get('tab');
    const urlDatasource = urlParams.get('datasource');

    if (selectedTab && VALID_TAB_NAMES.includes(selectedTab)) {
      this.updateActiveTab(selectedTab);
      if (urlDatasource) {
        this.setState({ urlDatasource });
      }
    } else {
      if (selectedTab) {
        Toaster.warning('Invalid URL tab name. Defaulting to pipeline tab');
      }
      this.updateActiveTab(DEFAULT_TAB_NAME);
    }
  }

  @autobind
  onChangeMappingFile(selectedMappingFile: string): void {
    this.setState({ selectedMappingFile }, this.updateMappingDigestFile);
  }

  @autobind
  onChangeSelectedValidationMapping(selectedValidationMapping: string): void {
    this.setState({ selectedValidationMapping });
  }

  @autobind
  onDownloadClicked(
    digestFileData: $ReadOnlyArray<$ReadOnlyArray<string>>,
    digestFileName: string,
  ): void {
    const [header, ...digestData] = digestFileData;
    const outputHeader = header.map(field => ({
      key: field,
      label: field,
    }));
    const outputData = digestData.map(row => {
      const csvRow = {};
      row.forEach((cell, index) => {
        csvRow[header[index]] = cell;
      });
      return csvRow;
    });
    exportToExcel(digestFileName, outputHeader, outputData);
  }

  // NOTE(camden): This is necessary to allow the tab name and displayed
  // be different. This allows our tab names to follow camelcase convention
  // while displaying a user friendly tab title.
  renderTabHeader(
    name: string,
    onClick: () => void,
    isActive: boolean,
  ): React.Element<typeof TabHeader> {
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
  }

  renderCanonicalMappingsDropdown(): React.Node {
    const { canonicalMappings, selectedMappingFile } = this.state;
    return (
      <LabelWrapper boldLabel label="Metadata file">
        <Dropdown
          ariaName="select metadata file"
          defaultDisplayContent="Metadata file"
          onSelectionChange={this.onChangeMappingFile}
          value={selectedMappingFile}
        >
          {getDropdownOptions(canonicalMappings.keys())}
        </Dropdown>
      </LabelWrapper>
    );
  }

  renderDownloadButton(
    digestFileData: $ReadOnlyArray<$ReadOnlyArray<string>>,
    digestFileName: string,
  ): React.Node {
    return (
      <LabelWrapper boldLabel label="Download">
        <Icon
          ariaName="download metadata file"
          onClick={() => this.onDownloadClicked(digestFileData, digestFileName)}
          type="download-alt"
        />
      </LabelWrapper>
    );
  }

  renderCSVMatchingValidation(): React.Node {
    const { selectedValidationMapping } = this.state;
    const mappingBaseName = selectedValidationMapping.replace('Name', '');
    const requiredCoordinateFields = [
      `${mappingBaseName}Lat`,
      `${mappingBaseName}Lon`,
    ];
    const requiredHierarchyFields =
      DIMENSION_PARENTS[selectedValidationMapping];
    return (
      <div>
        <Group.Horizontal>
          <h5>Click or Drag</h5>
          <Dropdown
            onSelectionChange={this.onChangeSelectedValidationMapping}
            value={selectedValidationMapping}
          >
            {getDropdownOptions(GEO_FIELD_ORDERING)}
          </Dropdown>
          <h5>Matches for validation</h5>
        </Group.Horizontal>
        <CsvHeaderValidator
          extraColumnsHeading="Matches"
          mandatoryColumns={[
            ...requiredHierarchyFields,
            ...requiredCoordinateFields,
          ]}
        />
      </div>
    );
  }

  renderDataValidationTab(): React.Node {
    // Note(moriah): make it so that the user can select the level that
    // mfr will be used for. This means that FacilityLat and FacilityLon
    // will not be used in some cases.
    return (
      <Group.Horizontal flex itemStyle={{ flex: 1 }} spacing="m">
        <div>
          <h5>Click or Drag Dataprep output for validation</h5>
          <CsvHeaderValidator
            columnRules={{ date: dateIsValidFormat }}
            extraColumnsHeading="Dimensions"
            mandatoryColumns={['field', 'val', 'date']}
          />
        </div>
        {this.renderCSVMatchingValidation()}
      </Group.Horizontal>
    );
  }

  render(): React.Node {
    if (this.state.datasourceDigestTree.datasourceDigests().isEmpty()) {
      return <ProgressBar className="data-digest" />;
    }

    const {
      datasourceDigestTree,
      mappingDigestData,
      selectedMappingFile,
    } = this.state;

    return (
      <RelayEnvironmentProvider environment={environment}>
        <Group.Vertical flex spacing="xxxs">
          <Tabs.Controlled
            className="data-digest"
            onTabChange={this.updateActiveTab}
            renderHeader={this.renderTabHeader}
            selectedTab={this.state.activeTab}
          >
            <Tab name={TAB_NAMES.PIPELINE_OVERVIEW_TAB}>
              <PipelineOverview />
            </Tab>
            <Tab lazyLoad name={TAB_NAMES.DATASOURCE_OVERVIEW_TAB}>
              <DatasourceOverview
                datasourceDigestTree={datasourceDigestTree}
                initialDatasource={this.state.urlDatasource}
              />
            </Tab>
            <Tab
              disabled={mappingDigestData.length === 0}
              name={TAB_NAMES.MAPPING_FILES_TAB}
            >
              <Group.Vertical spacing="m">
                <Group.Horizontal flex>
                  {this.renderCanonicalMappingsDropdown()}
                  {this.renderDownloadButton(
                    mappingDigestData,
                    selectedMappingFile,
                  )}
                </Group.Horizontal>
                <Group.Horizontal flex>
                  <MappingFilesTable digestFile={mappingDigestData} />
                </Group.Horizontal>
              </Group.Vertical>
            </Tab>
            <Tab name={TAB_NAMES.CSV_VALIDATION_TAB}>
              {this.renderDataValidationTab()}
            </Tab>
          </Tabs.Controlled>
        </Group.Vertical>
      </RelayEnvironmentProvider>
    );
  }
}
