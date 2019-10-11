// @flow
import * as React from 'react';
import classNames from 'classnames';

import AddAlertButton from 'components/QueryResult/QueryResultActionButtons/AddAlertButton';
import CustomCalculationsButton from 'components/QueryResult/QueryResultActionButtons/CustomCalculationsButton';
import DirectoryService from 'services/DirectoryService';
import DownloadImageButton from 'components/QueryResult/QueryResultActionButtons/DownloadImageButton';
import DownloadQueryButton from 'components/QueryResult/QueryResultActionButtons/DownloadQueryButton';
import ExportButton from 'components/QueryResult/QueryResultActionButtons/ExportButton';
import FilterButton from 'components/QueryResult/QueryResultActionButtons/FilterButton';
import QuerySelections from 'models/core/wip/QuerySelections';
import SaveQueryButton from 'components/QueryResult/QueryResultActionButtons/SaveQueryButton';
import { fetchSiteViewerInfo } from 'permissions';
import { noop } from 'util/util';
import type User from 'services/models/User';
import type { ButtonControlsProps } from 'components/visualizations/common/commonTypes';

// TODO(nina): This is a quick & dirty way to split the AQT and SQT
// control styles, however it will need to be cleaned up to remove
// functionality that will never get touched

type Props = {
  ...ButtonControlsProps,
  collapsedLayout: boolean,
  getUser: string => Promise<Array<User>>,
  isEditor: boolean,
  showAddAlertButton: boolean,
  showDownloadImageButton: boolean,
  showDownloadQueryButton: boolean,
  showExportButton: boolean,
  showFilterButton: boolean,
  showCustomCalculationsButton: boolean,
  showSaveToDashboardButton: boolean,
  smallMode: boolean,
};

// change name from isauthorized

type State = {
  authorizationChecked: boolean,
  isUserAuthForDownload: boolean,
};

// TODO(nina): Move this to its own folder as soon as possible, and
// deprecate QueryResultActionButtons to LegacyQueryResultActionButtons
export default class AQTQueryResultActionButtons extends React.PureComponent<Props, State> {
  static defaultProps = {
    collapsedLayout: false,
    isEditor: true,
    showAddAlertButton: false,
    showDownloadImageButton: false,
    showDownloadQueryButton: false,
    showExportButton: false,
    showFilterButton: false,
    showCustomCalculationsButton: false,
    showSaveToDashboardButton: false,
    smallMode: false,

    onDeleteCalculation: noop,
    onEditCalculation: noop,

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

  maybeRenderAddAlert() {
    const { querySelections, showAddAlertButton } = this.props;
    if (showAddAlertButton) {
      return <AddAlertButton querySelections={querySelections} />;
    }
    return null;
  }

  maybeRenderDownloadImageButton() {
    const {
      queryResultSpec,
      querySelections,
      showDownloadImageButton,
      viewType,
      collapsedLayout,
      smallMode,
      isEditor,
    } = this.props;

    if (showDownloadImageButton) {
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

  maybeRenderDownloadQueryButton() {
    const {
      queryResultSpec,
      querySelections,
      showDownloadQueryButton,
      viewType,
      smallMode,
    } = this.props;
    const { authorizationChecked, isUserAuthForDownload } = this.state;
    const isDownloadAuthorized = authorizationChecked && isUserAuthForDownload;

    // Check type of querySelections because technically could be instance
    // of SimpleQuerySelections, even though we would never pass in
    // querySelections of that type
    if (isDownloadAuthorized && showDownloadQueryButton &&
        querySelections instanceof QuerySelections) {
      return (
        <DownloadQueryButton
          smallMode={smallMode}
          querySelections={querySelections}
          queryResultSpec={queryResultSpec}
          viewType={viewType}
        />
      );
    }
    return null;
  }

  maybeRenderExportButton() {
    const {
      showExportButton,
      queryResultSpec,
      querySelections,
      collapsedLayout,
      smallMode,
      isEditor,
    } = this.props;

    if (showExportButton) {
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
      showFilterButton,
      queryResultSpec,
      onFiltersChange,
      smallMode,
    } = this.props;

    if (showFilterButton && isEditor && onFiltersChange) {
      return (
        <FilterButton
          className="aqt-action-button"
          iconClassName="aqt-action-button--icon"
          labelClassName="aqt-action-button-text"
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
      showCustomCalculationsButton,
      onCalculationSubmit,
      onDeleteCalculation,
      onEditCalculation,
    } = this.props;
    if (
      showCustomCalculationsButton &&
      onCalculationSubmit &&
      onDeleteCalculation &&
      onEditCalculation
    ) {
      return (
        <CustomCalculationsButton
          className="aqt-action-button"
          labelClassName="aqt-action-button-text"
          iconClassName="aqt-action-button--icon"
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
    const {
      showSaveToDashboardButton,
      viewType,
      queryResultSpec,
      querySelections,
      smallMode,
    } = this.props;
    if (showSaveToDashboardButton) {
      return (
        <SaveQueryButton
          smallMode={smallMode}
          viewType={viewType}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
        />
      );
    }
    return null;
  }

  maybeRenderSettingsModalButton() {
    const label =
      this.props.smallMode && this.props.isEditor ? null : (
        <span className="aqt-action-button-text">
          {t('query_result.common.settings')}
        </span>
      );

    return (
      <button
        className="aqt-action-button-settings-button"
        onClick={this.props.onOpenSettingsModalClick}
        data-content={t('dashboard.DashboardItem.settings')}
        type="button"
        zen-test-id="settings-button"
      >
        <i className="glyphicon glyphicon-cog aqt-action-button-settings-button--icon" />
        {label}
      </button>
    );
  }

  render() {
    const aqtMainClassName = classNames(
      'hide-in-screenshot',
      'aqt-query-result-action-buttons',
    );

    return (
      <div className={aqtMainClassName}>
        <div className="aqt-query-result-action-buttons__primary-buttons">
          {this.maybeRenderSettingsModalButton()}
          {this.maybeRenderCustomCalculationsButton()}
          {this.maybeRenderFilterButton()}
        </div>
        <div className="aqt-query-result-action-buttons__secondary-buttons">
          {this.maybeRenderDownloadQueryButton()}
          {this.maybeRenderSaveToDashboardButton()}
        </div>
      </div>
    );
  }
}
