// @flow
import * as React from 'react';

import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';

type Props = {
  aboutPanel: React.Node,
  generalSettingsPanel: React.Node,
  onCopyClick: () => void,
};

const LOADING_SPINNER = <LoadingSpinner />;

// This component is a simple wrapper component for building the tab layout.
// It is useful as a separate component so that others can build an
// IndicatorCustomizationModule-style layout without needing the whole module.
export default function IndicatorCustomizationModuleLayout({
  aboutPanel,
  generalSettingsPanel,
  onCopyClick,
}: Props): React.Element<'div'> {
  // The about panel is not always available since only some fields are able
  // to have it shown.
  const aboutDisabled = !aboutPanel;
  return (
    <div className="indicator-customization-module">
      <Tabs contentsClassName="indicator-customization-module__tab-content">
        <Tab
          containerType="no padding"
          headerClassName="indicator-customization-module__tab-header"
          name={I18N.textById('Settings')}
        >
          {generalSettingsPanel}
        </Tab>
        <Tab
          containerType="no padding"
          disabled={aboutDisabled}
          headerClassName="indicator-customization-module__tab-header"
          name={I18N.text('About')}
        >
          <React.Suspense fallback={LOADING_SPINNER}>
            {aboutPanel}
          </React.Suspense>
        </Tab>
      </Tabs>
      <div
        className="indicator-customization-module__copy-button"
        onClick={onCopyClick}
        role="button"
      >
        <InfoTooltip
          iconType="svg-copy"
          text={I18N.text('Copy indicator')}
          tooltipPlacement="top"
        />
      </div>
    </div>
  );
}
