// @flow
import * as React from 'react';

import ElementResizeService from 'services/ui/ElementResizeService';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import Icon from 'components/ui/Icon';
import Spacing from 'components/ui/Spacing';

const TEXT = t('query_result.common.noDataResults');
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
    TEXT.producedNoResults
  ) : (
    <React.Fragment>
      <Group.Item marginBottom="m">{TEXT.producedNoResults}</Group.Item>
      <Group.Item marginBottom="xxs">{TEXT.try}</Group.Item>
      <ul style={{ marginTop: 0 }}>
        <li>{TEXT.indicator}</li>
        <li>{TEXT.groupBy}</li>
        <li>{TEXT.filters}</li>
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
        type="svg-no-data-results"
        className={smallMode ? 'no-results-screen__icon-small-mode' : ''}
      />
      <Group.Vertical
        marginLeft={smallMode ? 'none' : 'xl'}
        itemStyle={{ fontSize: smallMode ? 14 : 16 }}
      >
        <Spacing marginBottom="xxs">
          <Heading size={smallMode ? 'small' : 'large'}>
            {TEXT.noDataFound}
          </Heading>
        </Spacing>
        {content}
      </Group.Vertical>
    </div>
  );
}
