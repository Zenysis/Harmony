// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import QueryResult from 'components/QueryResult';
import type QueryTabItem from 'models/AdvancedQueryApp/QueryTabItem';

type Props = {
  onOverviewClose: () => void,
  onTabActivate: (idx: number) => void,
  tabList: Zen.Array<QueryTabItem>,
};

export default class QueryTabOverview extends React.PureComponent<Props> {
  onClick(e: SyntheticEvent<HTMLDivElement>, itemIdx: number) {
    e.stopPropagation();
    this.props.onTabActivate(itemIdx);
    this.props.onOverviewClose();
  }

  // Prevent hover and click events from occurring on the actual query result.
  // Use a transparent overlay to capture any interactions.
  renderOverlay(item: QueryTabItem, itemIdx: number): React.Element<'div'> {
    return (
      <div
        className="query-tab-overview__query-result-overlay"
        onClick={e => this.onClick(e, itemIdx)}
        role="button"
      >
        <span className="query-tab-overview__tab-name">{item.name()}</span>
      </div>
    );
  }

  // TODO(stephen): Handle when no query results will be displayed.
  renderItems(): $ReadOnlyArray<React.Element<'div'> | null> {
    return this.props.tabList.mapValues((item: QueryTabItem, idx: number) => {
      const maybeQueryResultSpec = item.queryResultSpec();
      if (maybeQueryResultSpec === undefined) {
        return null;
      }

      return (
        <div
          className="query-tab-overview__query-result-wrapper"
          key={item.id()}
        >
          {this.renderOverlay(item, idx)}
          <div className="query-tab-overview__query-result">
            <QueryResult
              queryResultSpec={maybeQueryResultSpec}
              querySelections={item.querySelections()}
              smallMode
              viewType={item.viewType()}
            />
          </div>
        </div>
      );
    });
  }

  render(): React.Element<'div'> {
    return (
      <div
        className="query-tab-overview"
        onClick={this.props.onOverviewClose}
        role="button"
      >
        {this.renderItems()}
      </div>
    );
  }
}
