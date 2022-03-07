// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ResultGroupItem from 'components/ui/HierarchicalSelector/MainColumnArea/SearchResultColumn/ResultGroupItem';
import SearchPath from 'components/ui/HierarchicalSelector/SearchPath';
import autobind from 'decorators/autobind';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type StringMatcher from 'lib/StringMatcher';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';

type DefaultProps = {
  expandOnMount: boolean,
  hideRoot: boolean,
};

type Props<T> = {
  ...DefaultProps,
  items: Zen.Array<HierarchyItem<T>>,
  matcher: StringMatcher,

  // callback for when a category breadcrumb is clicked, we pass back the path
  // to this category
  onCategoryClick: (path: Zen.Array<HierarchyItem<T>>) => void,

  // callback for when a leaf item is clicked
  onItemClick: (
    item: HierarchyItem<T>,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
  path: Zen.Array<HierarchyItem<T>>,
};

type State = {
  expanded: boolean,
};

export default class ResultGroup<T: NamedItem> extends React.PureComponent<
  Props<T>,
  State,
> {
  static defaultProps: DefaultProps = {
    expandOnMount: false,
    hideRoot: false,
  };

  state: State = {
    expanded: this.props.expandOnMount,
  };

  isExpandable(): boolean {
    return !this.props.items.isEmpty();
  }

  @autobind
  onCaretClick() {
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  }

  maybeRenderItems(): React.Node {
    const { items, matcher, onItemClick } = this.props;
    if (this.isExpandable() && this.state.expanded) {
      const itemNodes = items.map(item => (
        <ResultGroupItem
          key={item.id()}
          item={item}
          matcher={matcher}
          onClick={onItemClick}
        />
      ));
      return (
        <div className="hierarchical-search-result-group__items-container">
          {itemNodes}
        </div>
      );
    }
    return null;
  }

  maybeRenderCaret(): React.Node {
    if (this.isExpandable()) {
      const iconClass = this.state.expanded
        ? 'glyphicon-menu-down'
        : 'glyphicon-menu-right';
      return (
        <span
          role="button"
          className={`glyphicon hierarchical-search-result-group__caret ${iconClass}`}
          onClick={this.onCaretClick}
        />
      );
    }
    return null;
  }

  renderBreadcrumbs(): React.Node {
    const { path, onCategoryClick, hideRoot } = this.props;
    return (
      <div className="hierarchical-search-result-group__breadcrumb-row">
        {this.maybeRenderCaret()}
        <SearchPath
          hideRoot={hideRoot}
          path={path}
          onCategoryClick={onCategoryClick}
        />
      </div>
    );
  }

  render(): React.Element<'div'> {
    return (
      <div className="hierarchical-search-result-group">
        {this.renderBreadcrumbs()}
        {this.maybeRenderItems()}
      </div>
    );
  }
}
