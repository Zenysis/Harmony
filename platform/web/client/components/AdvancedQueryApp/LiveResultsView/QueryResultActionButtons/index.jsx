// @flow
import * as React from 'react';
import classNames from 'classnames';

import * as Zen from 'lib/Zen';
import AuthorizationService from 'services/AuthorizationService';
import Button from 'components/ui/Button';
import CustomCalculationsButton from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/CustomCalculationsButton';
import DirectoryService from 'services/DirectoryService';
import FilterButton from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/FilterButton';
import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import QuerySelections from 'models/core/wip/QuerySelections';
import SaveQueryButton from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/SaveQueryButton';
import SecondaryActionsDropdown from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/SecondaryActionsDropdown';
import ShareQueryButton from 'components/AdvancedQueryApp/LiveResultsView/QueryResultActionButtons/ShareQueryButton';
import VisualizationPickerContext from 'components/AdvancedQueryApp/VisualizationPickerContext';
import {
  DASHBOARD_PERMISSIONS,
  RESOURCE_TYPES,
} from 'services/AuthorizationService/registry';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { ButtonControlsProps } from 'components/visualizations/common/types/buttonControlsProps';

type Props = {
  ...ButtonControlsProps,

  isEditor?: boolean,
  queryResultSpec: QueryResultSpec | void,
  /**
   * Render the secondary action buttons (e.g. 'Share' and 'Add to Dashboard')
   * as a menu, instead of a row of buttons.
   */
  showSecondaryActionButtonsAsMenu: boolean,
  smallMode?: boolean,
};

function QueryResultActionButtons({
  isEditor = true,
  queryResultSpec,
  showSecondaryActionButtonsAsMenu,
  smallMode = false,
  ...buttonControlsProps
}: Props) {
  const {
    onOpenSettingsModalClick,
    onQueryResultSpecChange,
    viewType,
  } = buttonControlsProps;
  const { displayedVisualizationType } = React.useContext(
    VisualizationPickerContext,
  );
  const querySelections = Zen.cast<QuerySelections>(
    buttonControlsProps.querySelections,
  );

  // Used to check user's data export permissions.
  const [
    isUserAuthForDownload,
    setIsUserAuthForDownload,
  ] = React.useState<boolean>(false);

  // Used to check user's dashboard creation permissions.
  const [canCreateDashboards, setCanCreateDashboards] = React.useState<boolean>(
    false,
  );

  // disable all buttons if no visualization type is selected, or if there is no
  // query result spec
  const isDisabled =
    displayedVisualizationType === undefined || queryResultSpec === undefined;

  React.useEffect(() => {
    DirectoryService.canUserExportData(
      DirectoryService.getActiveUsername(),
    ).then(authorizedForDownload =>
      setIsUserAuthForDownload(authorizedForDownload),
    );
  }, []);

  React.useEffect(() => {
    AuthorizationService.isAuthorized(
      DASHBOARD_PERMISSIONS.CREATE,
      RESOURCE_TYPES.DASHBOARD,
    ).then(authorizedForDashboardCreation =>
      setCanCreateDashboards(authorizedForDashboardCreation),
    );
  }, []);

  const maybeRenderFilterButton = () => {
    if (isEditor) {
      const className = classNames('aqt-action-button', {
        'aqt-action-button--disabled': isDisabled,
        'aqt-action-button--enabled': !isDisabled,
      });

      return (
        <FilterButton
          className={className}
          iconClassName="aqt-action-button__icon"
          isDisabled={isDisabled}
          labelClassName="aqt-action-button__text"
          onQueryResultSpecChange={onQueryResultSpecChange}
          queryResultSpec={queryResultSpec}
          showLabel={!smallMode || !isEditor}
          viewType={viewType}
        />
      );
    }
    return null;
  };

  const renderCustomCalculationsButton = () => {
    const className = classNames('aqt-action-button', {
      'aqt-action-button--disabled': isDisabled,
      'aqt-action-button--enabled': !isDisabled,
    });

    return (
      <CustomCalculationsButton
        className={className}
        iconClassName="aqt-action-button__icon"
        isDisabled={isDisabled}
        labelClassName="aqt-action-button__text"
        onQueryResultSpecChange={onQueryResultSpecChange}
        queryResultSpec={queryResultSpec}
        selectedFields={querySelections.fields()}
        showLabel={!smallMode || !isEditor}
      />
    );
  };

  const renderSettingsModalButton = () => {
    const label =
      smallMode && isEditor ? null : (
        <span className="aqt-action-button__text">
          {I18N.textById('Settings')}
        </span>
      );

    const className = classNames('aqt-action-button', {
      'aqt-action-button--disabled': isDisabled,
      'aqt-action-button--enabled': !isDisabled,
    });

    return (
      <Button.Unstyled
        className={className}
        dataContent={I18N.textById('Settings')}
        disabled={isDisabled}
        onClick={onOpenSettingsModalClick}
        testId="aqt-settings-button"
      >
        <i className="glyphicon glyphicon-cog aqt-action-button__icon" />
        {label}
      </Button.Unstyled>
    );
  };

  // Render the secondary action buttons either as a row of buttons or as a
  // dropdown. Only display dropdown if enabled from parent component and at
  // least one of the dropdown options are enabled for the user.
  let secondaryActionButtons = null;
  if (
    showSecondaryActionButtonsAsMenu &&
    (isUserAuthForDownload || canCreateDashboards)
  ) {
    secondaryActionButtons = (
      <Group.Horizontal paddingRight="m">
        <SecondaryActionsDropdown
          disableOptions={isDisabled}
          queryResultSpec={queryResultSpec}
          querySelections={querySelections}
          showSaveQueryOption={canCreateDashboards}
          showShareQueryOption={isUserAuthForDownload}
          viewType={viewType}
          visualizationType={displayedVisualizationType}
        />
      </Group.Horizontal>
    );
  } else {
    // render the default second action buttons
    secondaryActionButtons = (
      <>
        {isUserAuthForDownload && (
          <ShareQueryButton
            isDisabled={isDisabled}
            queryResultSpec={queryResultSpec}
            querySelections={querySelections}
            smallMode={smallMode}
            viewType={viewType}
          />
        )}
        {canCreateDashboards && (
          <SaveQueryButton
            isDisabled={isDisabled}
            queryResultSpec={queryResultSpec}
            querySelections={querySelections}
            smallMode={smallMode}
            visualizationType={displayedVisualizationType}
          />
        )}
      </>
    );
  }

  const aqtMainClassName = classNames(
    'hide-in-screenshot',
    'aqt-query-result-action-buttons',
  );

  return (
    <div className={aqtMainClassName}>
      <div className="aqt-query-result-action-buttons__primary-buttons">
        {renderSettingsModalButton()}
        {renderCustomCalculationsButton()}
        {maybeRenderFilterButton()}
      </div>
      <div className="aqt-query-result-action-buttons__secondary-buttons">
        {secondaryActionButtons}
      </div>
    </div>
  );
}

export default (React.memo(
  QueryResultActionButtons,
): React.AbstractComponent<Props>);
