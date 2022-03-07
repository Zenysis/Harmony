// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import useBoolean from 'lib/hooks/useBoolean';
import { localizeUrl, onLinkClicked } from 'components/Navbar/util';
import type DashboardMeta from 'models/core/Dashboard/DashboardMeta';

type Props = {
  dashboardImgMap: Zen.Map<string>,
  officialDashboards: Zen.Array<DashboardMeta>,
};

const TEXT = t('OverviewApp.OfficialDashboardCards');

// Default dashboard thumbnail image for local development
const DEFAULT_DASHBOARD_THUMBNAIL = '/images/dashboard_thumbnail.png';

const NUM_THUMBNAILS_PER_ROW = 5;

function OfficialDashboardCards({
  dashboardImgMap,
  officialDashboards,
}: Props) {
  const [
    isCollapseThumbnails,
    onCollapseThumbnails,
    onShowAllThumbnails,
  ] = useBoolean(true);

  const renderDashboardCard = (dashboard: DashboardMeta) => {
    const dashboardImageName = dashboard.slug();
    const dashboardImg = dashboardImgMap.get(
      dashboardImageName,
      DEFAULT_DASHBOARD_THUMBNAIL,
    );
    return (
      <div
        role="button"
        className="dashboards-overview__dashboard-card"
        onClick={e =>
          onLinkClicked(localizeUrl(`/dashboard/${dashboardImageName}`), e)
        }
        key={dashboardImageName}
      >
        <div className="dashboards-overview__dashboard-card-header">
          {dashboard.title()}
        </div>
        <img
          className="dashboards-overview__dashboard-image"
          src={dashboardImg}
          alt=""
        />
      </div>
    );
  };

  let cardsToDisplay = (
    <div className="dashboards-overview__dashboard-card">
      <img
        className="dashboards-overview__dashboard-loading-image"
        src="/images/loading.gif"
        alt=""
      />
    </div>
  );

  const numOfficialDashboards = officialDashboards.size();

  if (numOfficialDashboards) {
    const officialCards = officialDashboards.mapValues(renderDashboardCard);
    cardsToDisplay =
      numOfficialDashboards > NUM_THUMBNAILS_PER_ROW && isCollapseThumbnails
        ? officialCards.slice(0, NUM_THUMBNAILS_PER_ROW)
        : officialCards;
  }

  const hideOfficialDashboardText = isCollapseThumbnails
    ? TEXT.showAllThumbnails
    : TEXT.collapseThumbnails;

  const onOfficialDashboardTextClick = isCollapseThumbnails
    ? onShowAllThumbnails
    : onCollapseThumbnails;

  const hideShowOfficialDashboardButton =
    numOfficialDashboards > NUM_THUMBNAILS_PER_ROW ? (
      <div
        className="dashboards-overview__hide-show-official-dashboards"
        onClick={onOfficialDashboardTextClick}
        role="button"
      >
        {hideOfficialDashboardText}
      </div>
    ) : null;

  return (
    <Group.Vertical flex spacing="none" paddingBottom="xxl">
      <div className="dashboards-overview__section-header">
        <Heading.Small>{TEXT.officialDashboards}</Heading.Small>
      </div>
      <div className="dashboards-overview__official-dashboards-container">
        {cardsToDisplay}
      </div>
      {hideShowOfficialDashboardButton}
    </Group.Vertical>
  );
}

export default (React.memo(
  OfficialDashboardCards,
): React.AbstractComponent<Props>);
