// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';

export type ZoomSetting = number | 'fit';

type Props = {
  onZoomSettingChange: ZoomSetting => void,
  zoomSetting: ZoomSetting,
};

// TODO(nina, david): Add support for other values like PDF as well as
// enabling a user to type a number
export default function DashboardZoomLevelButton({
  onZoomSettingChange,
  zoomSetting,
}: Props): React.Node {
  return (
    <Dropdown
      buttonClassName="gd-dashboard-zoom-level-button"
      onSelectionChange={onZoomSettingChange}
      value={zoomSetting}
    >
      <Dropdown.Option value="fit">{I18N.text('Fit')}</Dropdown.Option>
      <Dropdown.Option value={0.5}>50%</Dropdown.Option>
      <Dropdown.Option value={0.75}>75%</Dropdown.Option>
      <Dropdown.Option value={0.9}>90%</Dropdown.Option>
      <Dropdown.Option value={1}>100%</Dropdown.Option>
      <Dropdown.Option value={1.25}>125%</Dropdown.Option>
      <Dropdown.Option value={1.5}>150%</Dropdown.Option>
      <Dropdown.Option value={2}>200%</Dropdown.Option>
    </Dropdown>
  );
}
