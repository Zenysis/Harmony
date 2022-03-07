// TODO(pablo): change this file to use ES6 imports, not require/module.exports
// TODO(pablo): change this file to use PascalCased paths that match the React
// hierarchy
/* eslint-disable max-len */
/* prettier-ignore */

// NOTE(david): Disabling these lint rules as there are thousands of errors and
// this is a legacy file so it's not worth fixing.
/* eslint-disable sort-keys */
/* eslint-disable sort-keys-shorthand/sort-keys-shorthand */

module.exports = {
  admin_app: {
    AdminAppActionCard: {
      siteAdminTitleTooltip: 'This role cannot be modified or deleted',
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
        keep_me_signed_in: 'Automatic Sign Out Setting',
        enable_case_management: 'Enable Case Management',
        case_management_app_name: 'Name',
        case_management_home_page_dashboard: 'Case Management Home Page Dashboard',
      },
      helpText: {
        public_access: 'Indicates whether or not public user support is enabled. When enabled, unregistered users will be able to access the site as well.',
        crisp_id: 'A unique identifier that Crisp uses to resolve a chat session to an individual domain.',
        crisp_enabled: 'Indicates whether or not Crisp chat is enabled.',
        default_url: 'This setting dictates which page the user will be redirected to upon logging in/accessing the index page.',
        project_manager_ids: '',
        cur_datasource: 'This setting allows user to select which datasource models will use.',
        keep_me_signed_in: 'This setting dictates whether or not users will be automatically signed out after 30 minutes of inactivity by default. Users will still be able to select the \'Keep me signed in\' check box to avoid being automatically signed out.',
        enable_case_management: 'This setting dictates whether or not the Case Management App is enabled',
        case_management_app_name: 'The case management app name to show in the navbar',
        case_management_home_page_dashboard: 'The dashboard to optionally use as the case management home page',
      },
      warningText: {
        public_access: 'By changing the value of this checkbox, you will allow or prevent unregistered users from running queries on the site and viewing Dashboards.',
        cur_datasource: 'By changing the datasource, the server will have to restart. Are you certain you wish to proceed?'
      },
      resetValue: 'Reset to default',
      keepMeSignedInLabel: 'Automatically sign out users after 30 minutes of inactivity by default',
      caseManagementBlockTitle: 'Case management configuration',
      enableCaseManagementLabel: 'Enable case management',
      resetCaseManagement: 'Are you sure you want to reset all case management configurations back to their default values?',
      updateError:
        'There was an error updating settings. Contact an Administrator for assistance. ',
      valueSuccessfullyReset: 'The configuration setting has been reset to its default value.',
      resetModal: {
        title: 'Reset Configuration',
        primaryButtonText: 'Reset',
        resetWarningFormat: "Are you certain you wish to reset the configuration for '%(key)s'? The value will be reset to '%(defaultValue)s'.",
      },
    },
    constants: {
      alertAdmin: 'Alert Admin',
      alertEditor: 'Alert Editor',
      alertRequireInvite: 'Require invite to view, edit or admin individual alerts',
      alertViewer: 'Alert Viewer',
      dashboardAdmin: 'Dashboard Admin',
      dashboardEditor: 'Dashboard Editor',
      dashboardRequireInvite: 'Require invite to view, edit or admin individual dashboards',
      dashboardViewer: 'Dashboard Viewer',
    },
    deleteUserModal: {
      alerts: 'Alerts',
      dashboards: 'Dashboards',
      deleteWithoutTransfer: 'Force Delete',
      deleteWithTransfer: 'Transfer and Delete',
      takeOwnershipMessage: 'Take ownership of the following resources:',
      title: 'Delete User',
    },
    GroupsTab: {
      searchPlaceholder: 'Search group by name',
      createGroup: 'Create group',
      emptyStateTitle: 'No groups yet',
      emptyStateSubtitle: 'Seems like no one has created any groups',
      emptyStateDescription: 'Create your first group to efficiently manage access to platform resource for groups of users',
      createTooltip: 'Groups make it easy to manage the access rights for many users at a time. All users in a group will get access to all of the roles, dashboards and alerts that are assigned to the group.',

      GroupViewModal: {
        editGroup: 'Edit group',
        createGroup: 'Create group',
        save: 'Save',
        groupDetails: 'Group Details',
        users: 'Users',
        roles: 'Roles',
        dashboardAndAlerts: 'Dashboards & Alerts',
        dashboard: 'Dashboards',
        noEmptyName: 'Cannot add or update group without a name.',
        yesButtonText: 'Yes',
        noButtonText: 'No',
        confirmationModalDescription: 'Closing this will remove any unsaved changes. Do you wish to proceed?',
        confirmationModalTitle: 'Discard changes',

        GroupDetailsTab: {
          name: 'Name',
          summaryHeader: 'Summary of access',
          summaryDescription: 'The disaggregated platform access for this group.',
          tools: 'Tools',
          itemAccess: 'Item Access',
          sitewideAccess: 'Sitewide Item Access',
          dashboardCreator: 'Dashboard',
          alertsApp: 'Alert',
          caseManagementApp: 'Case management',
          dataQualityLab: 'Data quality',
          analyzeTool: 'Analyze',
          dashboards: 'dashboards',
          alerts: 'alerts',
          totalMembers: {
            zero:  'No members',
            one:   '%(count)s total member',
            other: '%(count)s total members'
          },
          edit: 'Edit',
          view: 'View',
          admin: 'Admin',
        },

        UsersTab: {
          users: 'Users',
          addUsers: '+ Add Users',
          editUser: 'Edit User',
          removeUser: 'Remove User',
        },

        RolesTab: {
          roles: 'Roles',
          addRoles: '+ Add Roles',
          removeRole: 'Remove Role',
          editRole: 'Edit Role',
          totalMembers: {
            zero:  'No members',
            one:   '%(count)s member',
            other: '%(count)s members'
          }
        },

        DashboardAndAlertsTab: {
          dashboards: 'Dashboards',
          alerts: 'Alerts',
          addDashboards: '+ Add Dashboards',
          addAlerts: '+ Add Alerts',
          removeDashboard: 'Remove dashboard',
          removeAlert: 'Remove alert',
          view: 'View',
          edit: 'Edit',
          admin: 'Admin',
          name: 'Name',
          views: 'Views',
          lastUpdate: 'Last Update',
          accessControl: 'Access Control',
          menu: 'Menu',
          dateCreated: 'Date Created',
          dimension: 'Dimension',
          duration: 'Duration',
        }
      },
    },
    inviteUserBlock: {
      emailPlaceholder: 'Enter email',
      namePlaceholder: 'Enter name',
      inviteUserButton: 'Invite User',
      inviteSendingInProgress: 'Sending...',
      inviteUserFail: 'Could not invite user.',
      inviteUserSuccess: 'Successfully invited user.',
      userAlreadyExistsError: 'Could not invite user because user already exists.',
    },
    status_dropdown_default: 'All Users',
    users: {
      updateUserSuccess: 'User profile was successfully updated.',
      updateUserFail: 'There was an error updating the user profile. Additional details were written to the console.',
      deleteUserSuccess: 'The user was successfully deleted',
      deleteUserFail: 'There was an error deleting the user. Additional details were written to the console.',
      resendInviteSuccess: 'Successfully resent an invitation e-mail to the user.',
      resendInviteFail: 'There was an error resending the user an invitation.  Additional details were written to the console.',
      resetPasswordSuccess: 'An email has been sent to reset the password',
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
    UsersTab: {
      UserList: {
        deleteUserFail: 'There was an error deleting the user.',
        deleteUserSuccess: 'The user was successfully deleted',
        email: 'Email',
        groups: 'Groups',
        name: 'Name',
        resendInviteSuccess: 'Successfully resent an inivtation e-mail to the user.',
        resendInviteFail: 'There was an error resending the user an invitation.',
        resetPasswordSuccess: 'Sucessfully reset the user\'s password.',
        resetPasswordFail: 'There was an error resetting the user\'s password.',
        roles: 'Roles',
        status: 'Status',
        userDeletionConfirmModalTitle: 'Delete User',
        userDeletionConfirmModalPrompt: 'Are you sure you want to permanently delete this user?',
      },
      UserListOptions: {
        deleteUser: 'Delete User',
        editUser: 'Edit User',
        resetPassword: 'Reset Password',
      },
      UserViewModal: {
        noButtonText: 'No',
        yesButtonText: 'Yes',
        confirmationModalDescription: 'Closing this will remove any unsaved changes. Do you wish to proceed?',
        confirmationModalTitle: 'Discard changes',

        AccessLevelTabs: {
          groupAccess: 'Group Access',
          userAccess: 'Direct Access',
        },
        DashboardAndAlertsTab: {
          accessControl: 'Access Control',
          accessGrantedHeader: 'Access Granted',
          accessThrough: 'Added Through',
          addAlerts: '+ Add New Alerts',
          addDashboards: '+ Add New Dashboards',
          alertTitle: 'Alerts',
          dashboardName: 'Name',
          dashboardTitle: 'Dashboards',
          disableAlertDropdownTooltip: '%(username)s has access to this alert through the %(groupName)s group. To change, you will have to modify access from %(groupName)s',
          disableDashboardDropdownTooltip: '%(username)s has access to this dashboard through the %(groupName)s group. To change, you will have to modify access from %(groupName)s',
          disableAlertRemovalTooltip: '%(username)s has access to this alert through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
          disableDashboardRemovalTooltip: '%(username)s has access to this dashboard through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
        },
        RolesAndGroupsTab: {
          accessGrantedHeader: 'Access Granted',
          accessThrough: 'Added Through',
          addRoles: '+ Add Roles',
          addGroups: '+ Add Groups',
          disableRoleRemovalTooltip: '%(username)s has access to this role through the %(groupName)s group. To delete, you will have to remove %(username)s from %(groupName)s',
          groupRoles: 'Group Access',
          groupTitle: 'Groups',
          roleTitle: 'Roles',
          roleSearchPlaceholder: 'Search for roles',
          userRoleTableHeaderGroupName: 'Group',
          userRoleTableHeaderRoleName: 'Role',
          userRoleTableHeaderGroupRoleName: 'Role',
        },
        UserDetailsTab: {
          activeStatus: 'Active',
          email: 'Email',
          firstName: 'First Name',
          inactiveStatus: 'Inactive',
          lastName: 'Last Name',
          passwordHeading: 'Password',
          pendingStatus: 'Pending',
          phoneNumber: 'Phone Number',
          profileDetails: 'Profile Details',
          resendInviteText: 'Resend Invite',
          status: 'Status',
          passwordStaticText: 'User can\'t remember their password?',
          passwordButtonText: 'Send password reset via email',
        },
        dashboardAndAlertsTabName: 'Dashboards & Alerts',
        primaryAction: 'Save',
        rolesAndGroupsTabName: 'Roles & Groups',
        title: 'Edit User',
        updateUserSuccess: 'User successfully updated',
        updateUserFailure: 'There was a problem updating this user',
        userDetailsTabName: 'Profile Details',
        dashboardTabName: 'Dashboards',
      },
      addUserButton: 'Add User',
      updateUserSuccess: 'User profile was successfully updated.',
      updateUserFail: 'There was an error updating the user profile. Additional details were written to the console. ',
      deleteUserSuccess: 'The user was successfully deleted',
      deleteUserFail: 'There was an error deleting the user. Additional details were written to the console.',
      resetPasswordSuccess: 'Sucessfully reset the user\'s password.',
      resetPasswordFail: 'There was an error resetting the user\'s password. Additional details were written to the console.',
      searchPlaceholder: 'Search for users',
    },
    RoleViewModal: {
      admin: 'Admin',
      analyzeTool: 'Analyze',
      caseManagementApp: 'Case management',
      dataQualityLab: 'Data quality',
      selectDataSources: 'Select data sources',
      selectGeographies: 'Select geographies',
      selectSubrecipients: 'Select subrecipients',
      allDataSources: 'Allow access to all data sources',
      allGeographies: 'Allow access to all geographies',
      allSubrecipients: 'Allow access to all subrecipients',
      selectSpecificDataSources: 'Select specific data sources',
      selectSpecificGeographies: 'Select specific geographies',
      selectSpecificSubrecipients: 'Select specific subreceipients',
      dashboardRequireInvite: 'Require invite to view, edit or admin individual dashboards',
      dashboardViewer: 'Allowed to view all dashboards',
      dashboardEditor: 'Allowed to edit all dashboards',
      dashboardAdmin: 'Allowed to administrate all dashboards',
      alertRequireInvite: 'Require invite to view, edit or admin individual alerts',
      alertViewer: 'Allowed to view all alerts',
      alertEditor: 'Allowed to edit all alerts',
      alertAdmin: 'Allowed to administrate all alerts',
    },
    RoleManagement: {
      createRole: 'Create role',
      searchPlaceholder: 'Search role by name',
      createTooltip: 'Roles specify which platform tools and data access are granted when assigned to a user or group. Roles are additive meaning if you assign multiple, the assignee will gain access to the tools and data specified in each of the assigned roles.',
    },
    RoleCard: {
      tools: 'Tools',
      siteWideAccess: 'Sitewide Item Access',
      dashboards: 'Dashboards',
      dashboardCreator: 'Dashboard',
      alertsApp: 'Alerts',
      caseManagementApp: 'Case management',
      dataQualityLab: 'Data quality',
      analyzeTool: 'Analyze',
      view: 'View',
      edit: 'Edit',
      admin: 'Admin',
      noTools: 'No tools added to this role',
      editRole: 'Edit Role',
      deleteRole: 'Delete Role',
      editUsers: 'Edit Users',
      deleteRoleWarningMessage: 'Are you sure you want to permanently delete this role?',
    },
    GroupCard: {
      noRoles: 'No roles added to this group',
      roles: 'Roles',
      totalMembers: 'total members',
      dashboards: 'dashboards',
      alerts: 'alerts',
      addUsers: 'Add Users',
      editGroup: 'Edit Group',
      deleteGroup: 'Delete Group',
      deleteGroupWarningMessage: 'Are you sure you want to permanently delete this group?',
    },
    BaseAccessSelectionView: {
      back: 'BACK',
      selectAll: 'All',
      save: 'Save',
    },
    AccessSelectionView: {
      AddGroupView: {
        addGroups: 'Add Groups',
        description: 'Users will gain access to all associated roles and tools',
        groupName: 'Name',
        memberCount: 'Member Count',
        totalMembers: {
          zero:  'No members',
          one:   '%(count)s total member',
          other: '%(count)s total members'
        }
      },
      AddRoleView: {
        addRoles: 'Add Roles',
        description: 'Users will gain access to all associated tools, data access & system access',
        memberCount: 'Member Count',
        name: 'Name',
        totalMembers: {
          zero:  'No members',
          one:   '%(count)s total member',
          other: '%(count)s total members'
        }
      },
      AddUserView: {
        addUsers: 'Add Users',
        description: 'User will gain access to all associated tools, data access & system access',
        name: 'Name',
        email: 'Email',
        roles: 'Roles',
        groups: 'Groups',
        status: 'Status',
      },
      AddDashboardView: {
        addDashboards: 'Add Dashboards',
        description: 'User will gain access to all selected dashboards and the chosen level of access',
        views: 'Views',
        dateCreated: 'Date Created',
        accessControl: 'Access Control',
        name: 'Name',
      },
      AddAlertView: {
        addAlerts: 'Add Alerts',
        description: 'User will gain access to all selected alerts and the chosen level of access',
        name: 'Name',
        dimension: 'Dimension',
        duration: 'Duration',
        accessControl: 'Access Control',
      }
    },
    DeleteConfirmationModal: {
      cancel: 'Cancel',
      delete: 'Delete',
    },
    disaggregateQueryPolicies: {
      dimensionCount: {
        one: '1 %(dimensionName)s',
        other: '%(num)s %(dimensionName)ss'
      },
      geographyCount: {
        one: '1 geography',
        other: '%(num)s geographies'
      },
      numDataSources: '%(num)s data sources',
      datasourceCount: {
        one: '1 data source',
        other: '%(num)s data sources',
      },
    },
  },

  AdvancedQueryApp: {
    allQueriesDeserializationError: 'Problem loading all queries. Resetting tabs',
    copiedQueryTabName: 'Copy from %(username)s',
    copiedQueryTabNameWithCount: 'Copy %(num)s from %(username)s',
    errorFetchingSharedQuery:'Link was not valid. Please ensure it was correct',
    queryDeserializationError: 'Problem loading query',
    tabNameNotFound: 'Tab Error',
    unknownError: 'An unexpected error occurred while updating your query result. Please try again.',
    unrecoverableError: 'Something went wrong and we are unable to show your query result. Please refresh the page and try again.',
    QueryFormPanel: {
      dateRangeFilter: {
        toastError: 'Invalid date range selected',
        consoleError: 'End Date: %(endDate)s before Start Date: %(startDate)s',
      },
      noFieldsSelected: 'Please select an indicator to view Quality score and details',
      noInsights: 'No insights to show',
      titleQueryBuilder: 'Build Query',
      titleInsights: 'Insights',
      titleQuality: 'Quality',
      Insights: {
        AnalyticalSection: {
          expandButtonText: 'Expand to see all insights and actions',
          title: 'Analytics',
          toolTip: 'This section is intended to help you understand the queried data and uncover analytical insights. The data overview displays key characteristics for the queried data, including the number of data points, mean, mode and more. Below that are potential insights and actions for you to assess - these could include geographic or seasonal concentrations, and more will be added over time.',
          dataProfile: 'Data profile',
          dataProfileInfo: 'High level overview of query results for the selected indicator.',
          insightFound: 'Insight Found',
          insightsFound: 'Insights Found',
          dateRange: 'date range of data',
          numRows: 'Number of rows',
          stdDev: 'standard deviation',
          to: 'to',
          yoy: 'YoY change in mean',
          tooFewResults: 'There are too few query results for the selected indicator to generate a data profile.',
          viewAllResults: 'You can view all results for this indicator on the table visualization or try adjusting your aggregation and/or filters to see a data profile here.',
          correlationInsight: {
            badSummary: 'The insight had errors, additional details were written to the console.',
            changeVisualization: "View on Scatterplot",
            summary: '%(strength)s %(sign)s correlation (R²=%(coef)s) was found with the %(indicator)s indicator.',
            title: '%(strength)s %(sign)s correlation found',
            negative: 'negative',
            positive: 'positive',
            strong: 'Strong',
            medium: 'Medium',
            weak: 'Weak',
          },
          geographicalInsight: {
            strong: 'strong',
            medium: 'medium',
            weak: 'weak',
            viewColoredTilesMap: 'View on Map',
            viewHeatMap: 'View on Heatmap',
            summary: 'It looks like there is a %(strength)s concentration of %(indicator)s in %(area)s.',
            areas: '%(areas)s and %(lastArea)s',
            title: 'Geographic Concentration Found',
            inRange: '%(above)s < Values <= %(below)s (%(std1)s-%(std2)s stdev from mean)',
            aboveRange: 'Values > %(above)s (%(std)s+ stdevs from mean)',
          },
          timeInsight: {
            strong: 'strong',
            medium: 'medium',
            weak: 'weak',
            viewHeatTiles: 'View on Heat Tiles',
            viewTimeSeries: 'View on Time Series',
            title: 'Time Concentration Found',
            summary: 'It looks like there is a %(strength)s concentration of %(indicator)s during %(maxTime)s.',
          },
          DataProfile: {
            count: 'Count',
            firstQuartile: 'First Quartile',
            max: 'Max',
            mean: 'Mean',
            median: 'Median',
            min: 'Min',
            thirdQuartile: 'Third Quartile',
          },
        },
        FieldSelector: {
          label: 'Selected Indicator',
        },
        DataQualitySection: {
          expandButtonText: 'Expand to see more details and actions',
          title: 'Data Quality',
          insightFound: 'factor affecting the score',
          insightsFound: 'factors affecting the score',
          OverallScoreCard: {
            title: 'Quality Score',
            beta: 'beta',
          },
          toolTip: 'This section and quality score aim to quantify the reporting and data quality for this indicator based on the factors detailed within. It should not be taken as an authoritative score on its own but a low score is worth investigating to ensure it does not significantly impact the results of your analysis. You can expand this section and click through to the full data quality tool to investigate.',
        },
      },
      QueryBuilder: {
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
          removeUnsupported: 'Remove unsupported dimensions',
        },
        GroupByCustomizationModule: {
          dimensionTotalTooltip: 'This option adds a total row across all values for this group by. If more than one group by is selected, the total row will be added for each section within the parent group.',
          includeNull: 'Include empty values',
          includeTotal: 'Include total values',
          label: 'Label:',
        },
        IndicatorCustomizationModule: {
          aboutTabTitle: 'About',
          addConstituentsBtn: 'Add Constituents',
          copyIndicator: 'Copy indicator',
          filtersBlockTitle: 'Filters',
          filtersInfo: 'Limit data for the indicator you have selected',
          generalBlockTitle: 'General',
          label: 'Label',
          metadataBlockTitle: 'Metadata',
          settingsTabTitle: 'Settings',
          statisticsBlockTitle: 'Statistics',
          DataQualityBlock: {
            qualityScore: "Data Quality Score",
          },
          IndicatorMetadataBlock: {
            dataPoints: 'data points',
            dataPointsInfo: 'The total number of rows for all locations and time periods for this indicator',
            dataSource: 'Data source: ',
            dateRange: 'Data available from ',
            dateRangeInfo: 'The date of the first data point and last data point',
            defaultOperation: 'Default operation type:',
            indicatorConstituents: 'Indicator has constituent parts',
            showDescriptionLabel: 'View indicator description',
          },
          noDataToZero: 'Display \'No Data\' results as zero',
        },
        IndicatorSelectionBlock: {
          IndicatorSelector: {
            columnTitle: 'Data source',
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
    },
    LiveResultsView: {
      title: 'Query Results',
      VisualizationPicker: {
        visualizationGroupings: {
          geography: 'Geography',
          outliersCorrelationsAndMore: 'Outliers, correlations, and more',
          tableAndBarCharts: 'Table and bar charts',
          time: 'Time',
        },
        ControlBar: {
          back: 'Back',
          showMe: 'Show all',
          currentDisplay: 'Current:',
          returnToViz: 'Return to ',
        },
        ExploreView: {
          RequirementsSummary: {
            instructionsText: 'Hover over a visualization to explore its requirements',
            reqsSummary: '%(vizName)s: %(numSatisfied)s of %(numCriteria)s requirements fulfilled',
          },
          RequirementsDetails: {
            GEOGRAPHY: 'Geography',
            TIME: 'Date',
            DIMENSION: 'Group By',
            indicator: 'Indicator',
            detailsHeader: 'The %(vizName)s requires:',
          },
          RequirementsCriteria: {
            unboundedMax: '%(min)s or more',
            exactNum: '%(num)s',
            notRequired: {
              do: 'Do',
              not: 'not',
              select: 'select',
              additional: 'additional',
            },
            range: 'Between %(min)s and %(max)s',
          },
        },
      },
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
        reset: 'Reset',
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
      instruction_format:
        "To undertake this action, please type '%(understand_text)s' to acknowledge that you understand.",
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
      dashboard_admin: 'Dashboard Admin',
      dashboard_editor: 'Dashboard Editor',
      dashboard_viewer: 'Dashboard Viewer',
      default_title: 'Add users',
      select_role: 'Specify role',
      selected_users_subtitle: 'Selected Users',
      phoneNumber: 'Phone Number',
      name: 'Name',
      email: 'Email',
      status: 'Status',
      role: 'Role',
      removeButtonColumn: {
        deleteButton: 'Delete',
        deleteConfirmation: 'Are you sure you want to delete this entry?',
      },
    },
    DashboardsFlyout: {
      myDashboards: 'My Dashboards',
      newDashboard: 'Create Dashboard',
      otherDashboards: 'Other Dashboards',
      searchPlaceholder: 'Search dashboard by name',
      DashboardsTable: {
        empty: 'There are no Dashboards',
        loading: 'Dashboards are loading...',
        never: 'Never',
        columns: {
          isFavorite: 'Favorite',
          lastAccessedByCurrentUser: 'My Last Visit',
          title: 'Name',
        },
      }
    },
    QueryBuilder: {
      CustomizableFilterTag: {
        thisGranularity: 'This %(granularity)s',
        lastGranularity: {
          one: 'Last %(count)s %(granularity)s',
          other: 'Last %(count)s %(granularity)ss',
        },
        DimensionValueCustomizationModule: {
          NegateFilterCheckbox: {
            checkboxLabel: 'Enable NOT filter',
            helpText: 'Check "NOT" filters in order to remove rows with the selected values from your query results',
          },
        },
      },
      CustomizableIndicatorTag: {
        IndicatorCustomizationModule: {
          operation: 'Operation',
          CalculationCustomizationBlock: {
            CohortCustomizationBlock: {
              cohortButtonLabel: 'Build cohort',
              CohortCreationModal: {
                saveButtonText: 'Save and close',
                title: 'Create cohort calculation',
                CohortSummaryBar: {
                  summary: "Total, defined by",
                  noDimensionSelected: "Select a dimension",
                },
                CohortCreationPanel: {
                  addCohortGroup: 'Add new group to cohort',
                  filterTypes: {
                    numerical: 'Numerical Filter',
                    categorical: 'Categorical Filter'
                  },

                  CohortGroupBlock: {
                    AdditionalSegmentsCondition: {
                      suffix: 'of the following conditions',
                    },
                    GroupTitle: {
                      addAdditionalSegment: 'Add condition',
                      definedBy: 'defined by',
                      removeGroup: 'Remove cohort group',
                    },
                  },
                  CohortGroupOperationRow: {
                    createGroup: 'Create group (AND)',
                    ungroup: 'Ungroup (OR)',
                  },
                  CohortSegmentRow: {
                    addFilterButton: 'Add filter',
                    removeSegment: 'Remove segment',

                    DimensionValueFilterOption: {
                      matchesAll: 'all',
                      matchesAny: 'any',
                      prefix: 'where',
                      title: 'Time',
                      titlePrefix: 'Matches',
                      titleSuffix: 'of the filters',
                    },
                    IndicatorOption: {
                      actionLabel: 'that had',
                      actionLabelInverted: 'that did not have',
                      anyEvent: 'Any event',
                    },
                    NewFilterOption: {
                      newFilter: 'Select a filter to apply',
                    },
                    NumericFilterOption: {
                      atLeast: 'at least %(value)s',
                      atMost: 'at most %(value)s',
                      between: 'between %(minValue)s and %(maxValue)s',
                      equalTo: 'equal to %(value)s',
                      greaterThan: 'greater than %(value)s',
                      lessThan: 'less than %(value)s',
                      title: 'Having values',
                      NumericFilterCustomizationModule: {
                        and: 'and',
                        apply: 'Apply',
                        filterType: {
                          atLeast: 'At least...',
                          atMost: 'At most...',
                          between: 'Between and including...',
                          equalTo: 'Equal to...',
                          greaterThan: 'Greater than...',
                          lessThan: 'Less than...',
                        },
                      }
                    },
                    TimeIntervalOption: {
                      noTimeInterval: 'any time',
                      prefix: 'during',
                      title: 'Time',
                    },
                  },
                },
              },
            },
            CountDistinctCustomizationBlock: {
              title: 'Count distinct dimension',
            },
            LastValueCalculationCustomizationBlock: {
              operation: {
                average: 'Average',
                count: 'Count',
                max: 'Max',
                min: 'Min',
                sum: 'Sum',
              },
              title: {
                operation: 'Last value aggregation',
              },
            },
            WindowCalculationCustomizationBlock: {
              operation: {
                average: 'Average',
                max: 'Max',
                min: 'Min',
                sum: 'Sum',
              },
              title: {
                operation: 'Window calculation type',
                size: 'Window size',
              },
            },
          },
          DimensionFilterBlock: {
            helpText: 'Limit data for the indicator you have selected',
          },
          IndicatorAboutPanel: {
            detailsSectionTitle: 'Indicator Details',
            formulaItemLabel: 'Indicator has constituent parts',
            formulaSectionTitle: 'Formula',

            IndicatorDetailsSection: {
              category: 'Location',
              dataPointCount: 'Data points',
              dateRange: 'Data availability',
              dataSource: 'Data source',
              defaultCalculationType: 'Default calculation type',
              description: 'Description',
              title: 'Indicator Details',
            },
          },
        },
      },
    },
  },

  ui: {
    BaseModal: {
      closeText: 'Cancel',
      primaryText: 'Yes',
      secondaryText: 'No',
    },
    ColorBlock: {
      colorBlock: 'Color block',
      ColorPicker: {
        hexColor: 'Hex color',
      },
    },
    DatePicker: {
      applyButtonText: 'Apply dates',
      calendarTypes: {
        GREGORIAN: 'Western calendar',
        ETHIOPIAN: 'Ge’ez calendar',
      },
      modifiers: {
        BETWEEN: 'Between',
        THIS: 'This',
        LAST: 'Last',
        SINCE: 'Since',
      },
      dateUnits: {
        DAY: {
          label: 'day',
          THIS: 'This day',
          LAST: {
            one: 'Last day',
            other: 'Last %(count)s days',
          },
        },
        WEEK: {
          label: 'week',
          THIS: 'This week',
          LAST: {
            one: 'Last week',
            other: 'Last %(count)s weeks',
          },
        },
        MONTH: {
          label: 'month',
          THIS: 'This month',
          LAST: {
            one: 'Last month',
            other: 'Last %(count)s months',
          },
        },
        QUARTER: {
          label: 'quarter',
          THIS: 'This quarter',
          LAST: {
            one: 'Last quarter',
            other: 'Last %(count)s quarters',
          },
        },
        YEAR: {
          label: 'year',
          THIS: 'This year',
          LAST: {
            one: 'Last calendar year',
            other: 'Last %(count)s years',
          },
        },
        EPI_WEEK: {
          label: 'epi week',
          THIS: 'This epi week',
          LAST: {
            one: 'Last epi week',
            other: 'Last %(count)s epi weeks',
          },
        },
        FISCAL_QUARTER: {
          label: 'fiscal quarter',
          THIS: 'This fiscal quarter',
          LAST: {
            one: 'Last fiscal quarter',
            other: 'Last %(count)s fiscal quarters',
          },
        },
        FISCAL_HALF: {
          label: 'fiscal half',
          THIS: 'This fiscal half',
          LAST: {
            one: 'Last fiscal half',
            other: 'Last %(count)s fiscal halves',
          },
        },
        FISCAL_YEAR: {
          label: 'fiscal year',
          THIS: 'This fiscal year',
          LAST: {
            one: 'Last fiscal year',
            other: 'Last %(count)s fiscal years',
          },
        },
      },
      MainContainer: {
        makeDateSelection: 'Your date selection',
      },
      QuickOptionsContainer: {
        quickOptions: 'Quick options',
      },
      QuickOption: {
        custom: 'Custom date range',
        since: 'Since %(date)s',
        allTime: 'All time',
        yearToDate: 'Year to date',
      },
      DateUnitEditor: {
        includeCurrentInterval: 'Include current %(dateUnit)s as well',
      },
      CalendarEditor: {
        and: 'and',
        today: 'Today',
        startDateInvalidMsg: 'Please enter a valid start date',
        endDateInvalidMsg: 'Please enter a valid end date',
        invalidDateMsg: 'Please enter a valid date',
        reset: 'Reset',
      },
      RangeEthiopianCalendarEditor: {
        startDate: 'Start date',
        endDate: 'End date',
      },
      EthiopianDateSelector: {
        month: 'Month',
        year: 'Year',
      },
    },

    Dropdown: {
      asyncNoSearchTerm: 'Please enter a search term',
      emptyGroup: 'There are no options in this group',
      emptySearchResults: 'No results matched "%(searchText)s"',
      noOptions: 'There are no options to select',
      noSearch: 'Please enter a search term to see results',
      noSelection: 'No selection',
      searchPlaceholder: 'Search...',
      selectAll: 'Select All',
      selected: 'selected',
    },
    HierarchicalSelector: {
      MainColumnArea: {
        ColumnItem: {
          mruTooltip: 'A list of your most recently selected indicators',
        },
        emptyMruText: 'No recent indicators. Run a query for indicators to appear here.',
      },
      SearchBar: {
        defaultPlaceholder: 'Search for data elements',
        categoryPlaceholder: 'Search for data elements in this category'
      },
      SearchResults: {
        noResults: "No Search Results"
      },
    },
    PageSelector: {
      nextPage: 'Next page',
      previousPage: 'Previous page',
      firstPage: 'First page',
      lastPage: 'Last page',
    },
    Table: {
      search: 'Search',
      noData: 'There is nothing to display at this time.',
      noResults: 'Sorry, there are no results that match your search query.',
    },
    Tag: {
      remove: 'Remove',
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
      EpiCurve: {
        yAxisDefaultLabel: 'Total Number of Cases',
        tooltip: {
          from: 'From',
          to: 'to'
        }
      },
      BoxPlot:{
        models: {
          BoxPlotTheme: {
            dark: 'Dark',
            light: 'Light',
          },
        },
        tooltip: {
          firstQuartile: 'First Quartile',
          max: 'Max',
          median: 'Median',
          min: 'Min',
          outlier: 'Outlier value',
          thirdQuartile: 'Third Quartile',
        },
      },
      BumpChart: {
        BumpChartTooltip: {
          date: 'Date',
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
      },
    },
  },

  GeoMappingApp: {
    MapPanel: {
      addLayersTitle: 'Add layers',
      EditLayerPanel: {
        Label: {
          customize: 'Customize',
          displayLabels: 'Display labels',
          title: 'Label',
        },
        Legend: {
          displayLegend: 'Display legend',
          title: 'Legend',
        },
        Popup: {
          displayPopups: 'Display pop-ups',
          title: 'Pop-up',
        },
        title: 'Editing Layer',
        toggleOff: 'Turned Off',
        toggleOn: 'Turned On',
      },
      LayerCard: {
        editLayer: 'Edit layer',
        filterTitle: 'Filter',
        hideLayer: 'Hide layer',
        markerTypeDots: 'Dots',
        markerTypeSymbols: 'Symbols',
        showLayer: 'Show layer',
      },
      layersTitle: 'Layers',
      layerSelectorButton: 'New layer',
    },
    MapSearchBar: {
      searchPlaceholder: 'Search for address',
    },
    settings: {
      buttonTooltip: 'Change settings',
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
        empty: 'No Selected matches.',
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
    dashboards: {
      empty: 'There are no Dashboards',
      loading: 'Dashboards are loading...',
      recentDashboardsTitle: 'Recently Updated Dashboards',
      userTabTitle: 'My Dashboards',
      otherTabTitle: 'Other Dashboards',
      search: 'Search dashboard by name',
      emptyStateTitle: 'No dashboards yet',
      emptyStateSubtitle: 'Looks like you haven’t created any dashboards.',
      emptyStateTip: 'Check out Other Dashboards for dashboards that have been shared with you.',
      never: 'Never',
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
    alerts: {
      title: 'Alerts',
      empty: 'There are no Alerts',
      search: 'Search Alert Names...',
    },
    Feed: {
      yours: 'Yours',
      platform: 'Platform',
      searchPlaceholder: 'Search across notifications',
      FeedUpdatesTab: {
        noNotifications: 'No notifications yet',
        noNotificationsDescription: 'All your important notifications will come here, so keep an eye out!',
        noSearchResults: 'No results found for \'%(searchText)s\'',
        noSearchResultsDescription: 'Please make sure your search is spelled correctly',
        viewMore: 'View more notifications',
      },
      FeedNotification: {
        nameShared:'%(name)s shared dashboard',
        withYou: 'with you.',
        accessTo: 'You now have access to dashboard',
        openQuery: 'Open query',
        viewDashboard: 'View dashboard',
        exploreIndicators: 'Explore indicators',
        showDashboards: 'See dashboards',
        hide: 'Hide',
        showAll: 'Show all...',
        dashboardAdmin: 'as a Dashboard Admin',
        dashboardEditor: 'as a Dashboard Editor',
        dashboardViewer: 'as a Dashboard Viewer',
      },
    },
    OfficialDashboardCards: {
      officialDashboards: 'Official Dashboards',
      collapseThumbnails: 'Collapse Official Dashboards',
      showAllThumbnails: "Show All Official Dashboards",
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
    emptyStateTitle: 'This dashboard feels empty',
    emptyStateSubtitle: 'Seems like you don’t have any content in your dashboard yet.',
    emptyStateButton: 'Add Content',
    create: 'Create Dashboard',
    corrupt_load_title: 'There was an error loading the Dashboard Specification. Contact an Administrator and DO NOT make any changes. ',
    tile_clone_sucess: 'Dashboard Item was cloned successfully.',
    default_title: 'Custom Dashboard',
    edit_mode: 'Edit',
    view_mode: 'Present',
    load_dashboard_invalid:
      'There are errors present in the Dashboard retrieved from the server. The dashboard may not be rendered properly. You cannot make changes to the Dashboard at this time. Contact an Administrator for assistance.',
    load_dashboard_error:
      'There was an error retrieving and/or loading the Dashboard. Contact an Administrator for assistance. Details were written to the console.',
    save_specification: 'Save',
    save_dashboard_success: 'Dashboard was successfully saved. ',
    save_dashboard_error:
      'An error occurred while saving dashboard specification. Details were written to the console. ',
    save_short: 'Save',
    save_tooltip: 'Use Control-S to Save',
    undo: 'Undo',
    undo_tooltip: 'Undo all unsaved changes',
    AddContentButton: {
      AddContent: 'Add Content',
      AddText: 'Add Text',
      AddVisualization: 'Add Visualization',
      EmbedIFrame: 'Embed iFrame',
    },
    clone: {
      title: 'Clone',
      text: 'Save cloned dashboard as...',
      button: 'Save',
    },
    edit_specification: 'Edit Dashboard Specification',
    edit_item:
      'Editing the visualization has failed. Please contact an Administrator for assistance.',
    not_admin:
      'Not displaying Dashboard Settings as user is not a Dashboard Administrator.',
    not_editor:
      'Not displaying Dashboard Save/Edit buttons as user is not a Dashboard Editor.',
    DashboardIFrameModal: {
      modal_title: 'Edit IFrame',
      edit_title_header: 'iFrame Title',
      paste_iframe_text: 'Paste the URL source for the iFrame below',
      url_placeholder: 'https://www.youtube.com/embed/jNsyPZ3zB48',
      iframe_tooltip: "Please only enter the embed source URL, not the entire embed code. You will find the source URL in the embed code within quotes after 'src='.",
    },
    dashboard_filter: {
      config: {
        header:  'Allow users to use filters on this dashboard',
        dateRange: 'Date Range',
        enabled_filter_panel: 'Filter Panel is Enabled.',
        disabled_filter_panel: 'Filter Panel is Disabled.',
        filter_options: {},
        selectFilters: 'Choose which filters to enable',
        selectGroupBys: 'Choose which group bys to enable',
        disableFilterItemError: 'You cannot disable the only filter item, instead disable filtering on the dashboard',
        disableGroupingItemError: 'You cannot disable the only group by item, instead disable grouping on the dashboard',
        date_picker_options: {
          CUSTOM: 'Custom',
          choose_years: 'Year Picker',
          choose_months: 'Month Picker',
          et_choose_years: 'Ethiopian Year Picker',
          et_choose_months: 'Ethiopian Month Picker',
        },
        showDashboardFilterButton: {
          label: 'Filters',
          tooltip: 'Allow Dashboard filter dropdown to be visible to all users.',
        },
        showDashboardGroupbyButton: {
          label: 'Group bys',
          header: 'Allow users to use group bys on this dashboard',
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
      selection: 'Select Dashboard Filters...',
    },
    update_specification: 'Update Dashboard Specification',
    update_modal: {
      bad_json:
        'The provided specification was not valid JSON. Additional details were written to the console.',
      invalid_spec:
        'The specification had errors. They have been written to the console.',
      valid_spec: 'The specification was valid. Updating the Dashboard.',
    },
    dashboard_settings: {
      fetch_users_fail:
        'Failed to fetch the list of users. Additional details were written to the console. ',
      fetch_current_users_fail:
        'Failed to find the list of current users for the dashboard. ',
      fetch_groups_fail: 'Failed to fetch the list of groups. Additional details were written to the console. ',
      title: 'Settings',
      users_tab: {
        additional_users: 'Users with sitewide viewer/editor/administrator permissions also have access to this Dashboard regardless of what permissions are set here.',
        public_access_title: 'Public Access',
        public_access_warning: 'By checking this box, you will allow unregistered users to access and view all the data on this dashboard.',
        registered_users_checkbox_text: 'Enable Dashboard Viewer access for all registered users',
        registered_users_tooltip: 'Please talk to your Platform Admin to change this setting.',
        title: 'Dashboard Users',
        unregistered_users_checkbox_text: 'Enable Dashboard Viewer access for all unregistered users',
      },
      public_users_tab: {
        title: 'Public Access',
        public_access_warning:
          'Public access is not enabled for this deployment and as a result, unregistered users will NOT have access regardless of whether it is enabled for a particular role or not.',
        allow_unregistered: 'Enable for unregistered users',
        subtitle:
          'Use these settings to open your dashboard to all registered users.',
        subtitle_publisher:
          'User these settings to open your dashboard to all registered users as well as the public (unregistered users).',
        fetch_public_users_fail:
          'Failed to fetch the list of public users for this dashboard. ',
        update_public_users: 'Update Public Access',
      },
      filter_config_tab: {
        title: 'Filter Configuration',
        update_filter_config:  'Salvar',
      },
      delete_dashboard: {
        title: 'Delete Dashboard',
        warning_label:
          'Are you sure you wish to delete this entire dashboard permanently?',
      },
      settings_tab: {
        title: 'General Settings',
        subtitle:
          'Use these settings to change how your visualization is displayed',
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
      update_users: 'Update Settings',
      update_settings: 'Update Settings',
      permission_update_success: 'Successfully updated users for the Dashboard',
      permission_updateError:
        'Failed to update users for the Dashboard. Additional details were written to the console. ',
      fetch_resource_fail:
        'An error ocurred while fetching dashboard details. ',
      clone_dashboard_button:{
        clone_dashboard_error: 'An error occurred while saving dashboard specification. Details were written to the console. ',
        dashboard_name_input_label: 'Provide a name for your new dashboard',
        title: 'Clone Dashboard',
        button_text: 'Save'
      },
    },
    EditNavbar: {
      cancel: 'Cancel',
      saveChanges: 'Save changes',
    },
    EditTextView: {
      title: 'Editing text',
    },
    GISItemEditView: {
      title: 'Editing map',
    },
  },
  query_form: {
    sections: {
      level_of_aggregation: 'Level of aggregation',
    },
    select_date: {
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
    },
    select_relative_date: {
      label: 'የቀን መጠን',
    },
    selections: {
      search: 'Search...',
      title: 'ለመምረጥ ጠቅ አድርግ',
      infoBox: {
        dataAvailable: 'available',
        dataPointsSuffix: 'data points',
        dataQuality: 'data quality',
      },
      all: {
        label: 'ሁሉም ዴታ',
      },
      healthIndicators: {
        label: 'የጤና አመላካቾች',
        label_sub: '(PHEM, SPA, NNPMT)',
        selected_label: 'Selected የጤና አመላካቾች',
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
        label: 'መነሻ ግቦች ፥ ክዋኔ እና የአሁን ግቦች',
        label_sub: '',
        selected_label: 'Selected Baselines, Performance, Targets',
      },
      hmisAnddhis2s: {
        label: 'HMIS and DHIS2',
        label_sub: '',
        selected_label: 'Selected HMIS and DHIS2',
      },
      dhis2Indicators: {
        label: 'DHIS2 Indicators',
        label_sub: '',
        selected_label: 'Selected DHIS2 Indicators',
      },
      surveys: {
        label: 'ቅኝቶች እና ጥናቶች',
        label_sub: '',
        selected_label: 'Selected Surveys',
      },
      partners: {
        label: 'Resource Mapping/Partner Spending',
        label_sub: '',
        selected_label: 'Selected Resource Mapping/Partner Spending',
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
      dhisHivDataElements: {
        label: 'DHIS2 (HIV) Data Elements',
        label_sub: '',
        selected_label: 'Selected DHIS2 (HIV) Data Elements',
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
      hivCalculatedIndicators: {
        label: 'DHIS2 (HIV) Indicators',
        label_sub: '',
        selected_label: 'Selected DHIS2 (HIV) Indicators',
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
      sexWorks: {
        label: 'Sex Work Indicators',
        label_sub: '',
        selected_label: 'Selected Sex Work Indicators',
      },
      wcdoh: {
        label: 'WCDOH Indicators',
        label_sub: '',
        selected_label: 'Selected WCDOH Indicators',
      },
      unileverIndicators: {
        label: 'Indicators',
        label_sub: '',
        selected_label: 'Selected indicators',
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
      denominator: {
        label: 'ታህት',
        selected_label: 'Selected ታህት',
      },
      campaignIndicators: {
        label: 'Campaign Indicators',
        label_sub: '',
        selected_label: 'Selected Campaign Indicators',
      },
      elmisIndicators: {
        label: 'ELMIS Indicators',
        label_sub: '',
        selected_label: 'Selected ELMIS Indicators',
      },
    },
    wizard: {
      select_indicator: 'Click here to select an indicator.',
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
    settings_instructions:
      "Please see 'layer settings' for more display options",
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
  select_filter: {
    labels: {
      geography: 'መልክአምድር',
      date_groups: 'Date Group',
      date_extraction: 'Date Extraction',
      beneficiary_id: 'Beneficiary id',
      age_group: 'Age group',
      gender: 'Gender',
      peer_motivator: 'Peer educator',
      budget_line_full: 'Budget Line',
      cost_category: 'Cost Category',
      location_type: 'Location type',
      education_status: 'Education status',
      supplier_employee_name: 'Supplier/Employee Name',
      subrecipient: 'Subrecipient',
      sw_unique_id: 'Sex worker unique id',
      ywg_beneficiary_id: 'YWG beneficiary id',
      session_number: 'Session Number',
      unique_id: 'Beneficiary name code',
      club_name: 'Club name',
      primary_recipient: 'Primary recipient',
      school: 'School',

      // Location granularities
      place: 'Place',
      site: 'Site',

      nacosa_verification: 'Nacosa verification',

      bl_cost_type: 'Budget line cost type',
      IncomingCommodityCompanyName: 'Incoming Commodity Company Name',
      companyType: 'Company Type',
      orderType: 'Order Type',
      OrderID: 'Order ID',
      AdjustmentType: 'Adjustment Type',
      FundingSource: "Funding Source",

      ward: 'Ward',
      subdistrict: 'Subdistrict',
      district: 'District',

      // ET
      nation: 'Nation',
      all: 'All values',
      RegionName: 'Regions',
      ZoneName: 'Zones',
      WoredaName: 'Woredas',
      CenterName: 'Centers',
      FacilityName: 'Facilities',
      EducationLevel: 'Education Level',
      EstablishedDate: 'Established Date',
      SourceOfCapital: 'Source of Capital',
      EnterpriseStatus: 'Enterprise Status',
      OrganizationalStatus: 'Organization Status',
      InvestmentStatus: 'Investment Status',
      JCCSector: 'JCC Sector',
      TotalYearsOfService: 'Total Years Of Service',
      TypeOfService: 'Type of Service',
      TypeOfDisability: 'Type of Disability',
      ProjectType: 'Project Type',
      StartingYear: 'Starting Year',
      TypeOfInvestors: 'Type Of Investors',
      InvestmentType: 'Investment Type',
      InvestmentBottleneck: 'Investment Bottleneck',
      InvestmentPermit: 'Investment Permit',
      YearOfEstablishment: 'Year of Establishment',
      TypeOfOwnership: 'Type of Ownership',
      GeneralOccupation: 'General Occupation',
      PayFrequency: 'Pay Frequency',
      SourceOfMoney: 'Source of Money',
      CapitalDescription: 'Capital Description',
      EmployeeOrOperator: 'Employee or Operator',
      ReadWrite: 'Read and Write',
      LicensingOffice: 'Licensing Office',
      EnterpriseCategory:'Enterprise Category',
      UniversityName: 'University Name',
      LocationType: 'Location Type',
      SectorCategory: 'Sector Category',
      SubsectorCategory: 'Subsector Category',
      YearsOfExperience: 'Years of Experience',
      VacancySource: 'Vacancy Source',
      JobType: 'Job Type',
      MaritalStatus: 'Marital Status',
      Nationality: 'Nationality',
      PhysicalCondition: 'Physical Condition',
      FieldOfStudy: 'Field of Study',
      EmploymentStatus: 'Employment Status',
      UnemploymentReason: 'Unemployment Reason',
      Condition: 'Condition',
      DurationOfUnemploymentYears: 'Duration of Unemployment Years',
      EmployedOrBusiness: 'Employed or Business',

      // EKN
      reporting_org: 'Reporting Organization',
      participating_org: 'Participating Organization',
      sector: 'Sector',

      // TGF
      area_type: 'Area type',
      subregion: 'Subregion',
      wealth_quintile: 'Wealth Quintile',
      wb_inc_group: 'World Bank Income Group',
      education_level: 'Education Level',

      // LR
      CountyName: 'County',
      DistrictName: 'District',
      CommunityName: 'Community',

      // Bangladesh
      UpazilaName: 'Upazila',
      UnionName: 'Union',
      AES: 'AES',
      FLU: 'Influenza',
      ROTA: 'Rotavirus',

      PatientName: 'Patient Name',
      PatientSex: 'Patient Sex',
      PatientAge: 'Patient Age',
      VaccinationStatus: 'Vaccination Status',
      Outcome: 'Outcome',
      CommunityCaseDetection: 'Community Case Detection',
      FinalClassification: 'Classification',
      EpiWeek: 'Epi Week',
      MaternalCauseOfDeath: 'Maternal or Neonatal Cause of death',
      SpecimenCondition: 'Specimen Condition',
      SpecimenSentNotReceived: 'Specimen Sent but not Received',
      LabResults: 'Lab Results',

      MissingLabResults: 'Missing Lab Results',
      MissingReportingHealthFacility: 'Missing Reporting Health Facility',
      MissingReportingDistrict: 'Missing Reporting District',
      MissingReportingCounty: 'Missing Reporting County',

      CallNature: 'Emergency Call Nature',

      // TG
      NeighborhoodName: 'Neighborhood',
      FacilityType: 'Facility Type',
      FacilityStatus: 'Facility Status',
      FacilityTypeDetail: 'Facility Type Detail',
      FacilityStatusDetail: 'Facility Status Detail',
      AreaType: 'Rural or Urban',
      REF_ARTICLE: 'Distribution Destination',
      N_LOT: 'Lot Number',
      FINANCEMENT: 'Financing',

      // Unilever
      retailer_code: 'Retailer code',
      store: 'Store name',
      nielsen_rms_store_code: 'Nielsen RMS store code',
      scantrack_code: 'Scantrack code',
      chain: 'Chain',
      banner: 'Banner',
      active: 'Active',
      physical_address: 'Physical address',

      // Alliance India
      ReportingFacilityName: 'Reporting Facility',
      InstitutionType: 'Institution Type',

      // Rwanda
      admin_unit_type: 'Admin Unit Type',
      ownership: 'Ownership',
      pbf_com_study_groups: 'PBF Com Study Groups',
      tb_diagnosis_and_treatment_center_types: 'TB diagnosis and Treatment center types',
      OriginLocation: 'Origin Location',
      ContractionLocation: 'Contraction Location',
      AgeRange: 'Age Range',

      // Mozambique
      PostoName: 'Posto',
      BairroName: 'Bairro',
      facility_type: 'Facility Type',
      facility_target: 'Facility Target',
      Age: 'Age',

      // Kenya
      tb_zone: 'TB Zone',
      programme_sponsor: 'Programme Sponsor',
      tb_subcounty_stores: 'TB SubCounty Stores',
      art_facility_type: 'ART Facility Type',
      facility_ownership: 'Facility Ownership',
      beyond_zero_clinics: 'Beyond Zero Clinics',
      art_central_sites: 'ART Central Sites',
      nascop_region: 'NASCOP Region',
      supply_chain: 'Supply Chain',
      keph_level: 'KEPH Level',
      malaria_epidemiological_zones: 'Malaria Epidemiological Zones',

      // Benin
      DepartmentName: 'Department',
      CommuneName: 'Commune',

      // Gates Malaria
      SubRegionName: 'Sub-Region',
      CountryName: 'Country',
      RiskCauses: 'Causes',
    },
    all: 'All values',
    RegionName: 'ክልል',
    ZoneName: 'ዞን',
    WoredaName: 'ወረዳ',
    CenterName: 'Centers',
    FacilityName: 'Facility',

    // Bangladesh
    UpazilaName: 'Upazila',
    UnionName: 'Union',
    sex: 'Sex',
    result: 'Result',
    result_influenza: 'Influenza Result',
    result_rotavirus: 'Rotavirus Result',
    syndrome_acute_fever: 'Syndrome Acute Fever',
    syndrome_altered_mental_status: 'Syndrome Altered Mental Status',
    syndrome_onset_seizure: 'Syndrome Onset Seizure',
    patient_die: 'Patient Died',
    aes_who_classification: 'AES WHO Classification',
    aes_lab_diagnostics: 'AES Lab Diagnostics',
    district_travel_name: 'District Travel Name',
    age_group_in_years: 'Age Group',
    age_group_in_years_aes: 'Age Group (AES)',
    age_group_in_years_influenza: 'Age Group (Influenza)',
    age_group_in_years_rotavirus: 'Age Group (Rotavirus)',
    patient_profile_hcw: 'Patient Profile HCW',
    patient_profile_pcpw: 'Patient Profile PCPW',
    patient_profile_bpr: 'Patient Profile BPR',
    patient_profile_lbmw: 'Patient Profile LBMW',
    ili_sari: 'Ili Sari',
    result_sub: 'Result Sub',
    child_had_diarrhea: 'Child Had Diarrhea',
    stool_contained_blood: 'Stool Contained Blood',
    child_had_vomiting: 'Child Had Vomiting',
    child_had_fever: 'Child Had Fever',
    child_had_fever_in_first_48hrs_Stay: 'Child Had Fever in First 48hrs Stay',
    child_hospital_stay_outcome: 'Child Hospital Stay Outcome',
    genotyping_result: 'Genotyping Result',
    sym_sore_throat: 'Symptom: sore throat',
    sym_running_nose: 'Symptom: running nose',
    sym_difficulty_breathing: 'Symptom: difficulty breathing',
    sym_headache: 'Symptom:  headache',
    sym_bodyache: 'Symptom: bodyache',
    sym_diarrhoea: 'Symptom: diarrhoea',
    sym_u5_convulsions: 'Symptom: U5 convulsions',
    sym_u5_unconsciousness: 'Symptom: U5 unconsciousness',
    sym_u5_unable_drink_breastfeed: 'Symptom: U5 unable drink breastfeed',
    sym_u5_vomiting: 'Symptom: U5 vomiting',
    sym_u5_stridor: 'Symptom: U5 stridor',
    sym_u5_chest_in_drawing: 'Symptom: U5 chest in drawing',
    sample_throat: 'Sample throat',
    sample_nasal: 'Sample nasal',
    sample_nasopharyngeal: 'Sample nasopharyngeal',
    sample_sputum: 'Sample sputum',
    child_received_oral_hydration_fluids_before_admission: 'Child recieved oral hydration fluids before admission',
    child_receive_iv_fluids_before_admission: 'Child recieved IV fluids before admission',
    iv_fluids_given_hospital_stay: 'IV fluids given hospital stay',
    oral_rehydration_given_hospital_stay: 'Oral rehydration given hospital stay',
    child_had_complications_hospital_stay: 'Child had complications hospital stay',
    stool_specimen_collected_hospital_stay: 'Stool specimen collected hospital stay',
    stool_specimen_tested_hospital_stay: 'Stool specimen tested hospital stay',

    // EKN
    reporting_org: 'Reporting Organization',
    participating_org: 'Participating Organization',
    sector: 'Sector',

    // Alliance India
    ReportingFacilityName: 'Reporting Facility',
    InstitutionType: 'Institution Type',

    // Rwanda
    FacilityType: 'Facility Type',
    admin_unit_type: 'Admin Unit Type',
    ownership: 'Ownership',
    pbf_com_study_groups: 'PBF Com Study Groups',
    tb_diagnosis_and_treatment_center_types: 'TB diagnosis and Treatment center types',
    OriginLocation: 'Origin Location',
    ContractionLocation: 'Contraction Location',
    AgeRange: 'Age Range',

    // Mozambique
    PostoName: 'Posto',
    BairroName: 'Bairro',
    facility_type: 'Facility Type',
    facility_target: 'Facility Target',
    Age: 'Age',

    // Kenya
    tb_zone: 'TB Zone',
    programme_sponsor: 'Programme Sponsor',
    tb_subcounty_stores: 'TB SubCounty Stores',
    art_facility_type: 'ART Facility Type',
    facility_ownership: 'Facility Ownership',
    beyond_zero_clinics: 'Beyond Zero Clinics',
    art_central_sites: 'ART Central Sites',
    nascop_region: 'NASCOP Region',
    supply_chain: 'Supply Chain',
    keph_level: 'KEPH Level',
    malaria_epidemiological_zones: 'Malaria Epidemiological Zones',

    // Benin
    DepartmentName: 'Department',
    CommuneName: 'Commune',

    // Gates Malaria
    SubRegionName: 'Sub-Region',
    CountryName: 'Country',
    RiskCauses: 'Causes',
  },
  select_date: {
    current_calendar_month: 'የአሁኑ ወር',
    current_quarter: 'የአሁኑ ሩብ',
    current_year: 'የአሁኑ ዓመት',
    previous_calendar_week: 'ያለፈው ሳምንት',
    previous_calendar_month: 'ያለፈው ወር',
    previous_quarter: 'ያለፈው መንፈቅ አመት',
    previous_calendar_year: 'ያለፈው ዓመት',
    last_365_days: 'Last 365 days',
    all_time: 'All time',
    forecast: 'Forecast',
    custom: 'Custom',

    currentFiscalPeriod: 'Current %(name)s',
    previousFiscalPeriod: 'Previous %(name)s',
  },
  select_granularity: {

    // Dimension ids.
    FacilityName: 'ጤና ተቋም',
    WoredaName: 'ወረዳ',
    ZoneName: 'ዞን',
    RegionName: 'ክልል',
    nation: 'Nation',
    CenterName: 'Centers',

    // ET
    EducationLevel: 'Education Level',
    EstablishedDate: 'Established Date',
    SourceOfCapital: 'Source of Capital',
    EnterpriseStatus: 'Enterprise Status',
    OrganizationalStatus: 'Organization Status',
    InvestmentStatus: 'Investment Status',
    JCCSector: 'JCC Sector',
    TotalYearsOfService: 'Total Years Of Service',
    TypeOfService: 'Type of Service',
    TypeOfDisability: 'Type of Disability',
    ProjectType: 'Project Type',
    StartingYear: 'Starting Year',
    TypeOfInvestors: 'Type Of Investors',
    InvestmentType: 'Investment Type',
    InvestmentBottleneck: 'Investment Bottleneck',
    InvestmentPermit: 'Investment Permit',
    YearOfEstablishment: 'Year of Establishment',
    TypeOfOwnership: 'Type of Ownership',
    GeneralOccupation: 'General Occupation',
    PayFrequency: 'Pay Frequency',
    SourceOfMoney: 'Source of Money',
    CapitalDescription: 'Capital Description',
    EmployeeOrOperator: 'Employee or Operator',
    ReadWrite: 'Read and Write',
    LicensingOffice: 'Licensing Office',
    EnterpriseCategory:'Enterprise Category',
    UniversityName: 'University Name',
    LocationType: 'Location Type',
    SectorCategory: 'Sector Category',
    SubsectorCategory: 'Subsector Category',
    YearsOfExperience: 'Years of Experience',
    VacancySource: 'Vacancy Source',
    JobType: 'Job Type',
    MaritalStatus: 'Marital Status',
    Nationality: 'Nationality',
    PhysicalCondition: 'Physical Condition',
    FieldOfStudy: 'Field of Study',
    EmploymentStatus: 'Employment Status',
    UnemploymentReason: 'Unemployment Reason',
    Condition: 'Condition',
    DurationOfUnemploymentYears: 'Duration of Unemployment Years',
    EmployedOrBusiness: 'Employed or Business',


    // EKN
    reporting_org: 'Reporting Organization',
    participating_org: 'Participating Organization',
    sector: 'Sector',

    // Rwanda
    FacilityType: 'Facility Type',
    admin_unit_type: 'Admin Unit Type',
    ownership: 'Ownership',
    pbf_com_study_groups: 'PBF Com Study Groups',
    tb_diagnosis_and_treatment_center_types: 'TB diagnosis and Treatment center types',
    OriginLocation: 'Origin Location',
    ContractionLocation: 'Contraction Location',
    AgeRange: 'Age Range',

    // Mozambique
    PostoName: 'Posto',
    BairroName: 'Bairro',
    facility_type: 'Facility Type',
    facility_target: 'Facility Target',
    Age: 'Age',

    // Kenya
    tb_zone: 'TB Zone',
    programme_sponsor: 'Programme Sponsor',
    tb_subcounty_stores: 'TB SubCounty Stores',
    art_facility_type: 'ART Facility Type',
    facility_ownership: 'Facility Ownership',
    beyond_zero_clinics: 'Beyond Zero Clinics',
    art_central_sites: 'ART Central Sites',
    nascop_region: 'NASCOP Region',
    supply_chain: 'Supply Chain',
    keph_level: 'KEPH Level',
    malaria_epidemiological_zones: 'Malaria Epidemiological Zones',

    // Bangladesh
    UpazilaName: 'Upazila',
    UnionName: 'Union',
    sex: 'Sex',
    result: 'Result',
    result_influenza: 'Influenza Result',
    result_rotavirus: 'Rotavirus Result',
    syndrome_acute_fever: 'Syndrome Acute Fever',
    syndrome_altered_mental_status: 'Syndrome Altered Mental Status',
    syndrome_onset_seizure: 'Syndrome Onset Seizure',
    patient_die: 'Patient Died',
    aes_who_classification: 'AES WHO Classification',
    aes_lab_diagnostics: 'AES Lab Diagnostics',
    district_travel_name: 'District Travel Name',
    age_group_in_years: 'Age Group',
    age_group_in_years_aes: 'Age Group (AES)',
    age_group_in_years_influenza: 'Age Group (Influenza)',
    age_group_in_years_rotavirus: 'Age Group (Rotavirus)',
    patient_profile_hcw: 'Patient Profile HCW',
    patient_profile_pcpw: 'Patient Profile PCPW',
    patient_profile_bpr: 'Patient Profile BPR',
    patient_profile_lbmw: 'Patient Profile LBMW',
    ili_sari: 'Ili Sari',
    result_sub: 'Result Sub',
    child_had_diarrhea: 'Child Had Diarrhea',
    stool_contained_blood: 'Stool Contained Blood',
    child_had_vomiting: 'Child Had Vomiting',
    child_had_fever: 'Child Had Fever',
    child_had_fever_in_first_48hrs_Stay: 'Child Had Fever in First 48hrs Stay',
    child_hospital_stay_outcome: 'Child Hospital Stay Outcome',
    genotyping_result: 'Genotyping Result',
    sym_sore_throat: 'Symptom: sore throat',
    sym_running_nose: 'Symptom: running nose',
    sym_difficulty_breathing: 'Symptom: difficulty breathing',
    sym_headache: 'Symptom:  headache',
    sym_bodyache: 'Symptom: bodyache',
    sym_diarrhoea: 'Symptom: diarrhoea',
    sym_u5_convulsions: 'Symptom: U5 convulsions',
    sym_u5_unconsciousness: 'Symptom: U5 unconsciousness',
    sym_u5_unable_drink_breastfeed: 'Symptom: U5 unable drink breastfeed',
    sym_u5_vomiting: 'Symptom: U5 vomiting',
    sym_u5_stridor: 'Symptom: U5 stridor',
    sym_u5_chest_in_drawing: 'Symptom: U5 chest in drawing',
    sample_throat: 'Sample throat',
    sample_nasal: 'Sample nasal',
    sample_nasopharyngeal: 'Sample nasopharyngeal',
    sample_sputum: 'Sample sputum',
    child_received_oral_hydration_fluids_before_admission: 'Child recieved oral hydration fluids before admission',
    child_receive_iv_fluids_before_admission: 'Child recieved IV fluids before admission',
    iv_fluids_given_hospital_stay: 'IV fluids given hospital stay',
    oral_rehydration_given_hospital_stay: 'Oral rehydration given hospital stay',
    child_had_complications_hospital_stay: 'Child had complications hospital stay',
    stool_specimen_collected_hospital_stay: 'Stool specimen collected hospital stay',
    stool_specimen_tested_hospital_stay: 'Stool specimen tested hospital stay',

    // Internal Zenysis
    ErrorMsg: 'Error Message',
    SegmentUser: 'User Email',
    DeploymentName: 'Deployment Name',
    UserName: 'User Name',
    LastLogin: 'Last Login Date',
    IsTarget: 'Is Target User',
    OrganizationDivision: 'User Division',
    IsDashboardOfficial: 'Is Dashboard Official',
    SelectedField: 'Selected Field',
    SelectedDatasource: 'Selected Datasource',
    PageURL: 'Page URL',
    AccountStatus: 'Account Status',
    IsZenysis: 'Is Zenysis',
    DashboardOwner: 'Dashboard Owner',
    FirstLogin: 'First Login Date',

    // Pakistan
    FatherName: 'Father Name',
    ChildName: 'Child Name',
    TehsilName: 'Tehsil',
    UnionCouncilName: 'Union Council',
    Address: 'Address',
    BirthDate: 'Birth Date (Estimated)',
    AgeMonths: 'Age in Months',
    Datasource: 'Datasource',
    MatchValidationStatus: 'Match Validation Status',
    Supervisor: 'Supervisor',
    Campaign: 'Campaign',
    HouseNumber: 'House Number',
    PatientID: 'ChildID',
    ZMAgeCategory: 'Age Category',


    // Gates Malaria
    SubRegionName: 'Sub-Region',
    CountryName: 'Country',
    RiskCauses: 'Causes',
  },
  process_query: {
    save: 'መከታተያ ሰሌዳ ላይ አስቀምጥ',
    remove: 'ከመከታተያ ሰሌዳ ላይ አስወግድ',
    addedToDashboard: 'Added to dashboard'
  },

  QueryApp: {
    CustomCalculationsButton: {
      label: 'Calculations',
    },
    CustomCalculationsModal: {
      apply: 'Create',
      edit: 'Save',
      cancel: 'Close',
      defaultCalculationNamePrefix: 'Calculation',
      emptyNameError: 'Custom calculations must have a name',
      emptyFormulaError: 'Custom calculations cannot be empty',
      existingNameError: 'This custom calculation already exists',
      invalidExpressionError: 'Custom calculations must be valid',
      title: 'Add Custom Calculation',
      subtitle:
        'Create a new indicator using mathematical operations or custom logic. Your calculation will show up as a new series in your query results.',
      editTitle: 'Editing Custom Calculation',
      editTitlePrefix: 'Editing',
      editSubtitle: 'Edit an existing custom calculation which will update the calculated values in your query results.',
      FieldsPanel: {
        title: 'Fields and Calculations:',
        tooltip: 'Click on an indicator to add it to the formula. Or click on a custom calculation dropdown to see more options.',
      },
      FormulaFieldTag: {
        noDataAsZeroLabel: "Treat 'No data' as 0 in calculation",
        close: 'Close',
      },
      FormulaPanel: {
        calculationTitle: 'Calculation Name',
        formulaTitle: 'Formula',
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
      successMessage: 'Data export download is complete. Check your Downloads folder.',
    },
  },

  query_result: {
    common: {
      all: 'All',
      sort_label: 'ክፍለ-መደብን ተራ አስይዝ:',
      ascending: 'ከትንሽ ወደ ትልቅ',
      descending: 'ከትልቅ ወደ ትንሽ',
      alphabetical: 'Alphabetical',
      show: 'አሳይ',
      results: 'ውጤቶች',
      settings: 'Settings',

      annotate: 'Annotate',
      download_query: {
        title: 'Download',
        shareText: 'Share',
        downloadExcel: 'Download as Excel',
        image_tab: 'Image',
        data_tab: 'Data',
        dimensions: 'Dimensions',
        annotate: 'Have something to add?',
        options: {
          allWithConstituents: 'All data - with constituents',
          timeSeries: 'Time series data',
          fieldMapping: 'Field ID to data element name mapping',
        }
      },
      download_as_image: {
        title: 'Download as Image',
        success: 'Image download is complete. Check your Downloads folder.',
        options: {
          current: 'Current size',
          fullscreen: 'Fullscreen',
          widescreen: 'Widescreen',
        },
        export: 'Export',
      },
      share_analysis: {
        title: 'Share via Email',
        externalUser: 'External user',
        titleToolTip: 'Send users your analysis via email directly from the platform itself',
        dataToolTip: 'Share your analysis with other users by email, by sending them a link or by exporting the data',
        primaryButtonText: 'Send',
        sendingProgress: 'Sending...',
        pendingShareAnalysisMessage: 'Your analysis will be shared shortly',
        attachingProgress: 'Attaching...',
        downloadingProgress: 'Downloading...',
        pendingDownload: 'Your data will download shortly, check the download folder',
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
        secondaryButtonTooltip: 'A preview email will be sent to your email address only',
        copyLinkText: 'Copy link to clipboard',
        generateBtnText: 'Generate Link',
        attachDataText: 'Attach Data (csv)',
        attachDataTextPreparingCSV: 'Attach Data (preparing csv...)',
        attachDataDropdownText: 'Attach Data (csv):',
        attachDataDropdownLabel: '0 selected',
        embedImageText: 'Embed image',
        noUsersPlaceholder: 'No users matching this email in the directory list.',
        errors: {
          invalidEmail: 'is not a valid email address',
          notPlatformEmail: 'email does not belong to a user on this platform',
          shareFailureMessage: 'Analysis sharing did not happen successfully',
          emptyMessage: 'Please enter a message',
          emptySubject: 'Please enter a subject',
          emptyRecipient: 'Please enter a correct recipient email',
          addedEmail: 'has already been added. Please enter a different email address.',
        },
        confirmationMessage: 'You are sending this analysis to a recipient who is not registered on the platform. External recipients are:',
        confirmationText: 'Attachments will include all data visible to you. Please confirm you would like to proceed.',
        confirmationModalText: 'Confirm Sharing',
        copyToClipboardSuccess: 'Shareable link was successfully copied to clipboard',
        copyToClipboardError: 'Failed to copy link. Click generate button to generate link',
        dashboardShare: {
          title: 'Share',
          titleTooltip: 'Share your analysis with other users by email, by sending them a link or by exporting the data',
          linkPrimaryButton: 'Copy URL',
          sentEmailSuccessMessage: 'The email was successfully sent to recipients',
          shareFailureMessage: 'There was an error while sharing dashboard',
          sendingPendingMessage: 'Your files will be sent shortly. This can take a few minutes.',
          sessionFetchError: 'There was a problem creating link, please try again later.',
          shareWithCurrentFilterLabel: 'Dashboard URL:',
          unsavedChangesMessage: 'You have unsaved changes on your dashboard. Please save your dashboard to share and download your latest dashboard.',
          useSingleEmailThread:'Include all recipients on a single thread',
          useSingleEmailThreadTooltip: 'Selecting this option will CC all recipients listed in "To". Doing so will add all recipients to the same thread and enable collaborative follow up via email.',
          attachmentsWarning: 'Note: Attachments to shared threads will include all data visible to you on this dashboard - they will not honor recipients’ data access rights.',
          attachmentSettings: {
            title: 'Attachment Settings',
            checkbox: 'Attachments respect recipients data access rights',
            message: 'When active, attachments will respect the data access rights of recipients. Each recipient\'s attachments will only include data that they would be able to see in the platform when signed in. This setting is active by default.',
            switchOn: 'Switch this setting off if you would like the attachments to include all the data you can see instead.',
            close: 'Close',
          },
          tabNames: {
            email: 'Email',
            addUsers: 'Add Users',
            download: 'Download',
            link: 'Link',
            scheduleReport: 'Schedule Report',
          },
          emailForm:{
            sendBtnText: 'Send Email',
            sendPreviewBtnText: 'Send Preview Email',
            sendingProgress: 'Sending....',
            sendPreviewTooltip: 'A preview email will be sent to your email address only',
            defaultSubject: 'Dashboard Analysis Shared',
            embedImageText: 'Embed Image',
            embedImageTooltip: 'Embed a JPEG image of your dashboard without page breaks',
            attachPdfText: 'Attach PDF',
            includeLinkText: 'Include dashboard link',
            attachPdfTooltip: 'Attached a PDF report of your dashboard with automatic page breaks',
            includeLinkTooltip: 'Include a button linking to the live dashboard in the email',
            messageTemplate: 'Hi, \n\nPlease find a dashboard created on %(platformName)s attached.\n\nThank you,\n%(yourName)s',
          },
          downloadDashboard: {
            title: 'Export Dashboard',
            downloadPendingMessage: 'Dashboard files are downloading. This can take a few moments…',
            noSelectedExportMessage: 'Select either PDF, JPEG or both to download dashboard',
            btnText: 'Download',
            options: {
              pdf: 'PDF',
              jpeg: 'JPEG',
            }
          },
          scheduleReport:{
            title: 'Scheduled Reports',
            send: 'Send to',
            createNewReportBtn: 'Create New Report',
            monthlySummary: '%(cadence)s - day %(day)s, %(time)s',
            scheduleSuccessMessage: 'Dashboard report has been scheduled successfully',
            scheduleFailureMessage: 'Dashboard report has been not scheduled, an error occured',
            editSuccess: 'Dashboard report schedule changes applied successfully',
            editFailure: 'Failed to save dashboard report schedule changes',
            noReportsMessage: 'No reports have been scheduled yet. Click on "Create New Report" to create a new scheduled dashboard report.',
            recipientsList: '%(firstRecipient)s, %(secondRecipient)s, and %(numOtherRecipients)s more',
            recipientsError: 'There should be at least one recipient',
            backButtonTooltip: 'Click to go back to scheduled reports',
            backButton: 'Back',
            deleteReportConfirmationMessage: 'Are you sure you want to delete this report?',
            deleteButton: 'Delete',
            closeButton: 'Cancel',
            deleteReportSuccess: 'Scheduled dashboard report deleted successfully',
            deleteReportTooltip:'Delete Report',
            editReportTooltip: 'Edit Report',
            daysOfWeek: {
              monday: 'Monday',
              tuesday: 'Tuesday',
              wednesday: 'Wednesday',
              thursday: 'Thursday',
              friday: 'Friday',
              saturday: 'Saturday',
              sunday: 'Sunday'
            },
            cadences: {
              monthly: 'Monthly',
              weekly: 'Weekly',
              daily: 'Daily',
            },
            form: {
              on: 'on',
              onDay: 'on day',
              at: 'at',
              send: 'Send',
              message:'Your scheduled delivery is ready. You can access this dashboard through the link below.',
              schedule: 'Schedule',
              edit: 'Apply Changes',
              timezone: 'Timezone: UTC',
              subject: 'Scheduled Report: %(dashboardName)s'
            },
          }
        },
      },
      download_as_pdf: 'Download as PDF',
      download_as_docx: 'Download as DOCX',
      download_as_pptx: 'Download as PPTX',
      noDataResults: {
        noDataFound: "We couldn't find any data",
        producedNoResults: "Your query produced 0 results",
        try: "Try the following:",
        indicator: "Querying a new indicator",
        groupBy: "Removing a Group By",
        filters: "Refining your Filters",
      },
    },
    controls: {
      best_fit_line_label: 'Line of best fit',
      geography_options: 'Geography tile options',
      display_title: 'Display',
      divergent_coloration: 'Divergent Coloration',
      dropdown_first_yaxis: 'Y1-Axis',
      dropdown_second_yaxis: 'Y2-Axis',
      et_checkbox: 'Show Ethiopian Dates',
      limit_results: 'Limit results',
      log_checkbox: 'Logarithmic Scaling',
      invert_coloration: 'Invert Coloration',
      sort_label: 'Sort order',
      sort_on: 'Sort by',
      selected_field: 'Selected field',
      stack_bars: 'Stack series',
      time_bucket_mean: 'Ave. Bucketed Values',
      y2_line_graph: 'Display Y2 as Line',
      value_display_time_checkbox: 'Show Time on Y-Axis',
      value_display_checkbox: 'Show Values',
      bucket_by_time: 'Bucket by time',
      group_by: 'Group By',
      date: 'Date',
      indicator: 'Indicator',
      selectIndicator: 'Select Indicator',
      theme: 'Theme',
      no_data_to_zero_labels: 'Display \'No Data\' results as zero',
    },
    bar: {
      yaxis_title: 'Recorded number',
      sort_by_date: 'Date',
      remove_bar_spacing: 'Remove bar spacing',
      date_label_format: 'Date format',
      hide_grid_lines: 'Hide grid lines',
      rotate_data_value_labels: 'Rotate data value labels',
      rotate_x_axis_labels: 'Rotate X-Axis labels',
      hide_data_value_zeros: 'Hide value labels equal to zero',
      default_time_format: 'Default',
      no_data_to_zero_labels: 'Display \'No Data\' results as zero',
    },
    bubblechart: {
      bubble_size: 'Bubble size',
      error_message:
        'This view requires a combination of 2 or more fields selected.',
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
      too_many_constituents_error:
        'has too many constituents and could not be disaggregated',
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
      adminBoundaryLevel: 'Level',
      color_map_toggle: 'Use preset filter colors',
      marker_scaled_toggle: 'Scaled markers',
      filter_map_bubbles: 'Search',
      display_option_dots: 'Dots',
      display_option_heatmap: 'Heatmap',
      display_option_scaled_dots: 'Scaled dots',
      display_option_tiles: 'Colored tiles',
      disclaimer: {
        text:
          'locations are not displayed due to lack of latitude/longitude coordinates.',
        geojson_text:
          'Uncolored map areas are yet to be matched with database entries.',
        view_names: 'View Names',
        modal_title: 'Locations Missing Lat/Long Data',
        modal_close: 'Close',
      },
      labels_legend_title: 'Labels',
      layers: {
        Satellite: 'Satellite',
        Streets: 'Streets',
        Light: 'Light',
        Blank: 'Blank',
      },
      shapeOutlineWidthOptions: {
        none: 'None',
        thin: 'Thin',
        normal: 'Normal',
        thick: 'Thick',
      },
      boundaryThickness: 'Boundary Thickness',
      show_labels: 'Display Map Labels',
      show_series: 'Show Series',
      showAdminBoundaries: 'Show administrative boundaries',
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
      entity_layer_panel: {
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
      error:
        'Sorry, an error has occurred and we cannot render this visualization.',
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

      confirmationTitle: 'Added to dashboard',
      confirmationText: 'Your query has been saved to ',
      confirmationPrimaryButton: 'Continue working',
      confirmationSecondaryButton: 'Go to dashboard',
    },

    FilterModal: {
      applyRules: 'Apply rules',
      title: 'Filter data',
      titleTooltip: 'Remove values from your query results',
      addFilterRule: 'Add filter rule',
      noFiltersAdded: 'You have not created any filter rules yet',
      rulesAreIncomplete: {
        one: 'You have %(count)s incomplete rules',
        other: 'You have %(count)s incomplete rule',
      },
      FilterRuleRow: {
        value: 'value',
        forTheFollowingIndicator: 'For the following indicator',
        selectAnIndicator: 'select an indicator',
        chooseOption: 'choose option',
        iWantToRemove: 'I want to remove',
        dataPoints: 'data points',
        removeFilterRuleTooltip: 'Delete filter rule',
        ABOVE_AVERAGE: 'above average',
        ABOVE_VALUE: 'values above',
        BELOW_AVERAGE: 'below average',
        BELOW_VALUE: 'values below',
        BOTTOM: 'bottom',
        EQUAL_TO_NULL: 'equal to null',
        EQUAL_TO_ZERO: 'equal to zero',
        TOP: 'top',
      },
    },
  },

  Navbar: {
    alerts: 'Alerts',
    analyze: 'Analyze',
    userManual: 'User Manual',
    createNewDashboard: 'Create',
    create: 'Create',
    createDashboardTitlePrompt:
      'What would you like to name your new dashboard?',
    dashboardsFlyoutLabel: 'Dashboards',
    emptyDashboardNameError: 'Cannot create dashboard with empty name',
    lastDataRefresh: 'Last data refresh',
    buildVersion: 'Build version',
    loggedInAs: 'Logged in as',
    dataQuality: 'Data Quality',
    more:'More',
    mobileOptimizationDisclaimer: 'This page is not optimized for use on mobile.',
    offlineError: 'There is no Internet connection, please try reconnecting.',
    help: {
      label: 'Help',
      search: 'Search Helpdesk',
      chat: 'Chat with us',
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

  RawDataUploadApp: {
    selectFiles: 'Please select data files that you would like to queue for integration.',
    browseFiles: 'Browse for files',
    uploadProgress: 'Upload Progress:',
    successMessage: 'Success: Uploaded data is queued for integration.',
    failureMessage: 'Failure: Data did not upload successfully. Check your connection or consult a project manager for assistance.',
    dataNotAvailableYetMessage: 'Your data is not yet available in the platform.',
    waitForAnEngineerMessage: 'An engineer has been notified and will integrate the data shortly.',

    UploadDropdown: {
      dropdownLabels: {
        province: 'Província',
        dataCategory: 'Tipo de Dados',
      },
    },
  },

  CaseManagementApp: {
    notConfiguredYet: 'This app has not been fully configured yet.' ,
    CaseEvent: {
      dataSubmitted: 'Data Submitted',
      source: 'Source:',
      status: 'Status:',
      user: 'User:',
      why: 'Why?',
    },

    OverviewPage: {
      allCases: 'All Cases',
      showAll: 'Show all',
      hideAll: 'Hide all',

      AllCasesTable: {
        name: 'Name',
        lastDataAvailable: 'Last Data Available',
      },
      CaseFilterSection: {
        any: 'Any',
        caseTypeToLookAt: 'I want to look at',
        dataset: 'dataset',
        datasetToLookAt: 'with data from',
      },
      ExportButton: {
        export: 'Export',
        name: 'Name',
        lastDataAvailable: 'Last Data Available',
      },
      RecencyStats: {
        day: 'day',
        days: 'days',
      },

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
          title: {
            one: '%(count)s Title',
            other: '%(count)s Titles',
          },
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
      noData: 'There is no data for this page.'
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
      alertDatePeriod: 'For date period',
      alertReason: 'Alert reason',
      alertReportedValue: 'Reported value',
      alertSource: 'Alert source',
      alertTriggeredOn: 'Triggered on',
      openLinkError: 'Could not open link. Try again later',
      DossierRow: {
        edit: 'Edit',
      },
      EditMetadataModal: {
        edit: 'Edit',
        editing: 'Editing:',
        metadataChangeTitle: 'Changed %(metadataName)s',
        metadataChangeSummary: 'Changed %(metadataName)s to %(metadataValue)s',
      },
    },

    QuickStats: {
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
    DataQualityErrors: {
      lackOfDataError: 'Could not compute a quality score for this indicator due to lack of data.',
    },
    indicator: 'Indicator',
    selectIndicator: 'Select Indicator',
    veryLow: 'very low',
    low: 'low',
    medium: 'medium',
    high: 'high',
    veryHigh: 'very high',
    DataQualitySummary: {
      dateRange: 'Date Range',
      filter: 'Filter',
      MapVisualization: {
        indicatorCharacteristics: 'Indicator Characteristics Score',
        outlierAnalysis: 'Data Outlier Analysis Score',
        overallScore: 'Overall Score',
        reportingCompleteness: 'Reporting Completeness Score'
      },
      ScoreSummaryBadge: {
        beta: 'beta',
        explanationOne: 'This score aims to quantify the reporting and data quality for this indicator based on the factors detailed in each of the below tabs.',
        explanationTwo: 'It should not be taken as an authoritative score on its own. It can be used to prioritize between indicators and as a starting point to investigate and isolate issues using the tools provided below.',
        explanationThree: 'There may be quality issues which are not accounted for in the score and some indicators may have a low score where there is no real quality issue. Examples include cases where there is strong seasonality or a non-standard reporting cadence and structure. These cases should be observable with the tools below by an analyst with programmatic knowledge.',
        qualityScore: 'Quality Score',
        whatDoesThisMean: 'What does this mean?',
      },
    },
    DataQualityTabs: {
      indicatorCharacteristics: 'Indicator Characteristics',
      outlierAnalysis: 'Data Outlier Analysis',
      reportingCompleteness: 'Reporting Completeness',
      title: 'The Quality Score is based on the following factors...',
    },
    IndicatorCharacteristicsTab: {
      days: 'Days',
      weeks: 'Weeks',
      months: 'Months',
      years: 'Years',
      indicatorAgeCard:{
          explanation:"Older indicators tend to be more established and encounter fewer issues common among new indicators. The larger the number of reporting periods an indicator has been reported for, the better it is for the score.",
          title:"Indicator Age",
          metric:"%(age)s %(timeUnit)s",
          metricSubtitle:"%(firstReportDate)s till %(lastReportDate)s"
      },
      timeSinceReportReceivedCard:{
          explanation:"A recent last report means that fresh data is available and being collected. The fewer reporting periods that have passed since the most recent report was received, the better it is for the score.",
          title:"Time Since Last Report",
          metric:"%(reportAge)s %(timeUnit)s",
          metricSubtitle:"Last report %(lastReportDate)s"
      },
      completenessTrendCard:{
          title:"Completeness Trend",
          positive: 'Positive',
          negative: 'Negative',
          explanation:"This shows the direction of the trend line for number of reports received per reporting period in the selected date range. A negative trend is bad for the quality score.",
      },
      reportingPeriodCard: {
        daily: "Daily",
        explanation: "The estimated reporting period is based on the average time observed between reports analyzed. While this does not directly affect the quality score, it is used as an input when computing some parts of the quality score.",
        metricSubtitle: "Average time between reports: %(numDays)s days",
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        title: "Estimated Reporting Period",
        unknown: 'Unknown',
        weekly: 'Weekly',
        yearly: 'Yearly',
      },
    },
    ReportingCompletenessTab: {
      subtitle: 'These tools are here to help you isolate where reporting completeness issues are coming from so you can help resolve them or share the results with those who can.',
      title: 'Investigate Reporting Completeness Issues',
      ExplainerSection: {
        reportsReceivedStats: '# of reports received per reporting period: Avg %(average)s, Min %(min)s, Max %(max)s, Mode %(mode)s, Stddev %(stdDev)s',
        consistency: 'Consistency in number of reports received:',
        reportsAnalyzed: 'reports have been received since',
        reportsAnalyzedSmallprint: 'The line graph shows the trend of these reports over time and the table below it lists only those facilities which have reported for this indicator by default.',
        scoreExplanationSmallprint: 'The higher the consistenty in number of reports received, the better it is for the quality score. This is because if the number of reports received changes a lot across the periods being analyzed, it likely means there were fewer reports received than expected during some of the reporting periods.',
      },
      NumberReportsTimeSeries: {
        aggregation: 'Aggregation',
        all: 'All',
        helperText: 'Use this line graph to observe reporting trends and find times where fewer reports than expected were received. Clicking on a dot will filter the table below to that time period only.',
        limitResults: 'Limit Results',
        national: 'National',
        noData: 'There is no data to display',
        title: 'Total Number of Reports Received by Reporting Period For This Indicator',
        LineGraph: {
          xLabel: 'Reporting Period',
          yLabel: 'Number of Reports Received',
          Tooltip: {
            reports: 'Reports Received',
            date: 'Date'
          }
        },
      },
      ReportingFacilitiesTable: {
        helperText: 'This table shows the number of reports and time since reports have been received by location. You can expand from "%(largestGeoDimension)s" all the way down to see this information at the %(smallestGeoDimension)s level.',
        search: "Search",
        title: 'Reporting Facilities For This Indicator',
        yes: 'Yes',
        no: 'No',
        header: {
          daysSince: 'Days Since Last Report',
          lastReport: 'Last Report',
          numPeriodsWithReport: '# Periods With Report',
          numPeriodsWithNoReport: '# Periods With No Report',
          percentagePeriodsWithReport: '% of Periods With Report',
        },
        download: 'Download Data',
        downloadFileName: 'Reporting Facilities'
      },
    },
    OutlierAnalysisTab: {
      subtitleOne: "This tool is intended to help you isolate data points which are outliers relative to the mean for each facility.",
      subtitleTwo: "Each dot on the box plot represents the % of reported values that are outliers for a single facility.",
      subtitleThree: "You can click on each dot to view that facility's data on a time series below and see which datapoints are outliers relative to the mean. Some of the outliers may be erroneous and require follow up with the facility to understand & resolve.",
      title: "Investigate Outliers",
      ExplainerSection: {
        scoreTitle: 'Data Outlier Analysis Score Explanation',
        extremeOutlierLabel: 'Proportion of facility data points that are extreme outliers:',
        moderateOutliersLabel: 'Proportion that are moderate outliers:',
        reportsAnalyzedOne: 'reports have been received from',
        reportsAnalyzedTwo: ' facilities since',
        reportsAnalyzedSmallprint: 'Note that the mean value for each facility is calculated using all historical data, even if you have a time filter set. Options to choose dates to exclude from this calculation are coming soon and will be found here.',
        scoreExplanationSmallprint: 'This tool identifies data points that are extreme outliers (3+ standard deviations from the mean) and moderate outliers (2-3 standard deviations) relative to a facility\'s historical mean. The higher the average proportion of outliers, the worse it is for the quality score.',
        scoreExplanationNote: 'Note that for indicators with strong seasonality, there will be a higher proportion of outlier data points by definition and this may not mean there are actual data quality issues.'
      },
      OutliersOverviewVizTabs: {
        boxPlot: 'Box Plot',
        table: 'Table',
      },
      OutliersBoxPlot: {
        title: "%% of facility data points that are %(outlierType)soutliers by %(geography)s",
        yAxisLabel: "%% of facility data points that are %(outlierType)soutliers",
        moderate: 'moderate',
        extreme: 'extreme',
        Tooltip: {
          unknown: 'Unknown',
          percentageOutliers: '% of reported values that are outliers',
          clickToView: 'Click to view reported data & outliers on time series below',
        }
      },
      OutliersTable: {
        columns: {
          numOutliers: '# Outlier Reports',
          numValues: '# All Reports',
          percentageOutliers: '% Outlier Reports',
        }
      },
      LineGraph: {
        extremeLowerBound: 'Extreme (3+ stdev from mean) outlier lower bound',
        extremeUpperBound: 'Extreme (3+ stdev from mean) outlier upper bound',
        facility: 'Facility',
        mean: 'Mean',
        noData: 'There is no data to display',
        noFacilitySelectedExplanation: 'Click a datapoint on the box plot above to view that facility\'s data with outliers marked here',
        noFacilitySelectedTitle: 'No facility Selected',
        outlierLowerBound: 'Moderate (2+ stdev from mean) outlier lower bound',
        outlierUpperBound: 'Moderate (2+ stdev from mean) outlier upper bound',
        title: 'Report values and Outlier Boundaries',
        xLabel: 'Reporting Period',
        Tooltip: {
          value: 'Value',
          date: 'Date'
        },
      },
      Settings: {
        aggregationLabel: 'Aggregation',
        outlierTypeLabel: 'Outlier type',
        title: 'Settings',
        outlierType: {
          all: 'All (2+ stdev from mean)',
          moderate: 'Moderate (2-3 stdev from mean)',
          extreme: 'Extreme (3+ stdev from mean)',
        }
      },
    },
    TabSpecificFilters: {
      dateRange: 'Date Range',
      categorical: 'Categorical',
      title: "Filters",
    },
    DimensionValueFilterSelector: {
      addFilter: 'Add Filter',
    },
    MetricBox: {
      notApplicable: 'N/A',
    }
  },

  GridDashboardApp: {
    GridDashboardControls: {
      DashboardSettingsModal: {
        DashboardUsersTable: {
          tableText: {
            name: 'Name',
            email: 'Email',
            role: 'Role',
          },
          dropdownTitle: 'Add users and groups',
        },
      },
    },
    DashboardEditableTextItem: {
      done: 'Done',
      hideEdit: 'Hide Edit',
      lock: 'Lock position',
      textElementPlaceholder: 'Add text here',
      tooltip: 'To edit this text, choose the option in the menu at the top right of this tile.',
      unlock: 'Unlock position',
    },
    DashboardIFrameItem: {
      lock: 'Lock position',
      unlock: 'Unlock position',
    },
    DashboardQueryItem: {
      lock: 'Lock position',
      unlock: 'Unlock position',
      edit: 'Edit Chart',
      filter: 'Filter Data',
      download: 'Download as Image',
      export: 'Export Data',
      calculations: 'Custom Calculations',
      settings: 'Settings',
    },
    DashboardQueryPane: {
      add: 'Add',
      close: 'Close',
      filtersTitle: 'Filters',
      groupingTitle: 'Group by',
    },
  },

  visualizations: {
    BarGraph: {
      BarGraphControlsBlock: {
        alphaSort: 'Alphabetical',
        applyMinimumBarHeight: 'Apply minimum bar height',
        barDirectionLabel: 'Bar direction',
        barTreatmentLabel: 'Bar treatment',
        horizontalBar: 'Horizontal',
        overlaidBar: 'Overlaid',
        overlappingBar: 'Overlapping',
        rotateInnerGroupLabels: 'Rotate inner x-axis labels',
        sequentialBar: 'Sequential',
        stackedBar: 'Stacked',
        verticalBar: 'Vertical',
      },
    },
    BoxPlot: {
      BoxPlotControlsBlock: {
        dimensionLevel: 'Display grouping level',
        showDistribution: 'Show distribution',
        showOutliers: 'Show outliers',
      },
    },
    MapViz: {
      BackgroundLayerButton: {
        buttonTooltip: 'Change background layer',
        title: 'Background layer',
      },
      EntityLayer: {
        EntitySelectionPanel: {
          addEntities: 'Add entities',
          buttonTooltip: 'Select map entities',
          selectDisplayType: 'Display',
          showEntities: 'Show entities',
        },
      },
      QueryResultLayer: {
        SearchBox: {
          placeholder: 'Filter results',
        },
      },
    },
    NumberTrend: {
      Settings: {
        primaryField: 'Primary Field',
        secondaryField: 'Secondary Field',
        displayAsPill: 'Display as pill',
        displayLastValue: 'Display last value',
      },
      Tooltip: {
        date: 'Date',
        value: 'Value',
      }
    },
    Table: {
      nullDimensionValueTooltip: 'This row shows the value for all data where %(dimensionName)s is unknown or unmatched. This may happen for a few reasons such as when data is not reported against a certain group by at all or when locations have not been matched to the Master Facility List. Contact your data manager to resolve unknown or unmatched cases.',
      nullDimensionValue: 'Empty',
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
        enableCasePageLinking: 'Link to %(caseTypeName)s case pages',
        enablePagination: 'Paginate results',
        fitWidth: 'Fit Width',
        invertColoration: 'Invert coloration',
        maxColumnWidth: 'Maximum Column Width',
        mergeTableCells: 'Merge Table Cells',
        minColumnWidth: 'Minimum Column Width',
        scorecard: 'Scorecard',
        table: 'Table',
        tableFormat: 'Table type',
        wrapColumnTitles: 'Wrap Column Titles',
      },
    },
    common: {
      noData: 'No data',
      notANumber: 'Not a Number',
      SettingsModal: {
        title: 'Settings',
        AxesSettingsTab: {
          goalLineValue: 'Goal Line Value',
          goalLineLabel: 'Goal Line Label',
          goalLineFontSize: 'Goal Line Font Size',
          goalLineColor: 'Goal Line Color',
          goalLineThickness: 'Goal Line Thickness',
          goalLineStyle: 'Goal Line Style',
          goalLineStyleSolid: 'Solid',
          goalLineStyleDashed: 'Dashed',
          xAxis: {
            title: 'X-Axis',
            labels: {
              title: 'Title',
              titleFontSize: 'Title font size',
              labelsFontSize: 'Labels font size',
              titleFontColor: 'Title font color',
              labelsFontFamily: 'Labels font',
              titleFontFamily: 'Title font',
              labelsFontColor: 'Labels font color',
              additionalAxisTitleDistance: 'Axis title padding',
            },
          },
          y1Axis: {
            title: 'Y1-Axis',
            labels: {
              title: 'Title',
              titleFontSize: 'Title font size',
              labelsFontSize: 'Labels font size',
              titleFontColor: 'Title font color',
              labelsFontFamily: 'Labels font',
              titleFontFamily: 'Title font',
              labelsFontColor: 'Labels font color',
              rangeFrom: 'Range',
              rangeTo: 'to',
            },
          },
          y2Axis: {
            title: 'Y2-Axis',
            labels: {
              title: 'Title',
              titleFontSize: 'Title font size',
              labelsFontSize: 'Labels font size',
              titleFontColor: 'Title font color',
              labelsFontFamily: 'Labels font',
              titleFontFamily: 'Title font',
              labelsFontColor: 'Labels font color',
              rangeFrom: 'Range',
              rangeTo: 'to',
            },
          },
        },
        GeneralSettingsTab: {
          displayOptionsHeader: 'Display options',
          TitleBlock: {
            heading: 'Title',
            labels: {
              titleFontSize: 'Title font size',
              subtitleFontSize: 'Subtitle font size',
              titleFontColor: 'Title font color',
              titleFontFamily: 'Title font',
              title: 'Title',
              subtitle: 'Subtitle',
            },
          },
          GoalLineSection: {
            goalLineHeader: 'Goal line',
            defaultValue: 'e.g. 100',
            defaultLabel: 'e.g. Target',
            value: 'Value',
            label: 'Label',
            goalLineStyleSolid: 'Solid',
            goalLineStyleDashed: 'Dashed',
            axis: 'Axis',
            addButton: 'Click to add goal lines',
            editButton: 'Click to edit your goal lines',
          },
        },
        SeriesSettingsTab: {
            SeriesRow: {
              addColorActionTooltip: 'Add one or more color rules for each series',
              top: 'Top',
              center: 'Center',
              bottom: 'Bottom',
              hide: 'Hide series',
              show: 'Show series',
              bar: 'bar',
              line: 'line',
              dotted: 'points',
              noEmpty: 'Series labels cannot be empty',
            },
            tableHeaders: {
              seriesLabel: 'Series label',
              dataLabelFormat: 'Value display format',
              dataLabelFontSize: 'Value font size',
              yAxis: 'Y-Axis',
              color: 'Color',
              colorActions: 'Color rules',
              showSeriesValue: 'Show value',
              barLabelPosition: 'Bar value position',
              visualDisplay: 'Visual style',
            },
          ColorRulesContainer: {
            ColorLabelRow: {
              rangeLabel: 'Range label',
            },
            ColorRuleRow: {
              removeColorRuleTooltip: 'Delete color rule',
            },
            ColorRuleConfig: {
              '2': 'Medians (equal halves)',
              '3': 'Tertiles (equal thirds)',
              '4': 'Quartiles (equal fourths)',
              '5': 'Quintiles (equal fifths)',
              '10': 'Deciles (equal tenths)',
              ABOVE_AVERAGE: 'above average',
              ABOVE_VALUE: 'values above',
              BELOW_AVERAGE: 'below average',
              BELOW_VALUE: 'values below',
              BOTTOM: 'bottom',
              EQUAL_TO_NULL: 'equal to null',
              IN_QUANTILE: 'preset ranges',
              IN_VALUE_RANGE: 'custom ranges',
              IS_TRUE: 'True',
              IS_FALSE: 'False',
              TOP: 'top',
              chooseOption: 'Choose option',
              iWantToColor: 'I want to color',
              basedOn: 'based on',
              dataPointsUsingTheFollowingColor: 'data points using the following color:',
              enterAValue: 'enter a value',
              quantiles: 'Quantiles',
              usingTheFollowingColors: 'using the following colors:',
            },
            QuantileRangeRow: {
              ordinals: {
                '1': 'First',
                '2': 'Second',
                '3': 'Third',
                '4': 'Fourth',
                '5': 'Fifth',
                '6': 'Sixth',
                '7': 'Seventh',
                '8': 'Eighth',
                '9': 'Ninth',
                '10': 'Tenth',
              },
              quantiles: {
                '2': 'half',
                '3': 'tertile',
                '4': 'quartile',
                '5': 'quintile',
                '10': 'decile',
              },
              rangeLabel: 'Range label',
              quantileOfData: '%(ordinal)s %(quantile)s (%(startPercent)s-%(endPercent)s of data)',
            },
            ValueRangeRow: {
              addNewRange: 'Add new range',
              removeRange: 'Remove range',
              rangeLabel: 'Range label',
              min: 'Min',
              max: 'Max',
            },
          },
        },
        LegendSettingsTab: {
          showLegend: 'Show legend',
          overlapLegendWithChart: 'Overlap legend with chart',
          legendFontSize: 'Legend font size',
          legendFontColor: 'Legend font color',
          legendFont: 'Legend font',
          legendPlacement: 'Legend placement',
          legendPlacements: {
            top: 'Top',
            topRight: 'Top Right',
            left: 'Left',
            right: 'Right',
            bottom: 'Bottom',
          },
        },
        TableThemesSettingsTab: {
          title: 'Themes',
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
      Title: {
        more: 'more',
      },
      warnings: {
        emptyFields: 'This query returned no data for these fields: ',
        server:
          'Something went wrong while running the query. Please try again shortly.',
      },
    },
    labels: {
      animatedMap: 'Animated map',
      animatedHeatMap: 'Animated heat map',
      barLine: 'Bar & Line',
      boxplot: 'Box plot',
      bumpChart: 'Ranking',
      chart: 'Bar chart',
      epicurve: 'Epicurve',
      expando: 'Hiérarchie',
      heatmap: 'Heatmap',
      heatTiles: 'Heat tiles',
      map: 'Map',
      number: 'Number',
      numberTrend: 'Number and trend',
      overlappingBar: 'Overlapping bar',
      pieChart: 'Pie chart',
      quality: 'Quality',
      stackedBar: 'Stacked bar',
      scorecard: 'Scorecard',
      scatterplot: 'Scatterplot',
      sunburst: 'Sunburst',
      time: 'Time series',
      table: 'Table',
    },
  },
  login: {
    modal_title: 'Note',
    registration_title: 'Request Access',
    content_l1:
    'To submit feedback about EHDAP or request an account for access, please click Continue below.',
    content_l2:
      "Note that at this time accounts are only being granted to the users as per the ministry's approval.",
    content_l3:
    'Please make sure that you get the approval from the ministry before you submit a request.',
    continue_btn: 'Continue',
    cancel_btn: 'Cancel',
  },

  models: {
    core: {
      Calculation: {
        AverageCalculation: {
          description: 'Find the average value of the data points reported.',
          displayName: 'Average',
        },
        AverageOverTimeCalculation: {
          description: 'Find the average value of the data points reported over time.',
          displayName: 'Average Over Time',
        },
        CohortCalculation: {
          description: 'Track a cohort over time.',
          displayName: 'Cohort',
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
        FormulaCalculation: {
          description: 'Compute the value by evaluating a mathematical formula.',
          displayName: 'Formula',
        },
        LastValueCalculation: {
          description: 'Calculate the value of the data points with the latest date',
          displayName: 'Last Value',
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
        WindowCalculation: {
          description: 'Calculate the value over a moving window of time.',
          displayName: 'Moving Window',
        },
      },

      QueryResultSpec: {
        ValueRule: {
          aboveAverage: 'Above average (> %(average)s)',
          belowAverage: 'Below average (< %(average)s)',
          bottom: 'Bottom %(num)s',
          top: 'Top %(num)s',
          values: 'Values',
          quantileOfData: '%(ordinal)s %(quantile)s',
          ordinals: {
            '1': 'First',
            '2': 'Second',
            '3': 'Third',
            '4': 'Fourth',
            '5': 'Fifth',
            '6': 'Sixth',
            '7': 'Seventh',
            '8': 'Eighth',
            '9': 'Ninth',
            '10': 'Tenth',
          },
          quantiles: {
            '2': 'half',
            '3': 'tertile',
            '4': 'quartile',
            '5': 'quintile',
            '10': 'decile',
          },
          IsFalseRule: {
            ruleString: 'Values are False (= 0)',
          },
          IsTrueRule: {
            ruleString: 'Values are True (> 0)',
          },
        },
      },
    },
    AlertsApp: {
      AlertDefinition: {
        day: 'Day',
        month: 'Month',
        week: 'Week',
        filtersSummary: '%(number)s applied',
        none: 'None',
      },
    },
    CaseManagementApp: {
      AlertCaseCoreInfo: {
        alertExplanationSingleDate: '%(title)s on %(date)s',
        alertExplanationDateRange: '%(title)s for date period %(date)s',
        to: 'to',
      },
    },
    FeedApp: {
      AnalysisSharedUpdate: {
        analysisSharedText: '%(name)s shared a query with you.',
      },
      DashboardDataUpdate: {
        dashboardsDataUpdated: 'You have %(numDashboards)s dashboard(s) with new data. Click below to see which dashboards got updated.',
      },
      NewFieldsUpdate: {
        newFieldsText: '%(numIndicators)s new indicators have been integrated into the platform.',
      },
      util: {
        minuteAbbr: 'min',
        hourAbbr: 'hr',
        dayAbbr: 'd',
        weekAbbr: 'wk',
      },
    }
  },
  services: {
    AdvancedQueryApp: {
      FieldHierarchyService: {
        mruGroupingName: 'Most Recently Used Indicators',
      }
    },
    SessionSyncService: {
      sessionsUnsupported: 'Your browser does not support persisting query sessions. Refreshing your browser will reset your queries.',
    },
    AuthorizationService: {
      updateRoleSuccess: 'Role was successfully updated.',
      createRoleSuccess: 'Role was successfully created.',
      deleteRoleSuccess: 'Role was successfully deleted.',
      updateRoleUsersSuccess: 'Role users was successfully updated',
    },
    DirectoryService: {
      updateGroupSuccess: 'Group was successfully updated.',
      createGroupSuccess: 'Group was successfully created.',
      deleteGroupSuccess: 'Group was successfully deleted.',
      updateGroupUsersSuccess: 'Group users was successfully updated',
      duplicateGroupNameError: 'Group name "%(name)s" already exists. Please select another name.',
    },
  },
};

/* eslint-enable max-len */
