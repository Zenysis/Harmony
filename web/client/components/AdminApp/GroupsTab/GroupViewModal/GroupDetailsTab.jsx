// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InputText from 'components/ui/InputText';
import LabelWrapper from 'components/ui/LabelWrapper';
import StaticPill from 'components/AdminApp/StaticPill';
import { RESOURCE_ROLE_MAP } from 'services/AuthorizationService/registry';
import { ROLE_TOOL_NAMES } from 'services/models/RoleDefinition';
import { getQueryPolicyAccessDots } from 'components/AdminApp/disaggregateQueryPolicies';
import { getSitewideColorBlocks } from 'components/AdminApp/RoleManagementTab/getSitewideColorBlocks';
import type RoleDefinition from 'services/models/RoleDefinition';

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
      <Heading size={Heading.Sizes.SMALL}>{I18N.textById('Name')}</Heading>
      <InputText.Uncontrolled
        debounce
        id={I18N.textById('Name')}
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
        <StaticPill label={ROLE_TOOL_NAMES[tool]} />
      </div>
    ));
  };

  const toolsSection = (
    <LabelWrapper
      className="group-view-modal__label-wrapper"
      label={I18N.text('Tools')}
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
      label={I18N.text('Item Access')}
    >
      <Group.Vertical className="group-view-modal__info" spacing="xxs">
        <Group.Horizontal>
          <div className="group-view-modal__dot" />
          {`${numDashboardACLs} ${I18N.textById('dashboards')}`}
        </Group.Horizontal>
        <Group.Horizontal>
          <div className="group-view-modal__dot" />
          {`${numAlertACLs} ${I18N.textById('alerts')}`}
        </Group.Horizontal>
      </Group.Vertical>
    </LabelWrapper>
  );

  const {
    ALERT_ADMIN,
    ALERT_EDITOR,
    ALERT_VIEWER,
    DASHBOARD_ADMIN,
    DASHBOARD_EDITOR,
    DASHBOARD_VIEWER,
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
        <Group.Vertical alignItems="center" flex spacing="none">
          {alertColorBlocks.view}
          <div className="role-card__sitewide-access-descriptor">
            {I18N.text('View')}
          </div>
        </Group.Vertical>
        <Group.Vertical alignItems="center" flex spacing="none">
          {alertColorBlocks.edit}
          <div className="role-card__sitewide-access-descriptor">
            {I18N.textById('Edit')}
          </div>
        </Group.Vertical>
        <Group.Vertical alignItems="center" flex spacing="none">
          {alertColorBlocks.admin}
          <div className="role-card__sitewide-access-descriptor">
            {I18N.textById('Admin')}
          </div>
        </Group.Vertical>
      </Group.Horizontal>
    );
  };

  const sitewideAccess = (
    <LabelWrapper
      className="group-view-modal__label-wrapper"
      label={I18N.textById('Sitewide Item Access')}
    >
      <Group.Horizontal alignItems="flex-start" flex>
        <Group.Vertical className="group-view-modal__info" spacing="xxs">
          {I18N.textById('Dashboards')}
          {I18N.textById('Alerts')}
        </Group.Vertical>
        <Group.Vertical spacing="xxs">
          {renderDashboardBlocks()}
          {renderAlertBlocks()}
        </Group.Vertical>
      </Group.Horizontal>
    </LabelWrapper>
  );

  const totalMembers = I18N.textById('totalMembers', { count: numUsers });

  const summaryAccessSection = (
    <Group.Vertical spacing="m">
      <Group.Vertical spacing="xs">
        <Heading size={Heading.Sizes.SMALL}>
          {I18N.text('Summary of access')}
        </Heading>
        <div className="group-view-modal__info">
          {I18N.text('The disaggregated platform access for this group.')}
        </div>
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
