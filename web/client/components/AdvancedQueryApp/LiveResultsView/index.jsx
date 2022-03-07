// @flow
import * as React from 'react';
import classNames from 'classnames';
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import CaseManagementInfoContext, {
  loadCaseManagementInfo,
} from 'components/QueryResult/CaseManagementInfoContext';
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
import type DruidCaseType from 'models/CaseManagementApp/DruidCaseType';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type QuerySelections from 'models/core/wip/QuerySelections';
import type { ResizeRegistration } from 'services/ui/ElementResizeService';
import type { ResultViewType } from 'components/QueryResult/viewTypes';
import type { VisualizationType } from 'models/AdvancedQueryApp/VisualizationType/types';

// NOTE(stephen): We need to define the padding here vs in CSS since we need to
// be able to scale this padding depending on the current scaling behavior.
const QUERY_RESULT_PADDING = 15;

type Props = {
  onQueryResultSpecChange: (newSpec: QueryResultSpec) => void,
  queryResultSpec: QueryResultSpec | void,
  querySelections: QuerySelections,
  showVizPickerExploreView: boolean,
  viewType: ResultViewType,
  visualizationType: VisualizationType | void,

  /**
   * Render the secondary action buttons (e.g. 'Share' and 'Add to Dashboard')
   * as a menu, instead of a row of buttons.
   */
  showSecondaryActionButtonsAsMenu: boolean,
  tabsAreEnabled: boolean,
};

type State = {
  // all case types used in case management (which is potentially needed by our
  // Table visualization)
  allDruidCaseTypes: Zen.Map<DruidCaseType>,

  // is case management enabled, and does the user have permissions to view it?
  canUserViewCaseManagement: boolean,

  // have we loaded case management info? (currently only needed by our Table
  // visualization)
  isCaseManagementInfoLoaded: boolean,
  queryScalingContext: $ContextType<typeof QueryScalingContext>,
  showSettingsModal: boolean,
};

export default class LiveResultsView extends React.PureComponent<Props, State> {
  state: State = {
    allDruidCaseTypes: Zen.Map.create(),
    canUserViewCaseManagement: false,
    isCaseManagementInfoLoaded: false,
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

  caseManagementInfoPromise: Promise<mixed> | void;

  componentDidMount() {
    this.loadCaseManagementInfo();
  }

  componentDidUpdate() {
    this.loadCaseManagementInfo();
  }

  comonentWillUnmount() {
    if (this.caseManagementInfoPromise !== undefined) {
      cancelPromise(this.caseManagementInfoPromise);
    }
  }

  loadCaseManagementInfo() {
    // TODO(pablo): extract this to a custom hook that can be shared in
    // LiveResultsView and DashboardQueryItem
    const { viewType } = this.props;
    const { isCaseManagementInfoLoaded } = this.state;
    if (
      viewType === 'TABLE' &&
      !isCaseManagementInfoLoaded &&
      this.caseManagementInfoPromise === undefined
    ) {
      this.caseManagementInfoPromise = loadCaseManagementInfo().then(
        caseManagementInfo => {
          this.setState({
            ...caseManagementInfo,
            isCaseManagementInfoLoaded: true,
          });
        },
      );
    }
  }

  @memoizeOne
  buildCaseManagementInfo(
    canUserViewCaseManagement: boolean | void,
    allDruidCaseTypes: Zen.Map<DruidCaseType> | void,
  ): $ContextType<typeof CaseManagementInfoContext> {
    return {
      canUserViewCaseManagement: canUserViewCaseManagement || false,
      allDruidCaseTypes: allDruidCaseTypes || Zen.Map.create(),
    };
  }

  getCaseManagementInfo(): $ContextType<typeof CaseManagementInfoContext> {
    const { canUserViewCaseManagement, allDruidCaseTypes } = this.state;
    return this.buildCaseManagementInfo(
      canUserViewCaseManagement,
      allDruidCaseTypes,
    );
  }

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
      scaleFactor,
      referenceHeight,
      referenceWidth,
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
      queryResultSpec,
      querySelections,
      viewType,
      onQueryResultSpecChange,
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
      viewType,
      showSecondaryActionButtonsAsMenu,
    } = this.props;

    return (
      <QueryResultActionButtons
        onOpenSettingsModalClick={this.onOpenSettingsModalClick}
        onQueryResultSpecChange={onQueryResultSpecChange}
        queryResultSpec={queryResultSpec}
        querySelections={querySelections}
        viewType={viewType}
        smallMode={window.innerWidth < 1250}
        showSecondaryActionButtonsAsMenu={showSecondaryActionButtonsAsMenu}
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

    // TODO(nina): We are adding the 'download-image-current-size' class so
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
