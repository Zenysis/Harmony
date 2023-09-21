// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import StaticPill from 'components/AdminApp/StaticPill';
import { ROLE_TOOL_NAMES } from 'services/models/RoleDefinition';
import { getQueryPolicyAccessDots } from 'components/AdminApp/disaggregateQueryPolicies';
import { getSitewideColorBlocks } from 'components/AdminApp/RoleManagementTab/getSitewideColorBlocks';
import type RoleDefinition from 'services/models/RoleDefinition';

type Props = {
  role: RoleDefinition,
};

const { enableDataQualityLab } = window.__JSON_FROM_BACKEND.ui;
const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

function RoleCardContents({ role }: Props) {
  const renderTools = () => {
    const toolPills = role.getTools().mapValues((tool, index) => {
      if (
        (tool === 'alertsApp' && !isAlertsEnabled) ||
        (tool === 'dataQualityLab' && !enableDataQualityLab)
      ) {
        return null;
      }
      return (
        <div key={index}>
          <StaticPill
            className="role-card__pill"
            label={ROLE_TOOL_NAMES[tool]}
          />
        </div>
      );
    });
    const toolsSection =
      toolPills.length === 0 ? (
        <div className="role-card__no-tools-text">
          {I18N.text('No tools added to this role')}
        </div>
      ) : (
        <Group.Horizontal
          className="role-card__tool-section-content"
          flex
          spacing="xxs"
          spacingUnit="px"
        >
          {toolPills}
        </Group.Horizontal>
      );
    return (
      <LabelWrapper
        label={I18N.textById('Tools')}
        labelClassName="role-card__tool-section-label role-card__header"
      >
        {toolsSection}
      </LabelWrapper>
    );
  };

  const renderDataAccess = () =>
    getQueryPolicyAccessDots(role.getQueryPolicies().arrayView());

  const renderSiteWideColorBlocks = () => {
    const dashboardBlocks = getSitewideColorBlocks(
      role.getSitewideDashboardRoleName(),
    );
    const alertBlocks = getSitewideColorBlocks(role.getSitewideAlertRoleName());
    const viewBlock = isAlertsEnabled ? (
      <Group.Vertical spacing="s">
        {dashboardBlocks.view}
        {alertBlocks.view}
      </Group.Vertical>
    ) : (
      dashboardBlocks.view
    );
    const editBlock = isAlertsEnabled ? (
      <Group.Vertical spacing="s">
        {dashboardBlocks.edit}
        {alertBlocks.edit}
      </Group.Vertical>
    ) : (
      dashboardBlocks.edit
    );
    const adminBlock = isAlertsEnabled ? (
      <Group.Vertical spacing="s">
        {dashboardBlocks.admin}
        {alertBlocks.admin}
      </Group.Vertical>
    ) : (
      dashboardBlocks.admin
    );
    return (
      <Group.Horizontal spacing="xxs">
        <Group.Vertical alignItems="center" flex spacing="none">
          {viewBlock}
          <div className="role-card__sitewide-access-descriptor">
            {I18N.textById('View')}
          </div>
        </Group.Vertical>
        <Group.Vertical alignItems="center" flex spacing="none">
          {editBlock}
          <div className="role-card__sitewide-access-descriptor">
            {I18N.textById('Edit')}
          </div>
        </Group.Vertical>
        <Group.Vertical alignItems="center" flex spacing="none">
          {adminBlock}
          <div className="role-card__sitewide-access-descriptor">
            {I18N.textById('Admin')}
          </div>
        </Group.Vertical>
      </Group.Horizontal>
    );
  };

  const siteWideAccess = (
    <LabelWrapper
      label={I18N.textById('Sitewide Item Access')}
      labelClassName="role-card__header"
    >
      <Group.Horizontal>
        <Group.Vertical className="role-card__group" spacing="xxs">
          {I18N.textById('Dashboards')}
          {isAlertsEnabled && I18N.textById('Alerts')}
        </Group.Vertical>
        {renderSiteWideColorBlocks()}
      </Group.Horizontal>
    </LabelWrapper>
  );

  return (
    <Group.Vertical spacing="m">
      {renderTools()}
      <Group.Horizontal alignItems="flex-start" flex spacing="l">
        {renderDataAccess()}
        {siteWideAccess}
      </Group.Horizontal>
    </Group.Vertical>
  );
}

export default (React.memo(RoleCardContents): React.AbstractComponent<Props>);
