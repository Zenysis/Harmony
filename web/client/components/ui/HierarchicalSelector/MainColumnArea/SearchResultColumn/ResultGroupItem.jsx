// @flow
import * as React from 'react';

import MatchTextHighlighter from 'components/ui/TextHighlighter/MatchTextHighlighter';
import autobind from 'decorators/autobind';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type StringMatcher from 'lib/StringMatcher';

type Props = {
  item: HierarchyItem,
  matcher: StringMatcher,
  onClick: (item: HierarchyItem, event: SyntheticEvent<HTMLElement>) => void,
};

export default class ResultGroupItem extends React.PureComponent<Props> {
  @autobind
  onClick(event: SyntheticEvent<HTMLElement>) {
    const { onClick, item } = this.props;
    onClick(item, event);
  }

  render() {
    const { item, matcher } = this.props;
    return (
      <div
        role="button"
        className="hierarchical-search-result-group__item"
        onClick={this.onClick}
      >
        <MatchTextHighlighter matcher={matcher} text={item.name()} />
      </div>
    );
  }
}
