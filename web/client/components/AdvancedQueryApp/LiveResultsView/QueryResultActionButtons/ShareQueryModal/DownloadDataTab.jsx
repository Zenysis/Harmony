// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox/index';
import I18N from 'lib/I18N';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import RadioGroup from 'components/ui/RadioGroup';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';

type Props = {
  // Callback to receive the visualization container element for rendering and
  // processing.
  downloadExcelData: boolean,
  downloadFHIRData: boolean,
  downloadFieldMappingData: boolean,
  downloadRawCSVData: boolean,
  presenting?: boolean,
  queryHash: string,
  toggleDownloadExcelData: () => void,
  toggleDownloadFHIRData: () => void,
  toggleDownloadFieldMappings: () => void,
  toggleDownloadRawCSVData: () => void,
};

export default function DownloadDataTab({
  downloadExcelData,
  downloadFHIRData,
  downloadFieldMappingData,
  downloadRawCSVData,
  presenting = false,
  queryHash,
  toggleDownloadExcelData,
  toggleDownloadFHIRData,
  toggleDownloadFieldMappings,
  toggleDownloadRawCSVData,
}: Props): React.Node {
  const [
    selectedQueryPayload,
    setSelectedQueryPayload,
  ] = React.useState<string>('disaggregated');

  const exportCSVChoice = (
    <Checkbox
      label={I18N.text('All Data Raw Data (csv)')}
      labelPlacement="right"
      onChange={toggleDownloadRawCSVData}
      value={downloadRawCSVData}
    />
  );

  const getHref = () => {
    const currentHref = window.location.href.split('/');
    currentHref.pop();
    currentHref.push('api2');
    currentHref.push('query');
    currentHref.push('table');
    if (selectedQueryPayload === 'disaggregated') {
      currentHref.push('disaggregated');
    }
    return `${currentHref.join('/')}?h=${queryHash}`;
  };

  const apiChoices = (
    <div>
      <RadioGroup
        className="share-message-label"
        onChange={setSelectedQueryPayload}
        value={selectedQueryPayload}
      >
        <RadioGroup.Item value="aqt">{I18N.text('AQT Data')}</RadioGroup.Item>
        <RadioGroup.Item value="disaggregated">
          {I18N.text('Disaggregated Data')}
        </RadioGroup.Item>
      </RadioGroup>
      <div className="share-message-label share-message-label__medium">
        {I18N.text('Raw data endpoint:')}
      </div>
      {queryHash ? (
        <StaticSelectableTextbox text={getHref()} />
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );

  const downloadChoices = (
    <div>
      <Checkbox
        label={I18N.text('All Data (Excel)')}
        labelPlacement="right"
        onChange={toggleDownloadExcelData}
        value={downloadExcelData}
      />
      <Checkbox
        label={I18N.text('Field ID to data element name mapping')}
        labelPlacement="right"
        onChange={toggleDownloadFieldMappings}
        value={downloadFieldMappingData}
      />
      <Checkbox
        label={I18N.text('All Data (XML, FHIR/mADX)')}
        labelPlacement="right"
        onChange={toggleDownloadFHIRData}
        value={downloadFHIRData}
      />
      {exportCSVChoice}
    </div>
  );

  return (
    <div className="download-query-tab-block">
      <div className="download-query-tab-block__stacked-label">
        {I18N.text('Export Data')}
      </div>
      <div className="download-query-tab-block__options">{downloadChoices}</div>
      {!presenting && apiChoices}
    </div>
  );
}
