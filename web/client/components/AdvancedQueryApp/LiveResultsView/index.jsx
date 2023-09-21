// @flow
import * as React from 'react';
import classNames from 'classnames';
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import ElementResizeService from 'services/ui/ElementResizeService';
import QueryResult from 'components/QueryResult';
import QueryResultActionButtons from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons';
import QueryScalingContext, {
  INITIAL_QUERY_SCALING_VALUES,
  ENABLE_VISUALIZATION_SPECIFIC_SCALING,
} from 'components/common/QueryScalingContext';
import SettingsModal from 'components/visualizations/common/SettingsModal';
import VisualizationPicker from 'components/AdvancedQueryApp/LiveResultsView/VisualizationPicker';
import autobind from 'decorators/autobind';
import getQueryResultScalingDimensions from 'components/AdvancedQueryApp/LiveResultsView/getQueryResultScalingDimensions';
import getQueryResultStyle from 'components/AdvancedQueryApp/LiveResultsView/getQueryResultStyle';
import memoizeOne from 'decorators/memoizeOne';
import { cancelPromise } from 'util/promiseUtil';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ResizeRegistration } from 'services/ui/ElementResizeService';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

// NOTE: We need to define the padding here vs in CSS since we need to
// be able to scale this padding depending on the current scaling behavior.
const QUERY_RESULT_PADDING = 15;

type Props = {
  onQueryResultSpecChange: (newSpec: QueryResultSpec) => void,
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,

  /**
   * Render the secondary action buttons (e.g. 'Share' and 'Add to Dashboard')
   * as a menu, instead of a row of buttons.
   */
  showSecondaryActionButtonsAsMenu: boolean,

  showVizPickerExploreView: boolean,
  tabsAreEnabled: boolean,
  viewType: ResultViewType,
  visualizationType: VisualizationType | void,
};

type State = {
  queryScalingContext: $ContextType<typeof QueryScalingContext>,
  showSettingsModal: boolean,
};

export default class LiveResultsView extends React.PureComponent<Props, State> {
  state: State = {
    queryScalingContext: INITIAL_QUERY_SCALING_VALUES,
    showSettingsModal: false,
  };

  queryResultContainerElt: HTMLDivElement | null | void;
  resizeRegistration: ResizeRegistration<HTMLDivElement> = ElementResizeService.register(
    this.onResize,
    (elt: HTMLDivElement | null | void) => {
      this.queryResultContainerElt = elt;
    },
  );

  @autobind
  onCloseSettingsModal(): void {
    this.setState({ showSettingsModal: false });
  }

  @autobind
  onOpenSettingsModalClick() {
    this.setState({ showSettingsModal: true });
  }

  @autobind
  onResize({ contentRect }: ResizeObserverEntry) {
    const { height, width } = contentRect;
    const {
      referenceHeight,
      referenceWidth,
      scaleFactor,
    } = getQueryResultScalingDimensions(height, width);

    this.setState({
      queryScalingContext: {
        referenceHeight,
        referenceWidth,
        scaleFactor,
      },
    });
  }

  maybeRenderQueryResult(
    context: $ContextType<typeof QueryScalingContext>,
  ): React.Node {
    const {
      onQueryResultSpecChange,
      queryResultSpec,
      querySelections,
      viewType,
    } = this.props;

    if (queryResultSpec === undefined) {
      return null;
    }

    // Scale the container padding so that regardless of scaling behavior (whole
    // container vs viz specific scaling) the padding value is the same. This
    // ensures child elements (like title and viz element) are spaced correctly
    // on the DOM.
    const scaleFactor = context !== undefined ? context.scaleFactor : 1;
    const style = { padding: QUERY_RESULT_PADDING * scaleFactor };
    return (
      <div className="aqt-query-result-container__query-result" style={style}>
        <QueryResult
          enableMobileMode={false}
          enableWarningMessages
          onQueryResultSpecChange={onQueryResultSpecChange}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          viewType={viewType}
        />
      </div>
    );
  }

  maybeRenderQueryResultItems(): React.Node {
    const { visualizationType } = this.props;

    const disableVisualizationSpecificScaling =
      visualizationType === undefined ||
      !ENABLE_VISUALIZATION_SPECIFIC_SCALING.includes(visualizationType);

    const style = getQueryResultStyle(
      disableVisualizationSpecificScaling,
      this.state.queryScalingContext,
    );
    const contextValue = disableVisualizationSpecificScaling
      ? undefined
      : this.state.queryScalingContext;

    return (
      <QueryScalingContext.Provider value={contextValue}>
        <div
          className="aqt-query-result-container__scaled-container"
          style={style}
        >
          {this.renderVisualizationPicker()}
          {this.maybeRenderQueryResult(contextValue)}
        </div>
      </QueryScalingContext.Provider>
    );
  }

  maybeRenderSettingsModal(): React.Node {
    const {
      onQueryResultSpecChange,
      queryResultSpec,
      querySelections,
      viewType,
    } = this.props;
    const { showSettingsModal } = this.state;

    if (!showSettingsModal || queryResultSpec === undefined) {
      return null;
    }

    return (
      <SettingsModal
        onQueryResultSpecChange={onQueryResultSpecChange}
        onRequestClose={this.onCloseSettingsModal}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        show={showSettingsModal}
        viewType={viewType}
      />
    );
  }

  renderQueryResultActionButtons(): React.Node {
    const {
      onQueryResultSpecChange,
      queryResultSpec,
      querySelections,
      showSecondaryActionButtonsAsMenu,
      viewType,
    } = this.props;

    return (
      <QueryResultActionButtons
        onOpenSettingsModalClick={this.onOpenSettingsModalClick}
        onQueryResultSpecChange={onQueryResultSpecChange}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        showSecondaryActionButtonsAsMenu={showSecondaryActionButtonsAsMenu}
        smallMode={window.innerWidth < 1250}
        viewType={viewType}
      />
    );
  }

  renderVisualizationPicker(): React.Node {
    const { queryResultSpec, showVizPickerExploreView } = this.props;

    return (
      <VisualizationPicker
        queryResultSpec={queryResultSpec}
        showExploreView={showVizPickerExploreView}
      />
    );
  }

  render(): React.Node {
    const { tabsAreEnabled } = this.props;
    const className = classNames(
      'download-image-current-size live-results-view advanced-query-app__main-column',
      {
        'advanced-query-app__main-column--disabled-tabs': !tabsAreEnabled,
      },
    );

    // TODO: We are adding the 'download-image-current-size' class so
    // that when a user downloads an image in the current size (using
    // findVisualizationContainerElt() in QueryResultCaptureUtil.jsx), the ref
    // can find the right parent container. This is an okay fix for now, but
    // we should change how we search for the element.
    return (
      <div className={className}>
        {this.renderQueryResultActionButtons()}

        {this.maybeRenderSettingsModal()}
        <div
          ref={this.resizeRegistration.setRef}
          className="aqt-query-result-container"
        >
          {this.maybeRenderQueryResultItems()}
        </div>
      </div>
    );
  }
}
