// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox/index';
import ShareWithCurrentSettingsCheckbox from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/ShareWithCurrentSettingsCheckbox';

const TEXT = t(
  'query_result.common.share_analysis.dashboardShare.downloadDashboard',
);

type Props = {
  PDFSelected: boolean,
  JPEGSelected: boolean,
  isShareCurrentSettings: boolean,
  onToggleShareCurrentSettings: boolean => void,
  shouldDisplayExtraSettings: boolean,
  toggleJPEGSelected: () => void,
  togglePDFSelected: () => void,
};

function DownloadDashboardTab({
  PDFSelected,
  JPEGSelected,
  isShareCurrentSettings,
  onToggleShareCurrentSettings,
  shouldDisplayExtraSettings,
  toggleJPEGSelected,
  togglePDFSelected,
}: Props) {
  return (
    <div className="download-query-tab-block">
      {shouldDisplayExtraSettings ? (
        <div className="download-query-tab-block__filter-checkbox">
          <ShareWithCurrentSettingsCheckbox
            isShareCurrentSettings={isShareCurrentSettings}
            onToggleShareCurrentSettings={onToggleShareCurrentSettings}
          />
        </div>
      ) : null}
      <div className="download-query-tab-block__stacked-label">
        {TEXT.title}
      </div>
      <div className="download-query-tab-block__options">
        <Checkbox
          value={PDFSelected}
          onChange={togglePDFSelected}
          label={TEXT.options.pdf}
          labelPlacement="right"
        />
        <Checkbox
          value={JPEGSelected}
          onChange={toggleJPEGSelected}
          label={TEXT.options.jpeg}
          labelPlacement="right"
        />
      </div>
    </div>
  );
}

export default (React.memo(
  DownloadDashboardTab,
): React.AbstractComponent<Props>);
