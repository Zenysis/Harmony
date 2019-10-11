// @flow
import * as React from 'react';

import ProgressBar from 'components/ui/ProgressBar';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { autobind, memoizeOne } from 'decorators';
import type ExpandoTreeQueryResultData from 'components/visualizations/ExpandoTree/models/ExpandoTreeQueryResultData';
import type { D3HierarchyNode } from 'components/visualizations/ExpandoTree/types';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'EXPANDOTREE'>;

type D3Tree = any;

const MARGIN_LEFT = 200;

const ANIMATION_DURATION_MS = 750;
const ROOT_NAME = window.__JSON_FROM_BACKEND.nationName;

// NOTE(stephen): Many D3 operations here modify the nodes in place. This is
// valid D3 code, so we can disable the eslint rule for this file.
/* eslint-disable no-param-reassign */

function collapse(node: D3HierarchyNode) {
  if (node.children) {
    node._children = node.children;
    node._children.forEach(collapse);
    node.children = undefined;
  }
}

class ExpandoTree extends React.PureComponent<Props> {
  _idCounter: number = 0;
  _treeRef: $RefObject<'svg'> = React.createRef();
  diagonalProjection = window.d3.svg.diagonal().projection(d => [d.y, d.x]);
  tree = window.d3.layout.tree();

  componentDidMount() {
    this.update(this.getRoot());
  }

  componentDidUpdate() {
    this.update(this.getRoot());
  }

  getBounds(): { height: number, width: number } {
    const { current } = this._treeRef;
    if (!current) {
      return { height: 0, width: 0 };
    }

    const { height, width } = current.getBoundingClientRect();
    return {
      height,
      width: width - MARGIN_LEFT,
    };
  }

  // HACK(stephen): D3 mutates objects. To ensure we do not taint the original
  // root, we clone the full tree and use this clone for D3.
  @memoizeOne
  cloneQueryResultRoot(
    queryResult: ExpandoTreeQueryResultData,
    tree: D3Tree,
  ): D3HierarchyNode {
    const root: D3HierarchyNode = tree(
      JSON.parse(JSON.stringify(queryResult.root())),
    )[0];
    const { children } = root;
    if (children !== undefined) {
      children.forEach(collapse);
    }
    return root;
  }

  getRoot(): D3HierarchyNode {
    return this.cloneQueryResultRoot(this.props.queryResult, this.tree);
  }

  getNodeDisplayName({ depth, dimension, name }: D3HierarchyNode): string {
    const { groupBySettings } = this.props;
    if (depth === 0) {
      return ROOT_NAME;
    }

    // TODO(stephen): Shouldn't QueryResultGrouping handle this case?
    if (name === null) {
      return 'null';
    }

    const grouping = groupBySettings.settingsForGroup(dimension);
    if (grouping === undefined) {
      return name;
    }

    return grouping.formatGroupingValue(name);
  }

  getNodeDisplayValue({ depth, metrics }: D3HierarchyNode): string | void {
    const { controls, seriesSettings } = this.props;
    const { selectedField } = controls;
    const value = metrics[selectedField];

    // If the root node has no total value, skip rendering the value completely.
    // NOTE(stephen): This is a simple way to handle results that have a time
    // granularity grouping since there will be no total value from Druid when
    // grouping by time. Grouping by a time extraction (like month of year) will
    // still work though.
    if (depth === 0 && value === null) {
      return undefined;
    }

    const seriesObject = seriesSettings.seriesObjects()[selectedField];
    return seriesObject.formatFieldValue(value);
  }

  @autobind
  getNodeText(node: D3HierarchyNode): string {
    const displayName = this.getNodeDisplayName(node);
    const displayValue = this.getNodeDisplayValue(node);
    return displayValue !== undefined
      ? `${displayName} (${displayValue})`
      : displayName;
  }

  update(source: D3HierarchyNode | void) {
    const { current } = this._treeRef;
    if (!current || source === undefined) {
      return;
    }

    // Update the root and tree layout based on size changes.
    const { height, width } = this.getBounds();
    const root = this.getRoot();
    root.x0 = height / 2;
    root.y0 = 0;
    this.tree.size([height, width]);

    // Create the nodes and links to be drawn.
    const nodes = this.tree.nodes(root).reverse();
    const links = this.tree.links(nodes);

    // Normally, the D3 tree layout will fill the whole screen with each visible
    // level. If there are only 2 out of 4 levels being displayed (the root and
    // the first child) then the root will be on the left of the screen and the
    // child level will be on the right side of the screen. We want each level
    // to be in the same position and only animate addition/subtraction of new
    // visible levels. To do this, we normalize the y position based on the
    // node's depth.
    const levels = this.props.queryResult.levels().length + 1;
    const columnWidth = width / levels;
    nodes.forEach(d => {
      d.y = d.depth * columnWidth;
    });

    // Update the nodes…
    const selection = window.d3.select(current.firstElementChild);
    const node = selection.selectAll('g.node').data(nodes, d => {
      if (!d.id) {
        d.id = ++this._idCounter;
      }
      return d.id;
    });

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', `translate(${source.y0}, ${source.x0})`)
      .on('click', this.onNodeClick);

    nodeEnter
      .append('circle')
      .attr('r', 1e-6)
      .style('fill', d => (d._children ? 'lightsteelblue' : '#fff'));

    nodeEnter
      .append('text')
      .attr('x', d => (d.children || d._children ? -10 : 10))
      .attr('dy', '.35em')
      .attr('text-anchor', d => (d.children || d._children ? 'end' : 'start'))
      .text(this.getNodeText)
      .style('fill-opacity', 1e-6)
      .style('font-size', '14px');

    // Transition nodes to their new position.
    const nodeUpdate = node
      .transition()
      .duration(ANIMATION_DURATION_MS)
      .attr('transform', d => `translate(${d.y},${d.x})`);

    nodeUpdate
      .select('circle')
      .attr('r', 4.5)
      .style('fill', d => (d._children ? 'lightsteelblue' : '#fff'));

    nodeUpdate.select('text').style('fill-opacity', 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition()
      .duration(ANIMATION_DURATION_MS)
      .attr('transform', `translate(${source.y}, ${source.x})`)
      .remove();

    nodeExit.select('circle').attr('r', 1e-6);

    nodeExit.select('text').style('fill-opacity', 1e-6);

    // Update the links…
    const link = selection.selectAll('path.link').data(links, d => d.target.id);

    // Enter any new links at the parent's previous position.
    link
      .enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', () => {
        const o = { x: source.x0, y: source.y0 };
        return this.diagonalProjection({ source: o, target: o });
      });

    // Transition links to their new position.
    link
      .transition()
      .duration(ANIMATION_DURATION_MS)
      .attr('d', this.diagonalProjection);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(ANIMATION_DURATION_MS)
      .attr('d', () => {
        const o = { x: source.x, y: source.y };
        return this.diagonalProjection({ source: o, target: o });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  @autobind
  onNodeClick(node: D3HierarchyNode) {
    // Toggle children on click.
    if (node.children) {
      node._children = node.children;
      node.children = undefined;
    } else {
      node.children = node._children;
      node._children = undefined;
    }
    this.update(node);
  }

  render() {
    return (
      <Visualization loading={this.props.loading} className="expando-tree">
        <svg className="expando-tree" ref={this._treeRef}>
          <g transform={`translate(${MARGIN_LEFT}, 0)`} />
        </svg>
      </Visualization>
    );
  }
}

/* eslint-enable no-param-reassign */

export default withScriptLoader(ExpandoTree, {
  scripts: [VENDOR_SCRIPTS.d3],
  loadingNode: <ProgressBar enabled />,
});
