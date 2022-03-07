// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import StaticPill from 'components/AdminApp/StaticPill';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';
import { getQueryPolicyAccessDots } from 'components/AdminApp/disaggregateQueryPolicies';
import { getSitewideColorBlocks } from 'components/AdminApp/RoleManagementTab/getSitewideColorBlocks';
import type RoleDefinition from 'services/models/RoleDefinition';

const TEXT = t('admin_app.GroupsTab.GroupViewModal.GroupDetailsTab');

type Props = {
  name: string,
  numAlertACLs: number,
  numDashboardACLs: number,
  numUsers: number,
  onNameInputChange: (name: string) => void,
  roles: $ReadOnlyArray<RoleDefinition>,
};

export default function GroupDetailsTab({
  name,
  numAlertACLs,
  numDashboardACLs,
  numUsers,
  onNameInputChange,
  roles,
}: Props): React.Element<typeof Group.Vertical> {
  const nameSection = (
    <Group.Vertical spacing="m">
      <Heading size={Heading.Sizes.SMALL}>{TEXT.name}</Heading>
      <InputText.Uncontrolled
        debounce
        id={TEXT.name}
        initialValue={name}
        onChange={onNameInputChange}
        testId="group-name-input"
      />
    </Group.Vertical>
  );

  const toolPills = () => {
    const tools = roles.flatMap(role => role.getTools().arrayView());
    const uniqueTools = [...new Set(tools)];
    return uniqueTools.map(tool => (
      <div key={tool}>
        <StaticPill label={TEXT[tool]} />
      </div>
    ));
  };

  const toolsSection = (
    <LabelWrapper
      className="group-view-modal__label-wrapper"
      label={TEXT.tools}
    >
      <Group.Horizontal spacing="xxs">{toolPills()}</Group.Horizontal>
    </LabelWrapper>
  );

  const renderDataAccessSection = () =>
    getQueryPolicyAccessDots(
      roles.flatMap(role => role.getQueryPolicies().arrayView()),
    );

  const renderItemAccessSection = () => (
    <LabelWrapper
      className="group-view-modal__label-wrapper"
      label={TEXT.itemAccess}
    >
      <Group.Vertical className="group-view-modal__info" spacing="xxs">
        <Group.Horizontal>
          <div className="group-view-modal__dot" />
          {`${numDashboardACLs} ${TEXT.dashboards}`}
        </Group.Horizontal>
        <Group.Horizontal>
          <div className="group-view-modal__dot" />
          {`${numAlertACLs} ${TEXT.alerts}`}
        </Group.Horizontal>
      </Group.Vertical>
    </LabelWrapper>
  );

  const {
    DASHBOARD_VIEWER,
    DASHBOARD_EDITOR,
    DASHBOARD_ADMIN,
    ALERT_VIEWER,
    ALERT_EDITOR,
    ALERT_ADMIN,
  } = RESOURCE_ROLE_MAP;
  const renderDashboardBlocks = () => {
    let dashboardColorBlocks = getSitewideColorBlocks('');
    const dashboardSitewideRoles = roles.map(role =>
      role.getSitewideDashboardRoleName(),
    );
    if (dashboardSitewideRoles.includes(DASHBOARD_ADMIN)) {
      dashboardColorBlocks = getSitewideColorBlocks(DASHBOARD_ADMIN);
    } else if (dashboardSitewideRoles.includes(DASHBOARD_EDITOR)) {
      dashboardColorBlocks = getSitewideColorBlocks(DASHBOARD_EDITOR);
    } else if (dashboardSitewideRoles.includes(DASHBOARD_VIEWER)) {
      dashboardColorBlocks = getSitewideColorBlocks(DASHBOARD_VIEWER);
    }
    return (
      <Group.Horizontal spacing="xxs">
        {dashboardColorBlocks.view}
        {dashboardColorBlocks.edit}
        {dashboardColorBlocks.admin}
      </Group.Horizontal>
    );
  };

  const renderAlertBlocks = () => {
    let alertColorBlocks = getSitewideColorBlocks('');
    const alertSitewideRoles = roles.map(role =>
      role.getSitewideAlertRoleName(),
    );
    if (alertSitewideRoles.includes(ALERT_ADMIN)) {
      alertColorBlocks = getSitewideColorBlocks(ALERT_ADMIN);
    } else if (alertSitewideRoles.includes(ALERT_EDITOR)) {
      alertColorBlocks = getSitewideColorBlocks(ALERT_EDITOR);
    } else if (alertSitewideRoles.includes(ALERT_VIEWER)) {
      alertColorBlocks = getSitewideColorBlocks(ALERT_VIEWER);
    }
    return (
      <Group.Horizontal spacing="xxs">
        <Group.Vertical flex spacing="none" alignItems="center">
          {alertColorBlocks.view}
          <div className="role-card__sitewide-access-descriptor">
            {TEXT.view}
          </div>
        </Group.Vertical>
        <Group.Vertical flex spacing="none" alignItems="center">
          {alertColorBlocks.edit}
          <div className="role-card__sitewide-access-descriptor">
            {TEXT.edit}
          </div>
        </Group.Vertical>
        <Group.Vertical flex spacing="none" alignItems="center">
          {alertColorBlocks.admin}
          <div className="role-card__sitewide-access-descriptor">
            {TEXT.admin}
          </div>
        </Group.Vertical>
      </Group.Horizontal>
    );
  };

  const sitewideAccess = (
    <LabelWrapper
      className="group-view-modal__label-wrapper"
      label={TEXT.sitewideAccess}
    >
      <Group.Horizontal flex alignItems="flex-start">
        <Group.Vertical className="group-view-modal__info" spacing="xxs">
          {TEXT.dashboardCreator}
          {TEXT.alertsApp}
        </Group.Vertical>
        <Group.Vertical spacing="xxs">
          {renderDashboardBlocks()}
          {renderAlertBlocks()}
        </Group.Vertical>
      </Group.Horizontal>
    </LabelWrapper>
  );

  const totalMembers = t('totalMembers', {
    scope: 'admin_app.GroupsTab.GroupViewModal.GroupDetailsTab',
    count: numUsers,
  });

  const summaryAccessSection = (
    <Group.Vertical spacing="m">
      <Group.Vertical spacing="xs">
        <Heading size={Heading.Sizes.SMALL}>{TEXT.summaryHeader}</Heading>
        <div className="group-view-modal__info">{TEXT.summaryDescription}</div>
      </Group.Vertical>
      <div className="group-view-modal__header" />
      {toolsSection}
      <Group.Horizontal flex spacing="xxl">
        {renderDataAccessSection()}
        {renderItemAccessSection()}
        {sitewideAccess}
      </Group.Horizontal>
      <Group.Vertical spacing="xs">
        <div className="group-view-modal__header" />
        <div className="group-view-modal__num-users">{totalMembers}</div>
      </Group.Vertical>
    </Group.Vertical>
  );

  return (
    <Group.Vertical spacing="xxl">
      {nameSection}
      {summaryAccessSection}
    </Group.Vertical>
  );
}
