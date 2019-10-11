// @flow
import React from 'react';
import Tree from 'react-virtualized-tree';

import Caret from 'components/ui/Caret';
// TODO(pablo): the DropdownSearchBar should not be used directly
import DropdownSearchBar from 'components/ui/Dropdown/internal/DropdownSearchBar';
import Field from 'models/core/Field';
import GroupRow from 'components/QueryApp/QueryForm/SelectIndicator/GroupRow';
import IndicatorRow from 'components/QueryApp/QueryForm/SelectIndicator/IndicatorRow';
import SelectHeader from 'components/QueryApp/QueryForm/SelectHeader';
import autobind from 'decorators/autobind';
import memoizeOne from 'decorators/memoizeOne';
import { IndicatorsByGroup } from 'indicator_fields';
import type { NodeUpdater } from 'components/QueryApp/QueryForm/SelectIndicator/GroupRow';

type Indicator = {
  id: string,
  text: string,
};

type IndicatorGroup = {
  groupText: string,
  hiddenByDefault: boolean,
  groupId: string,
  disabled: boolean,
  indicators: Array<Indicator>,
};

type Props = {
  label: string,
  onFieldClick: (fieldId: string) => void,
  selectedFields: Array<Field>,

  includeHiddenGroups: boolean,
  indicatorsByGroup: Array<IndicatorGroup>,
  labelSub?: string,
  onClearSelectedFields?: () => void,
  showOnlyGroupIds: Array<string>,
};

type TreeNodeChild = {
  id: string,
  name: string,
  level: number,
};

type ReactVirtualizedTreeNode = {
  id: string,
  name: string,
  level: number,
  state: { expanded: boolean },
  children: Array<TreeNodeChild>,
};

type State = {
  expanded: boolean,
  nodes: Array<ReactVirtualizedTreeNode>,
  totalDisplayableRows: number,
};

const TEXT = t('query_form.selections');

const GROUP_LEVEL = 1;
const INDICATOR_LEVEL = 2;

// HACK(stephen, kyle): CSS values copied to support variable height.
const ROW_HEIGHT = 32;
const MAX_HEIGHT = 500;

function _computeTotalDisplayableRows(
  nodes: Array<ReactVirtualizedTreeNode>,
): number {
  return nodes.reduce(
    (acc, { children, state }) =>
      acc + 1 + (state.expanded ? children.length : 0),
    0,
  );
}

export default class SelectIndicator extends React.PureComponent<Props, State> {
  static defaultProps = {
    includeHiddenGroups: false,
    indicatorsByGroup: IndicatorsByGroup,
    labelSub: undefined,
    onClearSelectedFields: undefined,
    showOnlyGroupIds: [],
  };

  state = {
    nodes: [],
    totalDisplayableRows: 0,
    expanded: false,
  };

  _contentRef: $RefObject<'div'> = React.createRef();

  componentDidMount() {
    this.updateNodeState();
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
  }

  @memoizeOne
  getDropdownId(label: string): string {
    // Required for testing.
    return label
      .split(' ')
      .join('')
      .replace(/\(|\)|\//g, '');
  }

  updateNodeState(search?: string = ''): void {
    const {
      indicatorsByGroup,
      showOnlyGroupIds,
      includeHiddenGroups,
    } = this.props;
    const optGroups = this.getOptGroups(
      indicatorsByGroup,
      showOnlyGroupIds,
      includeHiddenGroups,
    );

    const searchKey = search.toLowerCase();
    const nodes = [];
    optGroups.forEach((group, groupIdx) => {
      const children = [];
      const { groupText } = group;
      const groupMatchesSearch =
        !searchKey || groupText.toLowerCase().includes(searchKey);
      group.indicators.forEach(indicator => {
        const { id, text } = indicator;
        if (groupMatchesSearch || text.toLowerCase().includes(searchKey)) {
          children.push({
            id,
            name: text,
            level: INDICATOR_LEVEL,
          });
        }
      });

      const numChildren = children.length;
      if (numChildren > 0) {
        nodes.push({
          id: groupIdx.toString(),
          name: group.groupText,
          level: GROUP_LEVEL,
          state: {
            expanded: false,
          },
          children,
        });
      }
    });

    this.setState({
      nodes,
      totalDisplayableRows: _computeTotalDisplayableRows(nodes),
    });
  }

  @memoizeOne
  getOptGroups(
    indicatorsByGroup: Array<IndicatorGroup>,
    showOnlyGroupIds?: Array<string> = [],
    includeHiddenGroups: boolean,
  ): Array<IndicatorGroup> {
    return indicatorsByGroup.filter(group => {
      // Certain groups should never be displayed to the user. This includes
      // internal indicators and metadata that support a user's query but are
      // never actually selected
      if (group.disabled) {
        return false;
      }

      // Show only a limited set of groups if specified
      if (showOnlyGroupIds.length) {
        return showOnlyGroupIds.includes(group.groupId);
      }

      // Certain indicator dropdowns have different behaviors for hidden groups
      if (group.hiddenByDefault) {
        return includeHiddenGroups;
      }
      return true;
    });
  }

  @autobind
  hideTree(): void {
    this.setState({ expanded: false });
    this.updateNodeState();
    document.removeEventListener('click', this.onDocumentClick);
  }

  @autobind
  showTree(): void {
    this.setState({ expanded: !this.state.expanded });
    document.addEventListener('click', this.onDocumentClick);
  }

  @autobind
  toggleTree(): void {
    if (this.state.expanded) {
      this.hideTree();
    } else {
      this.showTree();
    }
  }

  @autobind
  onDocumentClick(e: Event) {
    if (
      !this._contentRef.current ||
      (e.target instanceof Node && !this._contentRef.current.contains(e.target))
    ) {
      this.hideTree();
    }
  }

  @autobind
  onSearch(val: string) {
    this.updateNodeState(val);
  }

  @autobind
  onTreeChange(nodes: Array<ReactVirtualizedTreeNode>) {
    this.setState({
      nodes,
      totalDisplayableRows: _computeTotalDisplayableRows(nodes),
    });
  }

  maybeRenderDropdownContents() {
    const { expanded, nodes, totalDisplayableRows } = this.state;
    if (!expanded) {
      return null;
    }

    // HACK(stephen, kyle): We want to set a max height based on the number of
    // rows that can be displayed, but react-virtualized-tree is inflexible
    // and doesn't allow setting a variable height.
    const height = Math.min(ROW_HEIGHT * totalDisplayableRows, MAX_HEIGHT);

    return (
      <div
        className="select-indicator__dropdown-contents"
        ref={this._contentRef}
      >
        <DropdownSearchBar
          debounce
          debounceTimeoutMs={30}
          extraClass="select-indicator__dropdown-search-bar"
          onChange={this.onSearch}
          searchInputPlaceholder={TEXT.search}
        />
        <div className="select-indicator__dropdown-tree" style={{ height }}>
          <Tree nodes={nodes} nodeMarginLeft={0} onChange={this.onTreeChange}>
            {this.renderTreeRow}
          </Tree>
        </div>
      </div>
    );
  }

  renderDropdownButton() {
    const { label, selectedFields } = this.props;
    const { length } = selectedFields;

    let buttonLabel = TEXT.data_non_selected_text;
    if (length && selectedFields[0].getCanonicalName()) {
      buttonLabel =
        length > 1
          ? `${length} items selected`
          : selectedFields[0].getCanonicalName();
    }

    return (
      <div
        id={this.getDropdownId(label)}
        role="button"
        className="select-indicator__dropdown-button"
        onClick={this.toggleTree}
      >
        {buttonLabel}
        <Caret className="select-indicator__dropdown-button-arrow" />
      </div>
    );
  }

  renderHeader() {
    const {
      label,
      labelSub,
      selectedFields,
      onClearSelectedFields,
    } = this.props;

    const showClearButton =
      selectedFields.length > 0 && onClearSelectedFields !== undefined;
    return (
      <div className="select-indicator__header">
        <SelectHeader
          headerLabel={label}
          subHeaderLabel={labelSub}
          showClearButton={showClearButton}
          onClear={onClearSelectedFields}
        />
      </div>
    );
  }

  @autobind
  renderTreeRow(treeRowProps: {
    node: ReactVirtualizedTreeNode,
    onChange: NodeUpdater => void,
  }) {
    const { node, onChange } = treeRowProps;
    if (node.level === GROUP_LEVEL) {
      return <GroupRow node={node} onClick={onChange} />;
    }

    const { onFieldClick, selectedFields } = this.props;
    const fieldId = node.id;
    const isSelected = selectedFields.some(field => field.id() === fieldId);
    return (
      <IndicatorRow
        fieldId={fieldId}
        label={node.name}
        onClick={onFieldClick}
        isSelected={isSelected}
      />
    );
  }

  render() {
    return (
      <div className="select-indicator">
        {this.renderHeader()}
        {this.renderDropdownButton()}
        {this.maybeRenderDropdownContents()}
      </div>
    );
  }
}
