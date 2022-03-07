// @flow
import * as React from 'react';

import ControlBarButtonTooltip from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ControlBar/ControlBarButtonTooltip';
import Icon from 'components/ui/Icon';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import VisualizationTypePickerButton from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ControlBar/VisualizationTypePickerButton';
import {
  CONTROL_BAR_VISUALIZATION_ORDER,
  VISUALIZATION_INFO,
} from 'models/AdvancedQueryApp/VisualizationType/registry';

type Props = {
  onCloseExploreView: () => void,
  onOpenExploreView: () => void,
  exploreViewIsOpen: boolean,
};

const SHOW_ME_ICON = (
  <div className="visualization-picker-control-bar__show-me-icon">
    <svg viewBox="0 0 22.32 16">
      <rect fill="#3597e4" width="22.32" height="2.53" />
      <rect fill="#ff9362" y="3.37" width="18.53" height="2.53" />
      <rect fill="#f4b2d0" y="7.16" width="9.26" height="2.53" />
      <rect fill="#ffcb4a" y="10.11" width="11.79" height="2.53" />
      <rect fill="#883aa2" y="13.47" width="16" height="2.53" />
    </svg>
  </div>
);

const TEXT_PATH =
  'AdvancedQueryApp.LiveResultsView.VisualizationPicker.ControlBar';
const TEXT = t(TEXT_PATH);

export default function ControlBar({
  onCloseExploreView,
  onOpenExploreView,
  exploreViewIsOpen,
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
          {TEXT.showMe}
        </div>
        {SHOW_ME_ICON}
      </ControlBarButtonTooltip>
    );
  }

  function maybeRenderBackButton() {
    if (!exploreViewIsOpen || displayedVisualizationType === undefined) {
      return null;
    }

    const tooltipText = `${TEXT.returnToViz} ${VISUALIZATION_INFO[displayedVisualizationType].name}`;

    return (
      <ControlBarButtonTooltip
        className="visualization-picker-control-bar__back-btn"
        onClick={onCloseExploreView}
        tooltipText={tooltipText}
      >
        <Icon type="menu-left" />
        <div className="visualization-picker-control-bar__back-btn-label">
          {TEXT.back}
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
