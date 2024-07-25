// @flow
import * as React from 'react';
import styled from '@emotion/styled';

import Alert from 'components/ui/Alert';
import I18N from 'lib/I18N';
import Moment from 'models/core/wip/DateTime/Moment';

const AlertContainer = styled.div`
  display: flex;
  justify-content: center;
  position: fixed;
  top: 115px;
  width: 100%;
  z-index: 1000;
`;

const OpenLatestDashboardLink = styled.a`
  background-color: #17a56c;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  line-height: 20px;
  margin-right: 16px;
  padding: 6px 12px;

  &:hover {
    background-color: #4cb382;
    color: white;
  }

  &:active {
    background-color: #188d5c;
  }
`;

export default function LegacyExperienceControls(): React.Node {
  const [alertVisible, setAlertVisible] = React.useState(true);
  const daysUntilRemoval = React.useMemo(
    () => Moment.utc('2021-12-01').diff(Moment.utc(), 'days'),
    [],
  );

  // Navigate to the dashboard URL and drop any parameters set.
  const modernURL = document.location.pathname;

  return (
    <>
      {alertVisible && (
        <AlertContainer>
          <Alert
            card
            intent="error"
            onRemove={() => setAlertVisible(false)}
            title={I18N.text('This legacy dashboard can only be viewed')}
          >
            <I18N daysUntilRemoval={daysUntilRemoval} id="legacy_warning">
              You are currently viewing the legacy version of this dashboard.
              This legacy version will be discontinued in %(daysUntilRemoval)s
              days.
            </I18N>
          </Alert>
        </AlertContainer>
      )}
      <OpenLatestDashboardLink href={modernURL}>
        <I18N>View Latest Dashboard</I18N>
      </OpenLatestDashboardLink>
    </>
  );
}
