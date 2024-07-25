// @flow
import * as React from 'react';

import ElementResizeService from 'services/ui/ElementResizeService';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import Icon from 'components/ui/Icon';
import Spacing from 'components/ui/Spacing';

const MIN_WIDTH = 560;
const MIN_HEIGHT = 200;

export default function NoResultsScreen(): React.Node {
  const [smallMode, setSmallMode] = React.useState(false);

  const resizeRegistration = React.useMemo(
    () =>
      ElementResizeService.register(({ contentRect }: ResizeObserverEntry) =>
        setSmallMode(
          contentRect.width < MIN_WIDTH || contentRect.height < MIN_HEIGHT,
        ),
      ),
    [setSmallMode],
  );

  const content = smallMode ? (
    I18N.text('Your query produced 0 results')
  ) : (
    <React.Fragment>
      <Group.Item marginBottom="m">
        {I18N.textById('Your query produced 0 results')}
      </Group.Item>
      <Group.Item marginBottom="xxs">
        {I18N.text('Try the following:')}
      </Group.Item>
      <ul style={{ marginTop: 0 }}>
        <li>{I18N.text('Querying a new indicator')}</li>
        <li>{I18N.text('Removing a Group By')}</li>
        <li>{I18N.text('Refining your Filters')}</li>
      </ul>
    </React.Fragment>
  );

  return (
    <div
      ref={resizeRegistration.setRef}
      className="no-results-screen"
      style={smallMode ? { flexDirection: 'column', textAlign: 'center' } : {}}
    >
      <Icon
        className={smallMode ? 'no-results-screen__icon-small-mode' : ''}
        type="svg-no-data-results"
      />
      <Group.Vertical
        itemStyle={{ fontSize: smallMode ? 14 : 16 }}
        marginLeft={smallMode ? 'none' : 'xl'}
      >
        <Spacing marginBottom="xxs">
          <Heading size={smallMode ? 'small' : 'large'}>
            {I18N.text("We couldn't find any data")}
          </Heading>
        </Spacing>
        {content}
      </Group.Vertical>
    </div>
  );
}
