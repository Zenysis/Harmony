// @flow
import * as React from 'react';

import InfoTooltip from 'components/ui/InfoTooltip';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import Tab from 'components/ui/Tabs/Tab';
import Tabs from 'components/ui/Tabs';

type Props = {
  aboutPanel: React.Node,
  generalSettingsPanel: React.Node,
  onCopyClick: () => void,
};

const TEXT = t(
  'AdvancedQueryApp.QueryFormPanel.QueryBuilder.IndicatorCustomizationModule',
);

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
          name={TEXT.settingsTabTitle}
          headerClassName="indicator-customization-module__tab-header"
        >
          {generalSettingsPanel}
        </Tab>
        <Tab
          containerType="no padding"
          name={TEXT.aboutTabTitle}
          disabled={aboutDisabled}
          headerClassName="indicator-customization-module__tab-header"
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
          text={TEXT.copyIndicator}
          tooltipPlacement="top"
        />
      </div>
    </div>
  );
}
