// @flow
import * as React from 'react';

import MatchTextHighlighter from 'components/ui/TextHighlighter/MatchTextHighlighter';
import autobind from 'decorators/autobind';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type StringMatcher from 'lib/StringMatcher';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type Props<T> = {
  item: HierarchyItem<T>,
  matcher: StringMatcher,
  onClick: (item: HierarchyItem<T>, event: SyntheticEvent<HTMLElement>) => void,
};

export default class ResultGroupItem<T: NamedItem> extends React.PureComponent<
  Props<T>,
> {
  @autobind
  onClick(event: SyntheticEvent<HTMLElement>) {
    const { onClick, item } = this.props;
    onClick(item, event);
  }

  render(): React.Element<'div'> {
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
