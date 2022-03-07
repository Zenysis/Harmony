// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import InputText from 'components/ui/InputText';
import SearchPath from 'components/ui/HierarchicalSelector/SearchPath';
import autobind from 'decorators/autobind';
import type HierarchyItem from 'models/ui/HierarchicalSelector/HierarchyItem';
import type { NamedItem } from 'models/ui/HierarchicalSelector/types';
import type { StyleObject } from 'types/jsCore';

type InputEvent = SyntheticEvent<HTMLInputElement>;

type Props<T> = {
  onChange: (value: string, event: InputEvent) => void,
  onSearchPathChange: (Zen.Array<HierarchyItem<T>>) => void,
  searchPath: Zen.Array<HierarchyItem<T>>,
};

type State = {
  searchPathWidth?: number,
};

const TEXT = t('ui.HierarchicalSelector.SearchBar');

/**
 * The SearchBar that shows up above the columns.
 *
 * NOTE(pablo): it may be tempting to make this into a controlled
 * component with the searchText being passed as a prop, but we
 * can't do that because the InputText is debounced. Which means the
 * only true state of the text is in the DOM, so we need to use a ref.
 */
export default class SearchBar<T: NamedItem> extends React.PureComponent<
  Props<T>,
  State,
> {
  _inputTextRef: $ElementRefObject<
    typeof InputText.Uncontrolled,
  > = React.createRef();
  _searchPathElt: $ElementRefObject<'span'> = React.createRef();

  state: State = {
    searchPathWidth: undefined,
  };

  componentDidMount() {
    this.updateSearchPathWidth();
  }

  componentDidUpdate() {
    this.updateSearchPathWidth();
  }

  updateSearchPathWidth() {
    if (!this._searchPathElt.current) {
      return;
    }

    // Set new width of the search path, if it changed.
    const { offsetWidth } = this._searchPathElt.current;
    if (offsetWidth !== this.state.searchPathWidth) {
      this.setState({ searchPathWidth: offsetWidth });
    }
  }

  clearText(): void {
    // our InputText is debounced, which means it needs to be used as an
    // uncontrolled component. So the only way to clear the text is by using
    // a ref
    if (this._inputTextRef.current) {
      this._inputTextRef.current.clear();
    }
  }

  focus(): void {
    if (this._inputTextRef.current) {
      this._inputTextRef.current.focus();
    }
  }

  getSearchPlaceHolder(): string {
    if (this.props.searchPath.size() > 1) {
      return TEXT.categoryPlaceholder;
    }
    return TEXT.defaultPlaceholder;
  }

  getText(): string {
    if (this._inputTextRef.current) {
      return this._inputTextRef.current.getValue();
    }
    return '';
  }

  getInputStyle(): StyleObject {
    const { searchPathWidth } = this.state;
    const paddingLeft =
      searchPathWidth === undefined ? undefined : searchPathWidth + 15;
    return { paddingLeft };
  }

  @autobind
  onSearchPathClick(path: Zen.Array<HierarchyItem<T>>) {
    this.props.onSearchPathChange(path);
  }

  @autobind
  onKeyDown(event: SyntheticKeyboardEvent<HTMLInputElement>) {
    const { searchPath } = this.props;
    // if we hit backspace, and our search path is not just the root, and
    // we don't have any search text written, then let's remove one
    // of the categories from the search path.
    if (
      event.key === 'Backspace' &&
      searchPath.size() > 1 &&
      this.getText() === ''
    ) {
      const newPath = searchPath.delete(searchPath.size() - 1);
      this.props.onSearchPathChange(newPath);
    }
  }

  maybeRenderBreadcrumb(): React.Node {
    const { searchPath } = this.props;
    if (searchPath.isEmpty()) {
      return null;
    }

    return (
      <span
        className="hierarchical-search-bar__search-path"
        ref={this._searchPathElt}
      >
        <SearchPath
          path={searchPath}
          onCategoryClick={this.onSearchPathClick}
        />
      </span>
    );
  }

  render(): React.Node {
    const { onChange } = this.props;
    return (
      <div className="hierarchical-search-bar">
        <div className="hierarchical-search-bar__input-container">
          {this.maybeRenderBreadcrumb()}
          <InputText.Uncontrolled
            debounce
            debounceTimeoutMs={300}
            initialValue=""
            onChange={onChange}
            onKeyDown={this.onKeyDown}
            placeholder={this.getSearchPlaceHolder()}
            style={this.getInputStyle()}
            ref={this._inputTextRef}
          />
        </div>
      </div>
    );
  }
}
