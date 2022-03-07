// @flow
import * as React from 'react';

import ElementResizeService from 'services/ui/ElementResizeService';
import ProgressBar from 'components/ui/ProgressBar';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { autobind, memoizeOne } from 'decorators';
import type ExpandoTreeQueryResultData from 'models/visualizations/ExpandoTree/ExpandoTreeQueryResultData';
import type { D3HierarchyNode } from 'models/visualizations/ExpandoTree/types';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'EXPANDOTREE'>;
type State = {
  height: number,
  width: number,
};

type D3Tree = $FlowTODO;

const MARGIN_LEFT = 200;

const ANIMATION_DURATION_MS = window.__JSON_FROM_BACKEND.is_screenshot_request
  ? 0
  : 750;
const ROOT_NAME = window.__JSON_FROM_BACKEND.nationName;
const MIN_NODE_HEIGHT = 20;

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

class ExpandoTree extends React.PureComponent<Props, State> {
  _idCounter: number = 0;
  _treeRef: $ElementRefObject<'svg'> = React.createRef();
  diagonalProjection = window.d3.svg.diagonal().projection(d => [d.y, d.x]);
  resizeRegistration = ElementResizeService.register(this.onResize);
  state = {
    height: 10,
    width: 10,
  };

  tree = window.d3.layout.tree();

  componentDidMount() {
    this.update(this.getRoot());
  }

  componentDidUpdate() {
    this.update(this.getRoot());
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

    const grouping = groupBySettings.settingsForGroup(dimension);
    if (grouping === undefined) {
      return name || '';
    }

    return grouping.formatGroupingValue(name);
  }

  getNodeDisplayValue({ depth, metrics }: D3HierarchyNode): string | void {
    const { controls, seriesSettings } = this.props;
    const selectedField = controls.selectedField();
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

  // Find the largest number of nodes that are visible in any column.
  getMaxColumnNodeCount(): number {
    const root = this.getRoot();
    const nodesPerLevel: Map<number, number> = new Map();
    function countNodesPerLevel({ children, depth }: D3HierarchyNode) {
      const count = nodesPerLevel.get(depth) || 0;
      nodesPerLevel.set(depth, count + 1);
      if (children) {
        children.map(c => countNodesPerLevel(c));
      }
    }

    countNodesPerLevel(root);
    return Math.max(...nodesPerLevel.values()) || 1;
  }

  getTreeHeight(): number {
    // Force a minimum node height by changing the height of the tree that is
    // rendered.
    const maxNodeCount = this.getMaxColumnNodeCount();
    return Math.max(this.state.height, maxNodeCount * MIN_NODE_HEIGHT) - 5;
  }

  update(source: D3HierarchyNode | void) {
    const { current } = this._treeRef;
    if (!current || source === undefined) {
      return;
    }

    // Update the root and tree layout based on size changes.
    const height = this.getTreeHeight();
    const trueWidth = this.state.width - MARGIN_LEFT;
    const root = this.getRoot();
    root.x0 = height / 2;
    root.y0 = 0;
    this.tree.size([height, trueWidth]);

    // HACK(stephen): Directly set the height of the SVG so that scrolling can
    // happen if it is too large for the container.
    // $FlowExpectedError[prop-missing]
    current.style.height = `${height}px`;

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
    const columnWidth = trueWidth / levels;
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
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr('fill', d => (d._children ? 'lightsteelblue' : '#fff'));

    nodeEnter
      .append('text')
      .attr('x', d => (d.children || d._children ? -10 : 10))
      .attr('dy', '.35em')
      .attr('font-family', 'Lato, Arial')
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
      .attr('fill', 'none')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1.5)
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

  @autobind
  onResize({ contentRect }: ResizeObserverEntry) {
    const { height, width } = contentRect;
    this.setState({ height, width });
  }

  // To support scrollability inside the expandotree, both the parent container
  // size (passed into renderVisualization) and the tree size are needed.
  // TODO(stephen): This visualization needs to be rebuilt.
  @autobind
  renderVisualization(height: number): React.Node {
    return (
      <div
        className="expando-tree"
        ref={this.resizeRegistration.setRef}
        style={{ height, overflow: 'auto' }}
      >
        <svg className="expando-tree__chart" ref={this._treeRef}>
          <g transform={`translate(${MARGIN_LEFT}, 0)`} />
        </svg>
      </div>
    );
  }

  render(): React.Node {
    return (
      <Visualization loading={this.props.loading}>
        {this.renderVisualization}
      </Visualization>
    );
  }
}

/* eslint-enable no-param-reassign */

export default (withScriptLoader(ExpandoTree, {
  scripts: [VENDOR_SCRIPTS.d3],
  loadingNode: <ProgressBar enabled />,
}): React.AbstractComponent<
  React.Config<Props, VisualizationDefaultProps<'EXPANDOTREE'>>,
>);
