// TODO(pablo): change this file to use ES6 imports, not require/module.exports
// TODO(pablo): change this file to use PascalCased paths that match the React
// hierarchy

/* eslint-disable max-len */
/* prettier-ignore */

module.exports = {
  admin_app: {
    tabs: {
      users_tab: 'Users',
      config_tab: 'Site Configuration',
      groups_tab: 'Groups',
    },
    configuration: {
      valueUpdated: "%(key)s has been updated.",
      saveValue: "Save %(key)s",
      flagConfiguration: {
        disabled: 'Disabled',
        enabled: 'Enabled',
        currentValueLabel: "%(key)s is Currently:",
      },
      textConfiguration: {
        saveText: "Save %(key)s",
      },
      keys: {
        public_access: 'Public Access',
        crisp_id: 'Crisp Chat ID',
        crisp_enabled: 'Crisp',
        default_url: 'Default URL',
        project_manager_ids: 'Project Managers',
        cur_datasource: 'Datasource',
      },
      helpText: {
        public_access: 'Indicates whether or not public user support is enabled. When enabled, unregistered users will be able to access the site as well.',
        crisp_id: 'This setting dictates which page the user will be redirected to upon logging in/accessing the index page.',
        crisp_enabled: 'A unique identifier that Crisp uses to resolve a chat session to an individual domain.',
        default_url: 'Indicates whether or not Crisp chat is enabled.',
        project_manager_ids: '',
        cur_datasource: 'This setting allows user to select which datasource models will use.'
      },
      warningText: {
        public_access: 'By changing the value of this checkbox, you will allow or prevent unregistered users from running queries on the site and viewing Dashboards.',
        cur_datasource: 'By changing the datasource, the server will have to restart. Are you certain you wish to proceed?'
      },
      resetValue: 'Reset to default',
      updateError: 'There was an error updating settings. Contact an Administrator for assistance. ',
      valueSuccessfullyReset: 'The configuration setting has been reset to its default value.',
      resetModal: {
        title: 'Reset Configuration',
        primaryButtonText: 'Reset',
        resetWarningFormat: "Are you certain you wish to reset the configuration for '%(key)s'? The value will be reset to '%(defaultValue)s'.",
      },
    },
    deleteUserModal: {
      alertDescription: 'If you delete the following user, you must either delete or take ownership of the following alerts:',
      deleteWithoutTransfer: 'Force Delete',
      deleteWithTransfer: 'Transfer and Delete',
      dashboardDescription: 'If you delete the following user, you must either delete or take ownership of the following dashboards:',
      title: 'Delete User',
    },
    groups: {
      all: 'All',
      create_group: 'Create a new Group',
      delete_group: 'Delete',
      delete_group_warning: 'Are you sure you want to delete this Group?',
      delete_group_success: 'The group was successfully deleted',
      delete_group_failed: 'There was an error deleting this group. Additional details were written to the console.',
      save_group_changes: 'Save Changes',
      select_group: 'Select a Group',
      select_property: 'Select a Group Property to Edit',
      users_property: 'Users',
      roles_property: 'Roles',
      changes_saved_success: 'The group changes were successfullly saved.',
      changes_saved_error: 'An error occurred while trying to save group changes. Additional details were written to the console.',
      changes_discarded: 'All unsaved changes have been discarded.',
      create_group_failed: 'Group creation was unsuccessful. Additional details were written to the console.',
      create_group_success: 'New group was successfully created.',
      switch_group_error: 'Could not select that group. Please contact an Administrator for assistance. ',
      switch_group_modal: {
        title: 'Confirm Group Change',
        warning_text: 'Are you sure you want to switch groups? All unsaved changes will be discarded.',
        primary_button_text: 'Switch Group',
      },
      new_group_modal: {
        title: 'Create New Group',
        primary_button_text: 'Create',
        new_group_prompt: 'What would you like to call this group?',
      },
    },
    inviteUserBlock: {
      emailPlaceholder: 'Enter email',
      namePlaceholder: 'Enter name',
      inviteUser: 'Invite User',
      inviteUserButton: 'Invite',
      inviteSendingInProgress: 'Sending...',
      inviteUserFail: 'Could not invite user. Additional details were written to the console.',
      inviteUserSuccess: 'Successfully invited user.',
    },
    status_dropdown_default: 'All Users',
    users: {
      updateUserSuccess: 'User profile was successfully updated.',
      updateUserFail: 'There was an error updating the user profile. Additional details were written to the console. ',
      deleteUserSuccess: 'The user was successfully deleted',
      deleteUserFail: 'There was an error deleting the user. Additional details were written to the console.',
      resendInviteSuccess: 'Successfully resent an inivtation e-mail to the user.',
      resendInviteFail: 'There was an error resending the user an invitation.  Additional details were written to the console.',
      resetPasswordSuccess: 'Sucessfully reset the user\'s password.',
      resetPasswordFail: 'There was an error resetting the user\'s password. Additional details were written to the console.',
    },
    user_status_values: {
      active: 'Active',
      pending: 'Pending',
      inactive: 'Inactive',
    },
    userProfileModal: {
      edit: 'Edit',
      email: 'Email',
      firstName: 'First Name',
      invalid_user_fields: 'Edited fields are invalid. Username must be an e-mail address and first name and last name may not be blank or contain special characters ($, @, !, <, >).',
      invite_resent: 'Sucessfully resent the user an invitation',
      invite_resend_failure: 'There was an error resending the user invite. Additional details were written to the console. ',
      lastName: 'Last Name',
      none: 'None',
      phoneNumber: 'Phone Number',
      reset_password: 'Reset Password',
      resetting_password: 'Resetting...',
      resend_invite: 'Resend Invite',
      role_already_selected: 'The specified role already exists',
      save: 'Save',
      sending_invite: 'Sending...',
      status: 'Status',
      sitewide_permission: 'Sitewide',
      user_roles: 'User Roles',
    },
    userTableHeaders: {
      email: 'Email',
      name: 'Name',
      phoneNumber: 'Phone Number',
      status: 'Status',
    },
  },

  AdvancedQueryApp: {
    allQueriesDeserializationError: 'Problem loading all queries. Resetting tabs',
    copiedQueryTabName: 'Copy from',
    errorFetchingSharedQuery:'Link was not valid. Please ensure it was correct',
    queryDeserializationError: 'Problem loading query',
    tabNameNotFound: 'Tab Error',
    QueryFormPanel: {
      shareQueryButton: 'Share Query',
      shareQueryTitle: 'Share query with others',
      shareQueryUrlLabel: 'Link:',
      title: 'Build Query',
      FilterSelectionBlock: {
        title: 'Filters',
        helpText: 'Limit the data that you want to see in your results',
        DimensionValueCustomizationModule: {
          emptySelectionsDropdownText: '0 selected',
          label: 'Select filter values',
        },
      },
      GroupBySelectionBlock: {
        title: 'Group By',
        helpText: 'Select the groups to break up your analysis',
      },
      GroupBySelector: {
        columnTitles: {
          root: 'Select a category',
          geography: 'Select location',
        },
      },
      GroupByCustomizationModule: {
        includeNull: 'Include empty values',
        label: 'Label:',
      },
      IndicatorCustomizationModule: {
        label: 'Label:',
        operation: 'Operation:',
        CountDistinctCustomizationBlock: {
          title: 'Count Distinct Dimension:',
        },
        DataQualityBlock: {
          qualityScore: "Data Quality Score",
          noScore: "Could not compute a quality score for this indicator due to lack of data.",
        },
        TimeFilterBlock: {
          addTimeFilterBtn: 'Add Indicator Time Filter',
          removeFilterBtn: 'Remove Filter',
        },
      },
      IndicatorSelectionBlock: {
        IndicatorSelector: {
          columnTitle: 'Data source',
          mruGroupingName: 'Most Recently Used Indicators',
        },
        helpText: 'Select one or more indicators you would like to investigate',
        title: 'Indicators',
      },
      SelectionBlock: {
        QueryPartSelector: {
          add: 'Add',
          close: 'Close',
        },
        CustomizableTag: {
          CustomizationModuleWrapper: {
            close: 'Close',
          },
        },
      },
      SharingModal: {
        closeButtonText: 'Close',
        copyButtonText: 'Copy to clipboard',
        onCopySuccess: 'Successfully copied',
      },
    },
    LiveResultsView: {
      title: 'Query Results',
    },
    QueryTabItem: {
      newQueryNamePrefix: 'Query',
    },
    QueryTabList: {
      newTabButton: 'New Query',
      overviewButton: 'All Queries',

      QueryTabContextMenu: {
        clone: 'Duplicate',
        delete: 'Delete',
        rename: 'Rename...',
      },
    },
  },

  clear: {
    label: 'Clear',
  },

  common: {
    confirmation_popover: {
      prompt: 'Are you sure?',
      confirm: 'Confirm',
      cancel: 'Cancel',
    },
    destructive_action_modal: {
      proceed_text: 'Proceed',
      cancel_text: 'Cancel',
      understand_text: 'I understand',
      instruction_format: "To undertake this action, please type '%(understand_text)s' to acknowledge that you understand.",
      title: 'Confirmation Required',
    },
    role_select: {
      add_role: 'Add a Role',
      resource_type: 'Resource Type',
      role_already_selected: 'The specified role already exists',
      role_name: 'Role Name',
      resource_name: 'Resource Name',
      sitewide_label: 'Sitewide',
      new_role_modal: {
        add_role: 'Add Role',
        select_resource_type: 'Select a Resource Type',
        select_resource: 'Select a Resource',
        select_role: 'Select a Role',
        selected_sitewide_role: 'The selected role will be applicable for all resources of the specified type.',
        title: 'Define Permissions',
      },
    },
    user_select: {
      deleteUserPopover: {
        deleteButton: 'Delete',
        deleteConfirmation: 'Are you sure you want to delete this user?',
      },
      default_title: 'Add users',
      select_role: 'Specify role',
      selected_users_subtitle: 'Selected Users',
      name: 'Name',
      email: 'Email',
      status: 'Status',
      role: 'Role',
    },
    removeButtonColumn: {
      deleteButton: 'Delete',
      deleteConfirmation: 'Are you sure you want to delete this entry?',
    },
    DashboardsDropdown: {
      newDashboard: 'New Dashboard',
      myDashboards: 'My Dashboards',
      otherDashboards: 'Other Dashboards',
    },
  },

  ui: {
    BaseModal: {
      closeText: 'Cancel',
      primaryText: 'Yes',
      secondaryText: 'No',
    },
    Dropdown: {
      emptyGroup: 'There are no options in this group',
      emptySearchResults: 'No results matched "%(searchText)s"',
      noOptions: 'There are no options to select',
      noSearch: 'Please enter a search term to see results',
      searchPlaceholder: 'Search...',
      selectAll: 'Select All',
      selected: 'selected',
    },
    HierarchicalSelector: {
      SearchBar: {
        defaultPlaceholder: 'Search for data elements',
        categoryPlaceholder: 'Search for data elements in this category'
      },
      SearchResults: {
        noResults: "No Search Results"
      },
    },
    Table: {
      search: 'Search',
      noData: 'There is nothing to display at this time.',
      noResults: 'Sorry, there are no results that match your search query.',
    },
    ToggleSwitch: {
      enabled: 'Enabled',
      disabled: 'Disabled',
    },

    visualizations: {
      LineGraph: {
        LineGraphTooltip: {
          value: 'Value',
          date: 'Date'
        }
      },
      BoxPlot:{
        tooltip: {
          max: 'Max',
          thirdQuartile: 'Third Quartile',
          median: 'Median',
          firstQuartile: 'First Quartile',
          min: 'Min'
        }
      },
      EpiCurve: {
        yAxisDefaultLabel: 'Total Number of Cases',
        tooltip: {
          from: 'From',
          to: 'to'
        }
      },
      BumpChart: {
        BumpChartTooltip: {
          rank: 'Rank',
          value: 'Value',
        },
        models: {
          BumpChartTheme: {
            dark: 'Dark',
            light: 'Light',
          },
        },
      },
      Table: {
        noRows: 'No rows',
        searchPlaceholder: 'Search',
      },
    },
  },

  LocationAdminApp: {
    title: 'Match New Locations',
    progressInfo: {
      matched: 'MATCHED',
      unmatched: 'UNMATCHED',
      title: 'Filter unmatched locations',
      sourceLabel: 'Explore unmatched locations for',
      sourceLabelEnding: ' data source and',
      levelLabel: ' Administrative levels',
      flag: 'FLAGGED',
    },
    unmatchedLocations: {
      title: 'Match Location',
      noUnmatched: 'THERE ARE NO UNMATCHED LOCATIONS FOR THE GIVEN FILTERS',
      tooltip: 'Match the unmatched location to suggested matches in the Master Facility List or search for other possible locations.',
      complete: 'You have reached the last match',
      arrowButtons: {
        back: 'Previous',
        next: 'Next',
        skip: 'Skip',
      },
      flagButton: {
        flag: 'Flag',
        unflag: 'Unflag',
      },
      search: {
        default: 'Search for other locations',
      },
    },
    review: {
      title: 'Review Matches',
      reviewButton: 'Review Matches',
      submitButton: 'Submit Matches',
      removeButton: 'Remove Matches',
      openMfrButton: 'Explore Master Facility List',
      selectedTable: {
        title: 'Current Selected Matches',
        empty: 'No selected matches.',
      },
      removedTable: {
        title: 'Current Removed Matches',
        empty: 'No removed matches.',
      },
      flagTable: {
        title: 'Current Flagged Matches',
        empty: 'No flagged matches.',
      },
      headers: {
        unmatched: 'Unmatched Location',
        canonical: 'Official Location',
        user: 'User',
        remove: 'Remove Match',
        add: 'Restore Match',
        flag: 'Flag Match',
        removeFlag: 'Remove Flag',
      },
      submitToast: 'Successfully submitted matches.',
      removeToast: 'Successfully removed matches.',
      submitWarning: 'By submitting these matches you are finalizing all mappings on the table.',
    },
  },

  MasterFacilityExplorerApp: {
    title: 'Explore Master Facility List Locations and Mappings',
    exportButton: 'Export Master Facility List',
    downloadTriggered: 'Starting MFR download',
    heading: 'Location Matching',
    summaryHeading: 'Summary of matching Progress',
    matchButton: 'Continue Matching',
    reviewButton: 'Review matches',
    noMatches: 'No Matches',
    matchesPrefix: 'Matches:',
    hierarchyInstructions: 'This hierarchy tree represents the Master Facility List used in the platform. Explore the MFL by clicking on nodes, and view location matches in the integration pipeline by hovering on the locations',
  },

  OverviewApp: {
    title: 'Overview',
    welcome: 'Welcome,',
    official: 'Official Dashboards',
    dashboards: {
      empty: 'There are no Dashboards',
      recentDashboardsTitle: 'Recently Updated Dashboards',
      userTabTitle: 'My Dashboards',
      otherTabTitle: 'Other Dashboards',
      search: 'Search dashboard by name',
      columns: {
        title: 'Name',
        lastModified: 'Date last updated',
        created: 'Created',
        isFavorite: 'Favorite',
        lastModifiedByCurrentUser: 'My Last Edit',
        lastAccessedByCurrentUser: 'My Last Visit',
        owner: 'Owner',
        totalViews: 'Views',
        totalViewsByUser: 'My Views',
      },
    },
    queries: {
      search: 'Search Query Indicators...',
      empty: 'There are no Recent Queries',
      title: 'My Recent Queries',
      create: 'Create Query',
      columns: {
        indicators: 'Indicators',
        granularity: 'Group By',
        startDate: 'Start Date',
        endDate: 'End Date',
      },
    },
    alerts: {
      title: 'Alerts',
      empty: 'There are no Alerts',
      search: 'Search Alert Names...',
      columns: {
        fieldName: 'Name',
        message: 'Message',
        dimensionDisplayName: 'Dimensions',
      },
    },
  },

  query_app: {
    remove_query: 'Remove query',
    subtitle: 'Construct queries and visualize data',
    grid_dash: 'National Dashboard',
    jsc_dash: 'JSC Dashboard (EFY 2009)',
    national_dash: 'National Dashboard',
  },

  dashboard_builder: {
    create: 'Create Dashboard',
    created: 'Dashboard created',
    creation_error: 'Dashboard creation error',
    corrupt_load_title: 'There was an error loading the Dashboard Specification. Contact an Administrator and DO NOT make any changes. ',
    tile_clone_sucess: 'Dashboard Item was cloned successfully.',
    default_title: 'Custom Dashboard',
    edit_mode: 'Edit',
    view_mode: 'Present',
    load_dashboard_invalid: 'There are errors present in the Dashboard retrieved from the server. The dashboard may not be rendered properly. You cannot make changes to the Dashboard at this time. Contact an Administrator for assistance.',
    load_dashboard_error: 'There was an error retrieving and/or loading the Dashboard. Contact an Administrator for assistance. Details were written to the console.',
    save_specification: 'Save',
    save_dashboard_success: 'Dashboard was successfully saved. ',
    save_dashboard_error: 'An error occurred while saving dashboard specification. Details were written to the console. ',
    save_short: 'Save',
    save_tooltip: 'Use Control-S to Save',
    undo: 'Undo',
    undo_tooltip: 'Undo all unsaved changes',
    clone: {
      title: 'Clone',
      text: 'Save cloned dashboard as...',
      button: 'Save',
    },
    add_text: 'Add Text',
    edit_specification: 'Edit Dashboard Specification',
    edit_item: 'Editing the visualization has failed. Please contact an Administrator for assistance.',
    not_admin: 'Not displaying Dashboard Settings as user is not a Dashboard Administrator.',
    not_editor: 'Not displaying Dashboard Save/Edit buttons as user is not a Dashboard Editor.',
    paste_json: 'Paste the JSON representation of the Dashboard Specification below',
    dashboard_filter: {
      filter_options: {
        filters: 'Filters (Geography, Other)',
        dates: 'Dates',
        display_by: 'Aggregate by',
      },
      config: {
        header: 'Use these settings to change the configuration users see in the dashboard filter panel',
        enabled_filter_panel: 'Filter Panel is Enabled.',
        disabled_filter_panel: 'Filter Panel is Disabled.',
        filter_options: {},
        date_picker_options: {
          CUSTOM: 'Custom',
          choose_years: 'Year Picker',
          choose_months: 'Month Picker',
          et_choose_years: 'Ethiopian Year Picker',
          et_choose_months: 'Ethiopian Month Picker',
        },
        showDashboardFilterButton: {
          label: 'Dashboard Filters',
          tooltip: 'Allow Dashboard filter dropdown to be visible to all users.',
        },
        datePickerType: {
          label: 'Date Selector Type',
          tooltip: 'Select the type of date picker you want in the dashboard filters.',
        },
        aggregationLevels: {
          label: 'Enabled Aggregation Levels',
          tooltip: 'Select the aggregation levels you want to be availible in the dashboard filters.',
          empty_display: 'Select Enabled Display by...',
        },
        enabledFilters: {
          label: 'Enabled Filters',
          tooltip: 'Select the metadata filters you want to be availible in the dashboard filters.',
          empty_display: 'Select Enabled Filters...',
        },
        filterPanelComponents: {
          label: 'Enabled Filter Panel Components',
          tooltip: 'Select the components you want availible in the dashboard filter dropdown',
          empty_display: 'Select Enabled Components...',
        },
        initialSelectedComponents: {
          label: 'Open Filter Panel Components',
          tooltip: 'Select the components you want open by default in the dashboard filters.',
          empty_display: 'Select Default Open Components...',
        },
        autoUpdateGranularity: {
          label: 'Automatically Update Granularity',
          tooltip: 'When a Filter is selected automatically have the aggregation be one level lower',
        },
      },
      button: 'Add Dashboard Filters',
      selection: 'Select Dashboard Filters...',
      warning: 'The initial filters on this form may not reflect the selections shown in dashboard below',
      dashboard_reset: 'Undo Changes',
      form_reset: 'Reset Form',
      submit: 'Update',
      ethiopian_date_label: 'Ethiopian Year (EFY)',
      date_label: 'Year',
      aqtBetaDisclaimer: 'This dashboard has some queries that were made using the Advanced Query Tool, which is still in beta. These dashboard-level filters will not work for those queries. You can recognize Advanced Queries by looking out for this icon:',
    },
    update_specification: 'Update Dashboard Specification',
    update_modal: {
      bad_json: 'The provided specification was not valid JSON. Additional details were written to the console.',
      invalid_spec: 'The specification had errors. They have been written to the console.',
      valid_spec: 'The specification was valid. Updating.',
    },
    dashboard_settings: {
      fetch_users_fail: 'Failed to fetch the list of users. Additional details were written to the console. ',
      fetch_current_users_fail: 'Failed to find the list of current users for the dashboard. ',
      title: 'Settings',
      users_tab: {
        title: 'Dashboard Users',
        additional_users: 'Users with sitewide viewer/editor/administrator permissions also have access to this Dashboard regardless of what permissions are set here.',
      },
      public_users_tab: {
        title: 'Public Access',
        public_access_warning: 'Public access is not enabled for this deployment and as a result, unregistered users will NOT have access regardless of whether it is enabled for a particular role or not.',
        allow_unregistered: 'Enable for unregistered users',
        subtitle: 'Use these settings to open your dashboard to all registered users.',
        subtitle_publisher: 'User these settings to open your dashboard to all registered users as well as the public (unregistered users).',
        fetch_public_users_fail: 'Failed to fetch the list of public users for this dashboard. ',
        update_public_users: 'Update Public Access',
      },
      filter_config_tab: {
        title: 'Filter configuration',
        update_filter_config: 'Update Filter Panel Configuation',
      },
      delete_dashboard: {
        title: 'Delete Dashboard',
        warning_label: 'Are you sure you wish to delete this entire dashboard permanently?',
      },
      settings_tab: {
        title: 'General Settings',
        subtitle: 'Use these settings to change how your visualization is displayed',
        title_section: {
          heading: 'Title',
        },
        official_section: {
          title: 'Official Dashboard',
          subtitle: 'Make Dashboard Official',
          tooltip: 'Set Dashboard as an Official Dashboard',
        },
      },
      update_specification_tab: {
        title: 'Edit Specification',
        update_dashboard_spec: 'Edit Dashboard Specification',
      },
      update_users: 'Update Users',
      update_settings: 'Update Settings',
      permission_update_success: 'Successfully updated users for the Dashboard',
      permission_updateError: 'Failed to update users for the Dashboard. Additional details were written to the console. ',
      fetch_resource_fail: 'An error ocurred while fetching dashboard details. ',
    },
  },
  query_form: {
    show_more_filters: 'Show more filters',
    show_fewer_filters: 'Show fewer filters',
    reset_form: 'Reset Form',
    sections: {
      primary_indicators: 'Datasets',
      filters: 'Filters',
      level_of_aggregation: 'Aggregation',
    },
    select_date: {
      start: {
        label: 'Start Date',
      },
      end: {
        label: 'End Date',
      },
      ethiopian_months: {
        full: {
          month_1: 'Meskerem',
          month_2: 'Tikemet',
          month_3: 'Hidar',
          month_4: 'Tahesas',
          month_5: 'Tir',
          month_6: 'Yekatit',
          month_7: 'Megabit',
          month_8: 'Miazia',
          month_9: 'Genbot',
          month_10: 'Sene',
          month_11: 'Hamle',
          month_12: 'Nehase',
          month_13: 'Pagume',
        },
        short: {
          month_1: 'Mes',
          month_2: 'Tik',
          month_3: 'Hid',
          month_4: 'Tah',
          month_5: 'Tir',
          month_6: 'Yek',
          month_7: 'Meg',
          month_8: 'Mia',
          month_9: 'Gen',
          month_10: 'Sen',
          month_11: 'Ham',
          month_12: 'Neh',
          month_13: 'Pag',
        },
        label: 'Custom Ethiopian months',
      },
      et_calendar_title: 'Ge’ez calendar',
      western_calendar_title: 'Western calendar',
      default_calendar_title: 'Calendar options',
    },
    select_relative_date: {
      label: 'Date Range',
    },
    selections: {
      search: 'Search...',
      data_non_selected_text: 'Click to select',
      title: 'Click to select',
      infoBox: {
        dataAvailable: 'available',
        dataPointsSuffix: 'data points',
        dataQuality: 'data quality',
      },
      all: {
        label: 'All Data',
      },
      healthIndicators: {
        label: 'Routine Data',
        label_sub: '',
        selected_label: 'Selected fields from Routine Data',
      },
      surveyData: {
        label: 'Survey Data',
        label_sub: '',
        selected_label: 'Selected fields from Survey Data',
      },
      supplyChainElements: {
        label: 'Supply Chain Data',
        label_sub: '',
        selected_label: 'Selected fields from Supply Chain Data',
      },
      targets: {
        label: 'Baselines, Performance, Targets',
        label_sub: '',
        selected_label: 'Selected fields from Baselines, Performance, Targets',
      },
      hmisAnddhis2s: {
        label: 'HMIS and DHIS2',
        label_sub: '',
        selected_label: 'Selected fields from HMIS and DHIS2',
      },
      dhis2Indicators: {
        label: 'DHIS2 Indicators',
        label_sub: '',
        selected_label: 'Selected fields from DHIS2 Indicators',
      },
      surveys: {
        label: 'Surveys',
        label_sub: '',
        selected_label: 'Selected fields from Surveys',
      },
      partners: {
        label: 'Resource Mapping and Partner Spending',
        label_sub: '',
        selected_label: 'Selected fields from Resource Mapping and Partner Spending',
      },
      eknMetrics: {
        label: 'Metrics',
        label_sub: '',
        selected_label: 'Selected Metrics',
      },
      dhis2DataElements: {
        label: 'DHIS2 Data Elements',
        label_sub: '',
        selected_label: 'Selected DHIS2 Data Elements',
      },
      dhisHmis2DataElements: {
        label: 'DHIS2 (HMIS) Data Elements',
        label_sub: '',
        selected_label: 'Selected DHIS2 (HMIS) Data Elements',
      },
      dhisHmisNew2DataElements: {
        label: 'DHIS2 (HMIS) (NEW) Data Elements',
        label_sub: '',
        selected_label: 'Selected DHIS2 (HMIS) (NEW) Data Elements',
      },
      dhisMrss2DataElements: {
        label: 'DHIS2 (MRRS) Data Elements',
        label_sub: '',
        selected_label: 'Selected DHIS2 (MRRS) Data Elements',
      },
      malariaScorecardIndicators: {
        label: 'DHIS2 (Malaria Scorecard) Indicators',
        label_sub: '',
        selected_label: 'Selected DHIS2 (Malaria Scorecard) Indicators',
      },
      dhis2SiscomDataElements: {
        label: 'DHIS2 (Siscom) Data Elements',
        label_sub: '',
        selected_label: 'Selected DHIS2 (Siscom) Data Elements',
      },
      dhis2IdsrDataElements: {
        label: 'DHIS2 (IDSR) Data Elements',
        label_sub: '',
        selected_label: 'Selected DHIS2 (IDSR) Data Elements',
      },
      hmisCalculatedIndicators: {
        label: 'DHIS2 (HMIS) Indicators',
        label_sub: '',
        selected_label: 'Selected DHIS2 (HMIS) Indicators',
      },
      siscomCalculatedIndicators: {
        label: 'DHIS2 (Siscom) Indicators',
        label_sub: '',
        selected_label: 'Selected DHIS2 (Siscom) Indicators',
      },
      customIndicators: {
        label: 'Custom Indicators',
        label_sub: '',
        selected_label: 'Selected Custom Indicators',
      },
      ywgs: {
        label: 'Young Women and Girls Indicators',
        label_sub: '',
        selected_label: 'Selected Young Women and Girls Indicators',
      },
      gbvs: {
        label: 'Gender-based violence Indicators',
        label_sub: '',
        selected_label: 'Selected Gender-based violence Indicators',
      },
      sexWorks: {
        label: 'Sex Work Indicators',
        label_sub: '',
        selected_label: 'Selected Sex Work Indicators',
      },
      wcdoh: {
        label: 'Legacy Data Indicators',
        label_sub: '',
        selected_label: 'Selected Legacy Data Indicators',
      },
      finances: {
        label: 'Sex Work Finance Indicators',
        label_sub: '',
        selected_label: 'Selected Sex Work Finance Indicators',
      },
      unileverIndicators: {
        label: 'Indicators',
        label_sub: '',
        selected_label: 'Selected Indicators',
      },
      vihaanIndicators: {
        label: 'Vihaan Data',
        label_sub: '',
        selected_label: 'Selected Vihaan Data Indicators',
      },
      nacoIndicators: {
        label: 'NACO MPR Data',
        label_sub: '',
        selected_label: 'Selected NACO MPR Data Indicators',
      },
      coreIndicators: {
        label: 'Core Indicator Data',
        label_sub: '',
        selected_label: 'Selected Core Indicators',
      },
      denominator: {
        label: 'Denominator',
        selected_label: 'Selected Denominator',
      },
      campaignIndicators: {
        label: 'Campaign Indicators',
        label_sub: '',
        selected_label: 'Selected Campaign Indicators',
      },
      macsIndicators: {
        label: 'MACS Indicators',
        label_sub: '',
        selected_label: 'Selected MACS Indicators',
      },
      elmisIndicators: {
        label: 'ELMIS Indicators',
        label_sub: '',
        selected_label: 'Selected ELMIS Indicators',
      },
      populationIndicators: {
        label: 'Population Indicators',
        label_sub: '',
        selected_label: 'Selected Population Indicators',
      },
    },
    filters: {
      apply_title: 'Apply',
      add_color_range: 'Add color range',
      add_rule: 'Add rule',
      cancel_title: 'Cancel',
      choose_option: '(choose option)',
      color: 'color',
      color_range_title: 'Color range',
      color_val_red: 'Red',
      color_val_orange: 'Orange',
      color_val_yellow: 'Yellow',
      color_val_pink: 'Pink',
      color_val_cyan: 'Cyan',
      color_val_blue: 'Blue',
      color_val_dark_blue: 'Dark blue',
      color_val_violet: 'Violet',
      color_val_dark_green: 'Dark green',
      color_val_green: 'Green',
      color_val_light_green: 'Light Green',
      custom_ranges: 'custom_ranges',
      filter_slice_data_title: 'Filter and Color',
      indicator_preset_filters_title: 'Color by range',
      label: 'Filters',
      placeholder_range_label: 'Range label',
      placeholder_range_min: 'Min',
      placeholder_range_max: 'Max',
      placeholder_enter_value: 'enter a value',
      preset_median: 'Medians (equal halves)',
      preset_tertiles: 'Tertiles (equal thirds)',
      preset_quartiles: 'Quartiles (equal quarters)',
      preset_quintiles: 'Quintiles (equal fifths)',
      preset_deciles: 'Deciles (equal tenths)',
      preset_ranges: 'preset ranges',
      remove: 'remove',
      remove_above: 'above',
      remove_above_average: 'above average',
      remove_below: 'below',
      remove_below_average: 'below average',
      remove_bottom: 'bottom',
      remove_color_range: 'Remove color range',
      remove_all_values_equal_zero_title: 'Remove values equal to zero',
      remove_all_values_below_title: 'Remove values below',
      remove_all_values_above_title: 'Remove values above',
      remove_values_equal_to_null: 'values equal to null',
      remove_false: 'False',
      remove_rule: 'Remove rule',
      remove_true: 'True',
      rule_title_initial: 'I want to...',
      rule_title: 'and...',
      remove_top: 'top',
      remove_values_equal_to_zero: 'values equal to zero',
      select_preset_filter_title: 'choose preset filter ranges',
      statistics_title: 'Statistics',
      statistics_mean_title: 'Mean',
      statistics_median_title: 'Median',
      statistics_standard_deviation_title: 'Standard deviation',
      statistics_variance_title: 'Variance',
      statistics_sum_title: 'Sum',
      statistics_minimum_title: 'Minimum',
      statistics_maximum_title: 'Maximum',
      statistics_num_non_zero_vals_title: 'Number of non-zero values',
      subtitle: 'Use these settings to remove or color values.',
    },
    button: {
      label: 'Analyze',
    },
    date_alert: {
      label: 'Please select a start date that comes before your end date.',
    },
    wizard: {
      select_indicator: 'Click here to select an indicator.',
    },
    annotations_panel: {
      title: 'Notes on your selections',
    },
  },
  geo_form: {
    sections: {
      metrics: 'Metrics',
      properties: 'Properties',
    },
    no_fields_warning: 'Please select some fields to query.',
  },
  geo_layer: {
    add: 'Add Layer',
  },
  layer_settings: {
    title: 'Layer Settings',
    subtitle: 'Display Options',
    settings_instructions: "Please see 'layer settings' for more display options",
    layer: {
      title_label: 'Title',
      shape_label: 'Shape',
      scale_label: 'Scale',
      primary_field: 'Primary Field',
      display_field: 'Display Field',
    },
    shapes: {
      circle: 'Circle',
      diamond: 'Diamond',
      triangle: 'Triangle',
      square: 'Square',
    },
    background_layer: 'Layer Options',
    background_options: {
      satellite: 'Satellite',
      street: 'Streets',
      light: 'Light',
      blank: 'Blank',
    },
    remove: 'Remove Layer',
    close: 'Close',
  },
  edit_panel: {
    title: 'Edit',
    updateButtonText: 'Update',
    closeButtonText: 'Close',
    changeVisualizationHeader: 'Change Visualization',
    editQueryHeader: 'Edit Query',
  },
  select_filter: {
    labels: {
      geography: 'Geography',
    },

    // Generic
    nation: 'Nation',
    all: 'All values',
    RegionName: 'Regions',
    DistrictName: 'District',
    FacilityName: 'Facility',

    // BR
    MunicipalityName: 'Municipality',
    CapitalName: 'Capital',
    StateName: 'State',
    state: 'State',
    capital: 'Capital',
  },
  select_date: {
    current_calendar_month: 'Current calendar month',
    current_quarter: 'Current quarter',
    previous_calendar_day: 'Previous calendar day',
    previous_calendar_week: 'Previous calendar week',
    previous_calendar_month: 'Previous calendar month',
    previous_quarter: 'Previous quarter',
    previous_calendar_year: 'Previous calendar year',
    current_fiscal_quarter: 'Current fiscal quarter',
    current_fiscal_year: 'Current fiscal year',
    previous_fiscal_quarter: 'Previous fiscal quarter',
    previous_fiscal_year: 'Previous fiscal year',
    last_365_days: 'Last 365 days',
    all_time: 'All time',
    forecast: 'Forecast',
    custom: 'Custom',
  },
  select_granularity: {
    label: 'Group results by',

    // Dimension ids.

    // Common
    nation: 'Nation',
    timestamp: 'Date',

    // Generic
    RegionName: 'Region',
    DistrictName: 'District',
    FacilityName: 'Facility',

    // BR
    capital: 'Capital',
    CapitalName: 'Capital',
    StateName: 'State',
    MunicipalityName: 'Municipality',
  },
  process_query: {
    save: 'Add to dashboard',
    remove: 'Remove from dashboard',
  },

  QueryApp: {
    CustomCalculationsButton: {
      label: 'Calculations',
    },
    CustomCalculationsModal: {
      apply: 'Create',
      edit: 'Save',
      cancel: 'Cancel',
      defaultCalculationNamePrefix: 'Calculation',
      emptyNameError: 'Custom calculations must have a name',
      emptyFormulaError: 'Custom calculations cannot be empty',
      existingNameError: 'This custom calculation already exists',
      invalidExpressionError: 'Custom calculations must be valid',
      title: 'Add Custom Calculation',
      subtitle: 'Create a new indicator using mathematical operations or custom logic. Your calculation will show up as a new series in your query results.',
      editTitle: 'Editing Custom Calculation',
      editTitlePrefix: 'Editing',
      editSubtitle: 'Edit an existing custom calculation which will update the calculated values in your query results.',
      FieldsPanel: {
        title: 'Fields and Calculations:',
        tooltip: 'Click on an indicator to add it to the formula. Or click on a custom calculation dropdown to see more options.',
      },
      FormulaPanel: {
        calculationTitle: 'Calculation Name:',
        formulaTitle: 'Formula:',
      },
      ValidityMessages: {
        validFormula: 'Valid',
        invalidSymbol: 'Invalid or missing symbol',
        unassignedVar: 'Unassigned variable',
        cannotEval: 'Cannot evaluate formula',
      },
      CustomFieldPanel: {
        addFormula: 'Add to formula',
        addExpandedCalculation: 'Add expanded calculation to formula >>',
        editFormula: 'Edit formula',
        deleteCalculation: 'Delete calculation',
        closePanel: 'Close panel',
      }
    },
    ExportButton: {
      title: 'Export',
      options: {
        all: 'Excel: all data',
        allWithConstituents: 'Excel: all data - with constituents',
        mappable: 'Excel: mappable data only',
        timeSeries: 'Excel: time series data',
        fieldMapping: 'Excel: field ID to data element name mapping',
        json: 'JSON: full data',
      },
      exportToJSON: {
        browserNotSupported: 'Sorry, your browser does not support this file download.',
      },
      successMessage: 'Data export download is complete. Check your Downloads folder.',
    },
    QueryResultContainer: {
      unknownError: 'An unexpected error occurred while updating your query result. Please try again.',
      unrecoverableError: 'Something went wrong and we are unable to show your query result. Please refresh the page and try again.',
    },
  },

  query_result: {
    common: {
      all: 'All',
      sort_label: 'Sort order:',
      addAlertButtonText: 'Add Alert',
      shareAnalysisButtonText: 'Share',
      ascending: 'Ascending',
      descending: 'Descending',
      alphabetical: 'Alphabetical',
      show: 'Show',
      results: 'results',
      settings: 'Settings',

      annotate: 'Annotate',
      download_query: {
        title: 'Download',
        downloadExcel: 'Download as Excel',
        image_tab: 'Image',
        data_tab: 'Data',
        dimensions: 'Dimensions',
        annotate: 'Have something to add?',
        options: {
          all: 'All data',
          allWithConstituents: 'All data - with constituents',
          timeSeries: 'Time series data',
          fieldMapping: 'Field ID to data element name mapping',
        }
      },
      download_as_image: {
        title: 'Download as image',
        success: 'Image download is complete. Check your Downloads folder.',
        options: {
          current: 'Current size',
          fullscreen: 'Fullscreen',
          widescreen: 'Widescreen',
        },
      },
      share_analysis: {
        title: 'Share via Email',
        titleToolTip: 'Send users your analysis via email directly from the platform itself',
        primaryButtonText: 'Send',
        sendTo: 'To:',
        sendToPlaceholder: 'Enter a recipient\'s email address',
        replyTo: 'Reply-to: ',
        replyToInfoTip: 'Users will reply to this email address',
        subjectText: 'Subject:',
        defaultSubject: 'Analysis Shared',
        subjectPlaceholder: 'Enter your subject',
        emailMessage: 'Message:',
        messageTemplate: 'Hi, \n\nPlease find an analysis I made in {PLATFORM_NAME} attached.\n\nThank you,\n{YOUR_NAME}',
        emailMessageToolTip: 'SENDER_NAME is an attribute that is filled with the user\'s profile name.',
        secondaryButtonText: 'Send Preview Email',
        attachDataText: 'Attach Data:',
        attachDataDropdownLabel: '0 selected',
        embedImageText: 'Embed image:',
        noUsersPlaceholder: 'No users matching this email in the directory list.',
        errors: {
          invalidEmail: 'is not a valid email address',
          shareFailureMessage: 'Analysis sharing did not happen successfully',
          emptyMessage: 'Please enter a message',
          emptySubject: 'Please enter a subject',
          emptyRecipient: 'Please enter a correct recipient email',
        },
        confirmationMessage: 'You are sending this analysis to a recipient who is not registered on the platform. External recipients are:',
        confirmationText: 'Please confirm you would like to proceed',
        confirmationModalText: 'Confirm Sharing',
      },
      download_as_pdf: 'Download as PDF',
      download_as_docx: 'Download as DOCX',
      download_as_pptx: 'Download as PPTX',
    },
    controls: {
      best_fit_line_label: 'Line of best fit',
      geography_options: 'Geography tile options',
      display_title: 'Display',
      divergent_coloration: 'Divergent Coloration',
      dropdown_first_yaxis: 'Y1-Axis:',
      dropdown_second_yaxis: 'Y2-Axis:',
      et_checkbox: 'Show Ethiopian Dates:',
      limit_results: 'Limit results:',
      log_checkbox: 'Logarithmic Scaling',
      invert_coloration: 'Invert Coloration',
      sort_label: 'Sort order:',
      sort_on: 'Sort by:',
      selected_field: 'Selected Field',
      stack_bars: 'Stack Series:',
      time_bucket_mean: 'Ave. Bucketed Values',
      y2_line_graph: 'Display Y2 as Line:',
      value_display_time_checkbox: 'Show Time on Y-Axis',
      value_display_checkbox: 'Show Values',
      bucket_by_time: 'Bucket by time',
      group_by: 'Group By:',
      date: 'Date',
      indicator: 'Indicator',
      selectIndicator: 'Select Indicator'
    },
    bar: {
      yaxis_title: 'Recorded number',
      sort_by_date: 'Date',
      remove_bar_spacing: 'Remove bar spacing:',
      date_label_format: 'Date format:',
      hide_grid_lines: 'Hide grid lines:',
      rotate_data_value_labels: 'Rotate data value labels:',
      rotate_x_axis_labels: 'Rotate X-Axis labels:',
      hide_data_value_zeros: 'Hide value labels equal to zero:',
      default_time_format: 'Default',
      no_data_to_zero_labels: 'Display \'No Data\' results as zero:',
    },
    bubblechart: {
      bubble_size: 'Bubble size',
      error_message: 'This view requires a combination of 2 or more fields selected.',
      none_option: 'None',
      show_legend: 'Show Legend',
      xAxis_title: 'X-axis',
      yAxis_title: 'Y-axis',
      zAxis_title: 'Bubble size',
    },
    heattiles: {
      yaxis_title: 'Recorded Date',
    },
    table: {
      difference_over_one_month: 'Difference over one month',
      difference_over_six_months: 'Difference over 6 months',
      difference_over_one_year: 'Difference over a year',
      numerals: 'Numeric values',
      invert_indicator_dropdown_title: 'Invert coloration of',
      scorecard: 'Scorecard',
      table: 'Table',
      table_display_dropdown_title: 'Table display',
      too_many_constituents_error: 'has too many constituents and could not be disaggregated',
    },
    time: {
      xaxis_title: 'Recorded date',
      yaxis_title: 'Recorded number',
      confidence_interval: 'Confidence interval',
      upper_bound: 'Upper bound (1σ)',
      lower_bound: 'Lower bound (1σ)',
      higher: 'higher',
      lower: 'lower',
      forecast_percent_diff_text: 'compared to the forecasted value',
      rotate_labels: 'Rotate labels',
      show_data_labels: 'Show data labels',
    },
    legend: {
      values: 'Values',
    },
    map: {
      color_map_toggle: 'Use preset filter colors',
      marker_scaled_toggle: 'Scaled markers',
      filter_map_bubbles: 'Search',
      display_option_dots: 'Dots',
      display_option_scaled_dots: 'Scaled dots',
      display_option_tiles: 'Colored tiles',
      disclaimer: {
        text: 'locations are not displayed due to lack of latitude/longitude coordinates.',
        geojson_text: 'Uncolored map areas are yet to be matched with database entries.',
        view_names: 'View Names',
        modal_title: 'Locations Missing Lat/Long Data',
        modal_close: 'Close',
      },
      layers: {
        Satellite: 'Satellite',
        Streets: 'Streets',
        Light: 'Light',
        Blank: 'Blank',
      },
      show_labels: 'Display Map Labels',
      timeline_animate_title: 'Show timeline',
      timeline_curr_date_selected: 'Data for selected date',
      tooltips: {
        background_opacity: 'Background opacity',
        background_color: 'Background color',
        font_color: 'Font Color',
        font_family: 'Font Type',
        font_size: 'Font Size',
        bold: 'Bold Text',
      },
      sidebar: {
        add_entities: 'Add entities',
        choose_data: 'Display',
        no_selections: 'No selection',
      },
    },
    save_query: {
      dash_name_invalid: 'Please enter a valid dashboard name',
      dropdown_default: 'Please select a dashboard',
    },
    sunburst: {
      error: 'Sorry, an error has occurred and we cannot render this visualization.',
      accounts_for: 'accounts for',
      of_total: 'of the total',
      which_is: 'which is',
    },

    BoxPlot: {
      BoxPlotTooltip: {
        valueLabel: 'Value',
      },
    },

    SaveQueryModal: {
      create: 'Create New Dashboard',
      creatingNewDashboard: 'Creating new dashboard...',
      defaultDropdownLabel: 'Select dashboard',
      newDashboardPrompt: 'What would you like to name your new dashboard?',
      selectDashboardPrompt: 'Please select a dashboard to add to:',
      save: 'Save',
      search: 'Search Dashboard Names',
      title: 'Add to Dashboard',

      confirmationTitle: 'Updating Dashboard',
      confirmationText: 'Your query is being saved to the dashboard',
      confirmationPrimaryButton: 'Continue working',
      confirmationSecondaryButton: 'Go to dashboard',
    },
  },
  dashboard: {
    hide_value_checkbox: 'Hide empty values',
    historical_labels: {
      month: 'Month',
      quarter: 'Quarter',
      ey: 'EY',
      year: 'Year',
      monthOfYear: '365 Days',
      quarterToDate: 'QTD',
      yearToDate: 'YTD',
    },
    performance_labels_for_geo: {
      RegionName: 'Region Performance',
      ZoneName: 'Zone Performance',
      WoredaName: 'Woreda Performance',
      FacilityName: 'Facility Performance',
    },
    ranked_lists: {
      best_title: 'Best Performing',
      worst_title: 'Worst Performing',
      combined_title: 'Performance Ranking',
    },
    geo_rank: {
      title: 'Rank',
      denominator_labels: {
        RegionName: 'regions',
        ZoneName: 'zones in region',
        WoredaName: 'woredas in zone',
        FacilityName: 'facilities in woreda',
      },
    },
    field_rank: {
      denominator_label: 'indicators in group',
    },
    program_area_label: 'Program Areas',
    DashboardItem: {
      addAlert: 'Add Alert',
      lock: 'Lock position',
      unlock: 'Unlock position',
      delete: 'Delete Chart',
      edit: 'Edit Chart',
      hideTextEdit: 'Hide Edit',
      showTextEdit: 'Edit Text',
      clone: 'Clone Chart',
      download: 'Download as Image',
      filter: 'Filter and Color Data',
      export: 'Export Data',
      calculations: 'Custom Calculations',
      settings: 'Settings',
      aqtBetaDisclaimer: 'This query was created using our Advanced Query Tool which is still in beta. Some dashboard features are not supported yet for this item.',
      textElementPlaceholder: 'Add text here',
    },
  },

  DashboardService: {
    duplicateNameError: 'Dashboard with name "%(dashboardName)s" already exists',
    createDashboardError: 'An error occurred during dashboard creation',
    saveQueryToDashboardError: 'An error occurred saving the query to the dashboard',
  },

  Navbar: {
    alerts: 'Alerts',
    analyze: 'Analyze',
    userManual: 'User Manual',
    createNewDashboard: 'Create',
    create: 'Create',
    createDashboardTitlePrompt: 'What would you like to name your new dashboard?',
    dashboardsDropdownLabel: 'Dashboards',
    lastDataRefresh: 'Last data refresh',
    buildVersion: 'Build version',
    loggedInAs: 'Logged in as',
    dataQuality: 'Data Quality',
    more: 'More',
    mobileForbiddenError: 'Sorry the page you are trying to visit is not available on mobile',
    offlineError: 'There is no Internet connection, please try reconnecting.',

    NavigationDropdown: {
      admin: 'Admin',
      'national-dashboard': 'National Dashboard',
      'facilities-map': 'Facilities Map',
      'data-status': 'Data Status',
      dataUpload: 'Upload Data',
      changelog: 'Changelog',
      'sign-out': 'Sign out',
      'sign-in': 'Sign in',
      'advanced-query': 'Advanced Analysis',
      userManual: 'User Manual',
      zenysisUpdates: 'What\'s New',
      useLocale: 'Use'
    },
  },

  UnauthorizedPage: {
    title: 'Unauthorized',
    mainText: 'You are not authorized to perform this action',
  },

  NotFoundPage: {
    title: 'Not Found',
    mainText: 'The page you are trying to access does not exist',
    correctUrlHint: 'Make sure that you typed the url correctly',
    defaultUrlHint: 'A correct default url is set in the Site Configuration tab of the',
    goHomeHint: 'Try visiting the ',
    homeLinkText: 'Home page',
    urlSettingsLinkText: 'Settings'
  },

  DataUploadApp: {
    selectFiles: 'Please select data files that you would like to queue for integration.',
    browseFiles: 'Browse for files',
    uploadProgress: 'Upload Progress:',
    successMessage: 'Success: Uploaded data is queued for integration.',
    failureMessage: 'Failure: Data did not upload successfully. Check your connection or consult a project manager for assistance.',
    dataNotAvailableYetMessage: 'Your data is not yet available in the platform.',
    waitForAnEngineerMessage: 'An engineer has been notified and will integrate the data shortly.',

    UploadDropdown: {
      dropdownLabels: {
        province: 'Province',
        dataCategory: 'Data Category',
      },
    },
  },

  CaseManagementApp: {
    AlertCaseCoreInfo: {
      alertExplanationSingleDate: '%(fieldName)s %(reason)s on %(date)s',
      alertExplanationDateRange: '%(fieldName)s %(reason)s for date period %(startDate)s to %(endDate)s',
    },

    CaseEvent: {
      alertEvent: {
        why: 'Why?',
        source: 'Source:',
        status: 'Status:',
      },
      externalAlertActivityEvent: {
        user: 'User:',
        source: 'Source:',
      },
    },

    OverviewPage: {
      dataset: 'dataset',
      any: 'Any',
      allCases: 'All Cases',
      loading: 'Loading...',
      name: 'Name',
      lastDataAvailable: 'Last Data Available',
      numRecentCasesMessage: '%(numCasesWithRecentData)s out of %(numCases)s %(caseLabel)s have data from the last',
      day: 'day',
      days: 'days',
      caseTypeToLookAt: 'I want to look at',
      datasetToLookAt: 'with data from',
      export: 'Export',

      AlertsSection: {
        AlertsDropdownUtil: {
          allStatuses: 'All Statuses',
          noStatusSelection: 'No Statuses Selected',
          status: {
            one: '%(count)s Status',
            other: '%(count)s Statuses',
          },
        },
        AlertsBlock: {
          loading: 'Loading...',
          heading: 'Alerts',
          export: 'Export',
          alertsFilename: 'alerts',
          exportColumns: {
            triggerDate: 'Alert Date',
            alertIndicator: 'Indicator',
            alertSource: 'Alert Source',
            condition: 'Alert Condition',
            location: 'Location',
            datePeriod: 'Period of Data Collection',
            reportedCases: 'Reported Cases',
            status: 'Status',
            dataset: 'Dataset',
          },
          alertsIdentified: 'Alerts identified',
          allIndicators: 'All Indicators',
          and: 'and',
          indicator: {
            one: '%(count)s Indicator',
            other: '%(count)s Indicators',
          },
          noIndicatorSelection: 'No Indicators Selected',
          with: 'with',
        },
        AlertsSummary: {
          heading: 'Alerts Summary',
          alertsIdentified: 'Alerts identified',
          with: 'with',
        },
      },

      AlertCard: {
        today: 'Today',
        why: 'Why?',
      },

      AlertDateFilter: {
        today: 'Today',
        yesterday: 'Yesterday',
        prev2Days: 'Previous 2 Days',
        thisWeek: 'This Week (Monday - Sunday)',
        allTime: 'All Time',
      },
    },

    CasePage: {
      loading: 'Loading...',
    },

    CaseDashboard: {
      overview: 'Overview',
    },

    CaseTimeline: {
      addEvent: 'Add Event',
      submit: 'Submit',
      eventName: 'Event Name',
      eventHistory: 'Event History',

      AlertEventDetailsModal: {
        primaryButtonText: 'Go to Alert',
      },

      BaseEventDetailsModal: {
        name: 'Name',
        date: 'Date',
        comments: 'Comments',
        description: 'Description',
      },

      EventHovercard: {
        date: 'Date:',
        comments: 'Comments:',
        description: 'Description:',
      },
    },

    Dossier: {
      name: 'Name',
      type: 'Type',
      editing: 'Editing:',
      edit: 'Edit',
      alertDatePeriod: 'Period of data collection',
      alertReason: 'Alert reason',
      alertReportedValue: 'Reported cases',
      alertSource: 'Alert source',
      alertTriggeredOn: 'Identified on',
    },

    QuickStats: {
      AlertCaseQuickStats: {
        noActionYet: 'No action has been taken yet',
        lastUpdate: 'Last update:',
        alertFrequencyLabel: 'This %(dimensionLabel)s has identified this same alert',
        pluralTimes: 'other times',
        firstAlert: 'This is the first time this %(dimensionLabel)s has identified this alert.',
        relatedAlerts: 'Related Alerts:',
        reportedCases: 'Reported cases',
        alertStatus: 'Alert status',
        onDate: 'On date',
      },

      DruidCaseQuickStats: {
        lastDataAvailable: 'Last data available:',
        lastDataSubmission: 'On last data submission:',
        noStatsAvailable: 'No stats available for this case.',
        yesterday: 'Yesterday:',
        today: 'Today:',
      },
    },
  },

  DataQualityApp: {
    indicator: "Indicator",
    selectIndicator: "Select Indicator",

    DataQualityCharacteristics: {
      reportingQualityOverview: 'Reporting Completeness & Timeliness Overview',
      subtitle: 'The overall score is based on the set of factors to its right. These inputs are informed by WHO\'s Data Quality Review framework and toolkit.' ,
      reportRange: 'Report Range',
      avgReportCadence: 'Avg Report Cadence',
      lastReported: 'Last Reported %(daysAgo)s days ago',
      completenessTrend: {
        title: 'Completeness Trend',
        positive: 'positive',
        negative: 'negative'
      }
    },
    DataQualitySummary: {
      beta: "beta",
      dateRange: "Date Range",
      geography: "Geography",
      noQualityScore: 'Could not compute a quality score for this indicator due to lack of data.',
      qualityScore: 'Quality Score',
    },
    NumberReportsTimeSeries: {
      header: 'Reporting Trends Over Time',
      subtitle: 'This chart shows the number of reports received by date. You can observe the timing, consistency and trend of the total number of reports over time using this chart.',
      title: 'Total Number of Reports Received by Date',
      LineGraph: {
        Tooltip: {
          reports: 'Reports Received',
          date: 'Date'
        }
      },
    },
    DataQualityLocationTable: {
      title: 'Reporting Locations',
      yes: 'Yes',
      no: 'No',
      header: {
        reported60days: 'Reported 60 days',
        reported30days: 'Reported 30 days',
        daysSince: 'Days since',
        lastReport: 'Last Report',
        numReports: 'Num reports',
      }
    }
  },

  visualizations: {
    BumpChart: {
      BumpChartControlsBlock: {
        theme: 'Theme',
      },
    },
    Table: {
      notANumber: 'Not a Number',
      unavailable: '',
      TableControlsBlock: {
        header: 'Header',
        row: 'Rows',
        footer: 'Footer',
        label: {
          familyControl: 'Font Type',
          sizeControl: 'Font Size',
          colorControl: 'Font Color',
          backgroundControl: 'Background Color',
          alternateBackgroundControl: 'Alternating Background Color',
          borderControl: 'Border Color',
        },
        enablePagination: 'Paginate results',
        invertColoration: 'Invert coloration',
        scorecard: 'Scorecard',
        table: 'Table',
        tableFormat: 'Table type',
      },
    },
    common: {
      noData: 'No data',
      SettingsModal: {
        title: 'Settings',
        AxesSettingsTab: {
          goalLineValue: 'Goal Line Value:',
          goalLineLabel: 'Goal Line Label:',
          goalLineFontSize: 'Goal Line Font Size:',
          goalLineColor: 'Goal Line Color:',
          goalLineThickness: 'Goal Line Thickness:',
          goalLineStyle: 'Goal Line Style:',
          goalLineStyleSolid: 'Solid',
          goalLineStyleDashed: 'Dashed',
          xAxis: {
            title: 'X-Axis',
            labels: {
              title: 'Title:',
              titleFontSize: 'Title font size:',
              labelsFontSize: 'Labels font size:',
              titleFontColor: 'Title font color:',
              labelsFontColor: 'Labels font color:',
              labelsFontFamily: 'Labels font:',
              titleFontFamily: 'Title font:',
              additionalAxisTitleDistance: 'Axis title padding:',
            },
          },
          y1Axis: {
            title: 'Y1-Axis',
            labels: {
              title: 'Title:',
              titleFontSize: 'Title font size:',
              labelsFontSize: 'Labels font size:',
              titleFontColor: 'Title font color:',
              labelsFontColor: 'Labels font color:',
              labelsFontFamily: 'Labels font:',
              titleFontFamily: 'Title font:',
              rangeFrom: 'Range:',
              rangeTo: 'to',
            },
          },
          y2Axis: {
            title: 'Y2-Axis',
            labels: {
              title: 'Title:',
              titleFontSize: 'Title font size:',
              labelsFontSize: 'Labels font size:',
              titleFontColor: 'Title font color:',
              labelsFontColor: 'Labels font color:',
              labelsFontFamily: 'Labels font:',
              titleFontFamily: 'Title font:',
              rangeFrom: 'Range:',
              rangeTo: 'to',
            },
          },
        },
        GeneralSettingsTab: {
          None: 'None',
          Day: 'Day',
          Week: 'Week',
          Month: 'Month',
          Quarter: 'Quarter',
          Halfyear: 'Half year',
          Year: 'Year',
          FiscalQuarter: 'Fiscal Quarter',
          FiscalYear: 'Fiscal Year',
          displayOptionsHeader: 'Display options',
          TitleBlock: {
            heading: 'Title',
            labels: {
              titleFontSize: 'Title font size:',
              subtitleFontSize: 'Subtitle font size:',
              title: 'Title',
              subtitle: 'Subtitle',
              titleFontColor: 'Title font color:',
              titleFontFamily: 'Title font:',
            },
          },
        },
        SeriesSettingsTab: {
          reorderBarsInstructions: 'Click the up/down arrows to change the order of the bars/columns.',
          tableHeaders: {
            seriesLabel: 'Series label',
            dataLabelFormat: 'Value display format',
            dataLabelFontSize: 'Value font size',
            yAxis: 'Y-Axis',
            color: 'Color',
            showConstituents: 'Show Constituents',
            showSeriesValue: 'Show value',
          },
        },
        LegendSettingsTab: {
          showLegend: 'Show legend:',
          title: 'Legend Settings',
          overlapLegendWithChart: 'Overlap legend with chart:',
          legendFontSize: 'Legend font size:',
          legendPlacement: 'Legend placement:',
          legendPlacements: {
            top: 'Top',
            topRight: 'Top Right',
            left: 'Left',
            right: 'Right',
            bottom: 'Bottom',
          },
        },

        close: 'Close',
        tabs: {
          general: 'General',
          generalHelpText: 'Use these settings to change how your visualization is displayed',
          axes: 'Axes',
          axesHelpText: 'Use these settings to change axes labels, font sizes, and ranges',
          series: 'Series',
          seriesHelpText: 'Customize how your selected indicators are displayed',
          legend: 'Legend',
          legendHelpText: 'Customize how your legend is displayed',
        },
      },
      warnings: {
        emptyFields: 'This query returned no data for these fields: ',
        server: 'Something went wrong while running the query. Please try again shortly.',
      },
    },
    labels: {
      chart: 'Chart',
      time: 'Time',
      table: 'Table',
      scorecard: 'Scorecard',
      map: 'Map',
      animated_map: 'Animated Map',
      heatmap: 'Heatmap',
      heat_tiles: 'Heat Tiles',
      scatterplot: 'Scatterplot',
      sunburst: 'Sunburst',
      expando: 'Hierarchy',
      box_plot: 'Box Plot',
      bump_chart: 'Ranking',
      quality: 'Quality',
    },
  },
  login: {
    modal_title: 'Note',
    registration_title: 'Request Access',
    content_l1: 'To submit feedback about EHDAP or request an account for access, please click Continue below.',
    content_l2: "Note that at this time accounts are only being granted to the users as per the ministry's approval.",
    content_l3: 'Please make sure that you get the approval from the ministry before you submit a request.',
    continue_btn: 'Continue',
    cancel_btn: 'Cancel',
  },

  alertsApp: {
    alertDefinitions: {
      equalTo: 'Equal to: ',
      greaterThan: 'Greater than: ',
      lessThan: 'Less than: ',
    },
    alertDefTab: {
      tableHeaders: {
        fieldName: 'Field',
        dimension: 'Dimension',
        timeGranularity: 'Time Duration',
        checks: 'Trigger',
      },
      noData: 'There are no Alert Definitions',
      primaryDeleteModalBtn: 'Delete Alert',
      deleteConfirmationText: 'Delete this alert?',
      day: 'Day',
      month: 'Month',
      week: 'Week',
    },
    alertNotifTab: {
      tableHeaders: {
        fieldName: 'Field',
        dimensionValue: 'Dimension Value',
        reportedValue: 'Reported Value',
        alertRule: 'Trigger',
        queryInterval: 'Query Interval',
      },
      noData: 'There are no Alert Notifications',
    },
    tabs: {
      alertDefs: 'Alert Definitions',
      alertNotifs: 'Alert Notifications',
    },
    composeAlertPane: {
      checkOptions: {
        equalTo: 'Equal to',
        greaterThan: 'Greater than',
        lessThan: 'Less than',
      },
      createModal: {
        title: 'Create Alert',
        buttonText: 'Submit',
      },
      editModal: {
        title: 'Edit Alert',
        buttonText: 'Submit',
      },
      errors: {
        indicator: 'Please select an indicator',
        threshold: 'Please enter a numeric threshold value',
      },
      timeSelection: {
        day: 'Day (Includes 5 days prior)',
        month: 'Month',
        week: 'Week (Monday to Sunday)',
        title: 'Time Bucket',
      },
      triggerSelectionTitle: 'Trigger Conditions',
      initialThresholdText: 'Threshold Value',
      createAlertButtonText: 'Create Alert',
      indicatorSelectionTitle: 'Select Indicator',
      toasts: {
        createSuccess: 'Successfully created Alert',
        deleteSuccess: 'Successfully deleted Alert',
        editSuccess: 'Successfully edited Alert',
      },
    },
  },

  models: {
    core: {
      Calculation: {
        AverageCalculation: {
          description: 'Find the average value of the data points reported.',
          displayName: 'Average',
        },

        // NOTE(stephen): ComplexCalculation is a kitchen-sink calculation type
        // for all calculations that cannot be easily calculated. It will be
        // expanded in the future.
        ComplexCalculation: {
          description: 'Compute the value of the complex data type.',
          displayName: 'Complex',
        },
        CountCalculation: {
          description: 'Count the number of data points reported.',
          displayName: 'Count',
        },
        CountDistinctCalculation: {
          description: 'Count the unique number of dimension values.',
          displayName: 'Count Distinct',
        },
        MaxCalculation: {
          description: 'Find the largest single data point reported.',
          displayName: 'Max',
        },
        MinCalculation: {
          description: 'Find the smallest single data point reported.',
          displayName: 'Min',
        },
        SumCalculation: {
          description: 'Sum the data points reported.',
          displayName: 'Sum',
        },
      },

      QueryResultSpec: {
        ValueRule: {
          values: 'Values',
          IsFalseRule: {
            ruleString: 'Values are False (= 0)',
          },
          IsTrueRule: {
            ruleString: 'Values are True (> 0)',
          },
        },
      },
    },
  },
  services: {
    SessionSyncService: {
      sessionsUnsupported: 'Your browser does not support persisting query sessions. Refreshing your browser will reset your queries.',
    },
  },
};

/* eslint-enable max-len */
