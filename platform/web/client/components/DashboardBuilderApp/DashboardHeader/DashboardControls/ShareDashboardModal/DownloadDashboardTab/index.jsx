// @flow
import * as React from 'react';

import Checkbox from 'components/ui/Checkbox/index';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import ShareWithCurrentSettingsCheckbox from 'components/DashboardBuilderApp/DashboardHeader/DashboardControls/ShareDashboardModal/FormControls/ShareWithCurrentSettingsCheckbox';

type Props = {
  isShareCurrentSettings: boolean,
  JPEGSelected: boolean,
  onToggleShareCurrentSettings: boolean => void,
  PDFSelected: boolean,
  shouldDisplayExtraSettings: boolean,
  toggleJPEGSelected: () => void,
  togglePDFSelected: () => void,
};

function DownloadDashboardTab({
  JPEGSelected,
  PDFSelected,
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
      <Group.Vertical>
        <div className="download-query-tab-block__stacked-label">
          {I18N.text('Export Dashboard')}
        </div>
        <div className="download-query-tab-block__options">
          <Checkbox
            label={I18N.text('PDF')}
            labelPlacement="right"
            onChange={togglePDFSelected}
            value={PDFSelected}
          />
          <Checkbox
            label={I18N.text('JPEG')}
            labelPlacement="right"
            onChange={toggleJPEGSelected}
            value={JPEGSelected}
          />
        </div>
      </Group.Vertical>
    </div>
  );
}

export default (React.memo(
  DownloadDashboardTab,
): React.AbstractComponent<Props>);
