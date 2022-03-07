// @flow
import * as React from 'react';
import classNames from 'classnames';

import AQTDispatch from 'components/AdvancedQueryApp/AQTDispatch';
import ControlBar from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ControlBar/index';
import DisabledView from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/DisabledView';
import ExploreView from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/ExploreView';
import QueryScalingContext from 'components/common/QueryScalingContext';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import buildScaledStyle from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker/buildScaledStyle';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { StyleObject } from 'types/jsCore';

type Props = {
  queryResultSpec: QueryResultSpec | void,
  showExploreView: boolean,
};

export default function VisualizationPicker({
  queryResultSpec,
  showExploreView,
}: Props): React.Element<'div'> {
  const dispatch = React.useContext(AQTDispatch);
  const {
    displayedVisualizationType,
    enabledVisualizationTypes,
    looselyEnabledVisualizationTypes,
  } = React.useContext(VisualizationPickerContext);
  const queryScalingContext = React.useContext(QueryScalingContext);
  const isDefinedVisualization = displayedVisualizationType !== undefined;
  const isEnabledVisualization = enabledVisualizationTypes.includes(
    displayedVisualizationType,
  );
  const isLooselyEnabledVisualization = looselyEnabledVisualizationTypes.includes(
    displayedVisualizationType,
  );

  const onOpenExploreView = () => {
    dispatch({ type: 'VIZ_PICKER_EXPLORE_VIEW_TOGGLE', show: true });
  };
  const onCloseExploreView = () => {
    dispatch({ type: 'VIZ_PICKER_EXPLORE_VIEW_TOGGLE', show: false });
  };

  const showDisabledView =
    isDefinedVisualization &&
    !isEnabledVisualization &&
    !showExploreView &&
    !isLooselyEnabledVisualization;

  const className = classNames('visualization-picker', {
    'visualization-picker--show-explore-view': showExploreView,
    'visualization-picker--empty-state': queryResultSpec === undefined,
    'visualization-picker--show-disabled-view': showDisabledView,
  });

  const { containerStyle, overlayStyle } = buildScaledStyle(
    queryScalingContext,
  );

  return (
    <div className={className} style={containerStyle}>
      <ControlBar
        onCloseExploreView={onCloseExploreView}
        onOpenExploreView={onOpenExploreView}
        exploreViewIsOpen={showExploreView}
      />
      <DisabledView show={showDisabledView} style={overlayStyle} />
      <ExploreView show={showExploreView} style={overlayStyle} />
    </div>
  );
}
