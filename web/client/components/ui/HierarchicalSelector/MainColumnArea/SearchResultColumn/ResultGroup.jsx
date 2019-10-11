// @flow
import * as React from 'react';

import ResultGroupItem from 'components/ui/HierarchicalSelector/MainColumnArea/SearchResultColumn/ResultGroupItem';
import SearchPath from 'components/ui/HierarchicalSelector/SearchPath';
import ZenArray from 'util/ZenModel/ZenArray';
import autobind from 'decorators/autobind';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type StringMatcher from 'lib/StringMatcher';

type Props = {
  items: ZenArray<HierarchyItem>,
  matcher: StringMatcher,

  // callback for when a category breadcrumb is clicked, we pass back the path
  // to this category
  onCategoryClick: (path: ZenArray<HierarchyItem>) => void,

  // callback for when a leaf item is clicked
  onItemClick: (
    item: HierarchyItem,
    event: SyntheticEvent<HTMLElement>,
  ) => void,
  path: ZenArray<HierarchyItem>,

  expandOnMount: boolean,
  hideRoot: boolean,
};

type State = {
  expanded: boolean,
};

export default class ResultGroup extends React.PureComponent<Props, State> {
  static defaultProps = {
    expandOnMount: false,
    hideRoot: false,
  };

  state = {
    expanded: false,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      expanded: this.props.expandOnMount,
    };
  }

  isExpandable() {
    return !this.props.items.isEmpty();
  }

  @autobind
  onCaretClick() {
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  }

  maybeRenderItems() {
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

  maybeRenderCaret() {
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

  renderBreadcrumbs() {
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

  render() {
    return (
      <div className="hierarchical-search-result-group">
        {this.renderBreadcrumbs()}
        {this.maybeRenderItems()}
      </div>
    );
  }
}
