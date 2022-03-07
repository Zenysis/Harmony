// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox/index';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import RadioGroup from 'components/ui/RadioGroup';
import StaticSelectableTextbox from 'components/common/StaticSelectableTextbox';
import TextArea from 'components/common/TextArea';
import { noop } from 'util/util';
import type QuerySelections from 'models/core/wip/QuerySelections';

type Props = {
  // Callback to receive the visualization container element for rendering and
  // processing.
  downloadExcelData: boolean,
  downloadFHIRData: boolean,
  downloadFieldMappingData: boolean,
  downloadRawCSVData: boolean,
  querySelections: QuerySelections,
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
  querySelections,
  toggleDownloadExcelData,
  toggleDownloadFHIRData,
  toggleDownloadFieldMappings,
  toggleDownloadRawCSVData,
}: Props): React.Node {

  const [selectedQueryPayload, setSelectedQueryPayload] = React.useState<string>('disaggregated');

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
    </div>
  );

  return (
    <div className="download-query-tab-block">
      <div className="download-query-tab-block__stacked-label">
        {I18N.text('Export Data')}
      </div>
      <div className="download-query-tab-block__options">{downloadChoices}</div>
    </div>
  );
}
