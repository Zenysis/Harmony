// @flow
import * as React from 'react';
import classNames from 'classnames';

import CustomCalculationsButton from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsButton';
import DirectoryService from 'services/DirectoryService';
import DownloadImageButton from 'components/QueryResult/QueryResultActionButtons/DownloadImageButton';
import ExportButton from 'components/QueryResult/QueryResultActionButtons/ExportButton';
import FilterButton from 'components/QueryResult/QueryResultActionButtons/FilterButton';
import LegacyAnnotateButton from 'components/QueryResult/QueryResultActionButtons/LegacyAnnotateButton';
import LegacySaveQueryButton from 'components/QueryResult/QueryResultActionButtons/LegacySaveQueryButton';
import QuerySelections from 'models/core/wip/QuerySelections';
import ShareAnalysisButton from 'components/QueryResult/QueryResultActionButtons/ShareAnalysisButton';
import { RESULT_VIEW_TYPES } from 'components/QueryResult/common';
import { fetchSiteViewerInfo } from 'permissions';
import type User from 'services/models/User';
import type { ButtonControlsProps } from 'components/visualizations/common/commonTypes';

type Props = {
  ...ButtonControlsProps,
  buttonClassName: string,
  className: string,
  collapsedLayout: boolean,
  getUser: string => Promise<Array<User>>,
  isEditor: boolean,
  showSettingsButton: boolean,
  smallMode: boolean,
};

type State = {
  authorizationChecked: boolean,
  isUserAuthForDownload: boolean,
};

export default class QueryResultActionButtons extends React.PureComponent<
  Props,
  State,
> {
  static defaultProps = {
    className: '',
    collapsedLayout: false,
    buttonClassName: 'action-button dashboard-item-button',
    isEditor: true,
    showSettingsButton: true,
    smallMode: false,

    getUser: DirectoryService.getUser,
  };

  state = {
    authorizationChecked: false,
    isUserAuthForDownload: false,
  };

  componentDidMount() {
    fetchSiteViewerInfo(
      this.props.getUser,
      DirectoryService.getActiveUsername(),
    ).then(isUserAuthForDownload => {
      this.setState({
        authorizationChecked: true,
        isUserAuthForDownload,
      });
    });
  }

  maybeRenderShareAnalysisButton() {
    const { authorizationChecked, isUserAuthForDownload } = this.state;
    const isDownloadAuthorized = authorizationChecked && isUserAuthForDownload;

    const { querySelections, queryResultSpec, viewType } = this.props;
    if (isDownloadAuthorized) {
      return (
        <ShareAnalysisButton
          querySelections={querySelections}
          queryResultSpec={queryResultSpec}
          viewType={viewType}
        />
      );
    }
    return null;
  }

  maybeRenderLegacyAnnotateButton() {
    if (this.props.viewType !== RESULT_VIEW_TYPES.BOX) {
      return <LegacyAnnotateButton />;
    }
    return null;
  }

  maybeRenderDownloadImageButton() {
    const {
      queryResultSpec,
      querySelections,
      viewType,
      collapsedLayout,
      smallMode,
      isEditor,
    } = this.props;

    if (viewType !== RESULT_VIEW_TYPES.BOX) {
      const showLabel = (!smallMode || !isEditor) && !collapsedLayout;
      return (
        <DownloadImageButton
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          viewType={viewType}
          showLabel={showLabel}
        />
      );
    }
    return null;
  }

  maybeRenderExportButton() {
    const {
      queryResultSpec,
      querySelections,
      collapsedLayout,
      smallMode,
      isEditor,
      viewType,
    } = this.props;

    if (viewType !== RESULT_VIEW_TYPES.GEOMAP) {
      const showLabel = (!smallMode || !isEditor) && !collapsedLayout;
      return (
        <ExportButton
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          showLabel={showLabel}
        />
      );
    }
    return null;
  }

  maybeRenderFilterButton() {
    const {
      allFields,
      isEditor,
      queryResultSpec,
      querySelections,
      onFiltersChange,
      smallMode,
      buttonClassName,
      viewType,
    } = this.props;

    if (viewType !== RESULT_VIEW_TYPES.GEOMAP && isEditor && onFiltersChange) {
      return (
        <FilterButton
          className={buttonClassName}
          selections={
            querySelections instanceof QuerySelections
              ? undefined
              : querySelections.get('legacySelections')
          }
          fields={allFields}
          customFields={queryResultSpec.customFields()}
          modalOptionsSelected={queryResultSpec.modalFilters()}
          onFiltersChange={onFiltersChange}
          showLabel={!smallMode || !isEditor}
        />
      );
    }
    return null;
  }

  maybeRenderCustomCalculationsButton() {
    const {
      allFields,
      queryResultSpec,
      onCalculationSubmit,
      onDeleteCalculation,
      onEditCalculation,
      buttonClassName,
      viewType,
    } = this.props;
    if (
      viewType !== RESULT_VIEW_TYPES.GEOMAP &&
      onCalculationSubmit &&
      onDeleteCalculation &&
      onEditCalculation
    ) {
      return (
        <CustomCalculationsButton
          className={buttonClassName}
          onCalculationSubmit={onCalculationSubmit}
          onEditCalculation={onEditCalculation}
          onDeleteCalculation={onDeleteCalculation}
          allFields={allFields}
          customFields={queryResultSpec.customFields()}
          showLabel={!this.props.smallMode || !this.props.isEditor}
        />
      );
    }
    return null;
  }

  maybeRenderSaveToDashboardButton() {
    const { viewType, queryResultSpec, querySelections } = this.props;
    if (viewType !== RESULT_VIEW_TYPES.GEOMAP) {
      return (
        <LegacySaveQueryButton
          viewType={viewType}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
        />
      );
    }
    return null;
  }

  maybeRenderSettingsModalButton() {
    if (!this.props.showSettingsButton) {
      return null;
    }

    const label =
      this.props.smallMode && this.props.isEditor ? null : (
        <span className="action-button-text">
          {t('query_result.common.settings')}
        </span>
      );

    return (
      <span>
        <button
          className={this.props.buttonClassName}
          onClick={this.props.onOpenSettingsModalClick}
          data-content={t('dashboard.DashboardItem.settings')}
          type="button"
          zen-test-id="settings-button"
        >
          <i className="glyphicon glyphicon-cog" />
          {label}
        </button>
      </span>
    );
  }

  render() {
    const { className, smallMode } = this.props;
    const mainClassName = classNames(
      'hide-in-screenshot',
      'query-result-action-buttons',
      className,
      {
        'query-result-action-buttons--small-mode': smallMode,
      },
    );

    return (
      <div className={mainClassName}>
        {this.maybeRenderShareAnalysisButton()}
        {this.maybeRenderLegacyAnnotateButton()}
        {this.maybeRenderDownloadImageButton()}
        {this.maybeRenderExportButton()}
        {this.maybeRenderFilterButton()}
        {this.maybeRenderCustomCalculationsButton()}
        {this.maybeRenderSaveToDashboardButton()}
        {this.maybeRenderSettingsModalButton()}
      </div>
    );
  }
}
