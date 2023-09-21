// @flow
import * as React from 'react';

import ControlBarButtonTooltip from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ControlBar/ControlBarButtonTooltip';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import VisualizationTypePickerButton from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ControlBar/VisualizationTypePickerButton';
import {
  CONTROL_BAR_VISUALIZATION_ORDER,
  VISUALIZATION_INFO,
} from 'models/AdvancedQueryApp/VisualizationType/registry';

type Props = {
  exploreViewIsOpen: boolean,
  onCloseExploreView: () => void,
  onOpenExploreView: () => void,
};

const SHOW_ME_ICON = (
  <div className="visualization-picker-control-bar__show-me-icon">
    <svg viewBox="0 0 22.32 16">
      <rect fill="#3597e4" height="2.53" width="22.32" />
      <rect fill="#ff9362" height="2.53" width="18.53" y="3.37" />
      <rect fill="#f4b2d0" height="2.53" width="9.26" y="7.16" />
      <rect fill="#ffcb4a" height="2.53" width="11.79" y="10.11" />
      <rect fill="#883aa2" height="2.53" width="16" y="13.47" />
    </svg>
  </div>
);

export default function ControlBar({
  exploreViewIsOpen,
  onCloseExploreView,
  onOpenExploreView,
}: Props): React.Element<'div'> {
  const { displayedVisualizationType } = React.useContext(
    VisualizationPickerContext,
  );

  function maybeRenderVisualizationButtons() {
    if (exploreViewIsOpen) {
      return null;
    }

    const buttons = CONTROL_BAR_VISUALIZATION_ORDER.map(visualizationType => (
      <VisualizationTypePickerButton
        key={visualizationType}
        visualizationType={visualizationType}
      />
    ));

    return (
      <div className="visualization-picker-control-bar__visualization-buttons">
        {buttons}
      </div>
    );
  }

  function maybeRenderExploreViewButton() {
    if (exploreViewIsOpen) {
      return null;
    }

    return (
      <ControlBarButtonTooltip
        className="visualization-picker-control-bar__explore-view-btn"
        onClick={onOpenExploreView}
      >
        <div className="visualization-picker-control-bar__show-me-label">
          <I18N>Show all</I18N>
        </div>
        {SHOW_ME_ICON}
      </ControlBarButtonTooltip>
    );
  }

  function maybeRenderBackButton() {
    if (!exploreViewIsOpen || displayedVisualizationType === undefined) {
      return null;
    }

    const tooltipText = `${I18N.text('Return to')} ${
      VISUALIZATION_INFO[displayedVisualizationType].name
    }`;

    return (
      <ControlBarButtonTooltip
        className="visualization-picker-control-bar__back-btn"
        onClick={onCloseExploreView}
        tooltipText={tooltipText}
      >
        <Icon type="menu-left" />
        <div className="visualization-picker-control-bar__back-btn-label">
          <I18N>Back</I18N>
        </div>
      </ControlBarButtonTooltip>
    );
  }

  return (
    <div className="visualization-picker-control-bar">
      {maybeRenderBackButton()}
      {maybeRenderVisualizationButtons()}
      {maybeRenderExploreViewButton()}
    </div>
  );
}
