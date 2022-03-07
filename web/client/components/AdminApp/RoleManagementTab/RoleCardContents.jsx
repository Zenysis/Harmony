// @flow
import * as React from 'react';

import Group from 'components/ui/Group';
import LabelWrapper from 'components/ui/LabelWrapper';
import StaticPill from 'components/AdminApp/StaticPill';
import { getQueryPolicyAccessDots } from 'components/AdminApp/disaggregateQueryPolicies';
import { getSitewideColorBlocks } from 'components/AdminApp/RoleManagementTab/getSitewideColorBlocks';
import type RoleDefinition from 'services/models/RoleDefinition';

const TEXT = t('admin_app.RoleCard');

type Props = {
  role: RoleDefinition,
};

const { enableDataQualityLab } = window.__JSON_FROM_BACKEND.ui;
const isCasemanagementEnabled =
  window.__JSON_FROM_BACKEND.caseManagementAppOptions.appEnabled;
const isAlertsEnabled = window.__JSON_FROM_BACKEND.alertsEnabled;

function RoleCardContents({ role }: Props) {
  const renderTools = () => {
    const toolPills = role.getTools().mapValues((tool, index) => {
      if (
        (tool === 'alertsApp' && !isAlertsEnabled) ||
        (tool === 'dataQualityLab' && !enableDataQualityLab) ||
        (tool === 'caseManagementApp' && !isCasemanagementEnabled)
      ) {
        return null;
      }
      return (
        <div key={index}>
          <StaticPill className="role-card__pill" label={TEXT[tool]} />
        </div>
      );
    });
    const toolsSection =
      toolPills.length === 0 ? (
        <div className="role-card__no-tools-text">{TEXT.noTools}</div>
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
        labelClassName="role-card__tool-section-label role-card__header"
        label={TEXT.tools}
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
        <Group.Vertical flex spacing="none" alignItems="center">
          {viewBlock}
          <div className="role-card__sitewide-access-descriptor">
            {TEXT.view}
          </div>
        </Group.Vertical>
        <Group.Vertical flex spacing="none" alignItems="center">
          {editBlock}
          <div className="role-card__sitewide-access-descriptor">
            {TEXT.edit}
          </div>
        </Group.Vertical>
        <Group.Vertical flex spacing="none" alignItems="center">
          {adminBlock}
          <div className="role-card__sitewide-access-descriptor">
            {TEXT.admin}
          </div>
        </Group.Vertical>
      </Group.Horizontal>
    );
  };

  const siteWideAccess = (
    <LabelWrapper
      label={TEXT.siteWideAccess}
      labelClassName="role-card__header"
    >
      <Group.Horizontal>
        <Group.Vertical spacing="xxs" className="role-card__group">
          {TEXT.dashboards}
          {isAlertsEnabled && TEXT.alertsApp}
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
