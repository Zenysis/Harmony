// @flow
import * as React from 'react';

import ProgressBar from 'components/ui/ProgressBar';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { autobind, memoizeOne } from 'decorators';
import { formatNum } from 'components/QueryResult/resultUtil';
import type SunburstQueryResultData from 'components/visualizations/Sunburst/models/SunburstQueryResultData';
import type {
  D3SunburstNode,
  HierarchyNode,
} from 'components/visualizations/Sunburst/types';
import type { VisualizationProps } from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'SUNBURST'>;

const ROOT_NAME = window.__JSON_FROM_BACKEND.nationName;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
const BREADCRUMB_DIMS = {
  w: 170,
  h: 50,
  s: 3,
  t: 10,
};

/* eslint-disable no-param-reassign */
function stash(d: D3SunburstNode, idx: number) {
  // Zoom helper function. Setup for switching data: stash the old values for
  // transition.
  d.x0 = d.x;
  d.dx0 = d.dx;

  // Attach index for efficient element retrieval
  d.idx = idx;
}
/* eslint-enable no-param-reassign */

function breadcrumbPoints(_: mixed, i: number): string {
  // Generate a string that describes the points of a breadcrumb polygon.
  const { h, t, w } = BREADCRUMB_DIMS;

  const points = [];
  points.push('0,0');
  points.push(`${w},0`);
  points.push(`${w + t},${h / 2}`);
  points.push(`${w},${h}`);
  points.push(`0,${h}`);
  if (i > 0) {
    // Leftmost breadcrumb; don't include 6th vertex.
    points.push(`${t},${h / 2}`);
  }
  return points.join(' ');
}

function getAncestors(node: D3SunburstNode): $ReadOnlyArray<D3SunburstNode> {
  // Given a node in a partition layout, return an array of all of its
  // ancestor nodes, highest first, but excluding the root.
  const path = [];
  let current = node;
  while (current.parent) {
    // NOTE(stephen): While loop would catch this but Flow doesn't notice.
    if (current === undefined) {
      break;
    }
    path.unshift(current);
    current = current.parent;
  }
  return path;
}

class Sunburst extends React.PureComponent<Props> {
  // TODO(stephen, nina, anyone): Fix this.
  _selectedItems: any = new Set();
  _absoluteRef: any = undefined;
  _explanationRef: any = undefined;
  _identifierRef: any = undefined;
  _percentageRef: any = undefined;
  _sequenceRef: any = undefined;
  _sunburstRef: any = undefined;
  _vis: any = undefined;
  _container: any = undefined;
  _outerColor: any = undefined;
  _innerColor: any = undefined;
  _xScale: any = undefined;
  _yScale: any = undefined;
  _partition: any = undefined;
  _percentageElt: any = undefined;
  _absoluteElt: any = undefined;
  _identifierElt: any = undefined;
  _explanationElt: any = undefined;
  _trailElt: any = undefined;
  _path: any = undefined;
  _totalSize: any = undefined;
  _arc: any = undefined;

  componentDidMount() {
    this.setupSunburst();
  }

  componentDidUpdate() {
    this.setupSunburst();
  }

  cleanup() {
    if (this._vis) {
      this._vis.on('click', null);
      this._vis.on('mouseover', null);
      this._container.on('mouseleave', null);
      this._vis.selectAll('*').remove();
      this._vis.remove();
    }

    this._sunburstRef.innerHTML = '';
    this._sequenceRef.innerHTML = '';
  }

  setupD3Helpers() {
    const { radius } = this.getSunburstBounds();

    // D3 coloring scale.
    this._outerColor = window.d3.scale.category20c();
    this._innerColor = window.d3.scale.category20();

    // Used for zoom animation interpolation.
    this._xScale = window.d3.scale.linear().range([0, 2 * Math.PI]);

    this._yScale = window.d3.scale.sqrt().range([0, radius]);

    this._arc = window.d3.svg
      .arc()
      .startAngle(d => Math.max(0, Math.min(2 * Math.PI, this._xScale(d.x))))
      .endAngle(d =>
        Math.max(0, Math.min(2 * Math.PI, this._xScale(d.x + d.dx))),
      )
      .innerRadius(d => Math.max(0, this._yScale(d.y)))
      .outerRadius(d => Math.max(0, this._yScale(d.y + d.dy)));
  }

  getSunburstBounds() {
    const output = this._sunburstRef.getBoundingClientRect();
    output.radius = Math.min(output.height, output.width) / 2;
    return output;
  }

  setupSunburst() {
    const { selectedField } = this.props.controls;
    const { height, radius, width } = this.getSunburstBounds();
    this.cleanup();
    this.setupD3Helpers();
    this._vis = window.d3
      .select(this._sunburstRef)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .append('svg:g')
      .attr('class', 'container')
      .attr('transform', `translate(${width / 2},${height / 2})`)
      .on('mouseover', this.onHoverStart)
      .on('click', this.onClick);

    this._container = window.d3.select(this._sunburstRef).select('.container');

    this._partition = window.d3.layout
      .partition()
      .sort(null)
      .value(d => d.metrics[selectedField]);

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    this._vis
      .append('svg:circle')
      .attr('r', radius)
      .style('opacity', 0);

    // Add the mouseleave handler to the bounding circle.
    this._container.on('mouseleave', this.onHoverEnd);
    this.createVisualization();

    this._percentageElt = window.d3.select(this._percentageRef);
    this._absoluteElt = window.d3.select(this._absoluteElt);
    this._identifierElt = window.d3.select(this._identifierRef);
    this._explanationElt = window.d3.select(this._explanationRef);
    this._trailElt = window.d3.select(this._sequenceRef).select('.trail');
  }

  @autobind
  colorNode({ children, depth, name, parent }: D3SunburstNode) {
    if (!depth) {
      return '#fff';
    }
    if (depth === 1) {
      return this._innerColor(name);
    }

    const parentName = parent ? parent.name : '';
    return this._outerColor(children ? name : parentName);
  }

  // HACK(stephen): D3 mutates objects. To ensure we do not taint the original
  // root, we clone the full tree and use this clone for D3.
  @memoizeOne
  buildRoot(queryResult: SunburstQueryResultData): HierarchyNode {
    return JSON.parse(JSON.stringify(queryResult.root()));
  }

  createVisualization() {
    // Main function to draw and set up the visualization, once we have the
    // data. Basic setup of page elements.
    this.initializeBreadcrumbTrail();

    const root = this.buildRoot(this.props.queryResult);
    this._path = this._vis
      .datum(root)
      .selectAll('path')
      .data(this._partition.nodes)
      .enter()
      .append('svg:path')
      .attr('d', this._arc)
      .style('fill', this.colorNode)
      .each(stash);

    // Get total size of the tree = value of root node from partition.
    this._totalSize = this._path.node().__data__.value;
  }

  arcTweenZoom(
    d: D3SunburstNode,
    radius: number,
  ): (D3SunburstNode, number) => mixed => number {
    // When zooming: interpolate the scales.
    const xd = window.d3.interpolate(this._xScale.domain(), [d.x, d.x + d.dx]);
    const yd = window.d3.interpolate(this._yScale.domain(), [d.y, 1]);
    const yr = window.d3.interpolate(this._yScale.range(), [
      d.y ? 20 : 0,
      radius,
    ]);
    return (dd, i) =>
      i
        ? () => this._arc(dd)
        : t => {
            this._xScale.domain(xd(t));
            this._yScale.domain(yd(t)).range(yr(t));
            return this._arc(dd);
          };
  }

  resetExplanations() {
    // Hide the breadcrumb trail and explanation.
    this._trailElt.style('visibility', 'hidden');
    this._explanationElt.style('visibility', 'hidden');
  }

  initializeBreadcrumbTrail() {
    // Add the svg area.
    const trail = window.d3
      .select(this._sequenceRef)
      .append('svg:svg')
      .attr('width', '100%')
      .attr('height', 50)
      .attr('class', 'trail');
    // Add the label at the end, for the percentage.
    trail
      .append('svg:text')
      .attr('id', 'endlabel')
      .style('fill', '#000');
  }

  updateBreadcrumbs(
    nodeArray: $ReadOnlyArray<D3SunburstNode>,
    percentageString: string,
  ) {
    // Update the breadcrumb trail to show the current sequence and percentage.

    // Data join; key function combines name and depth (= position in sequence).
    const g = this._trailElt
      .selectAll('g')
      .data(nodeArray, d => d.name + d.depth);

    // Add breadcrumb and label for entering nodes.
    const entering = g.enter().append('svg:g');

    entering
      .append('svg:polygon')
      .attr('points', breadcrumbPoints)
      .style('fill', this.colorNode);

    const { h, t, w, s } = BREADCRUMB_DIMS;
    entering
      .append('svg:text')
      .attr('x', (w + t) / 2)
      .attr('y', h / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(this.getNodeDisplayName);

    // Set position for entering and updating nodes.
    g.attr('transform', (d, i) => `translate(${i * (w + s)}, 0)`);

    // Remove exiting nodes.
    g.exit().remove();

    // Now move and update the percentage at the end.
    this._trailElt
      .select('.endlabel')
      .attr('x', (nodeArray.length + 0.5) * (w + s))
      .attr('y', h / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .text(percentageString);

    // Make the breadcrumb trail visible, if it's hidden.
    this._trailElt.style('visibility', '');
  }

  @autobind
  getNodeDisplayName({ depth, dimension, name }: D3SunburstNode): string {
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

  @autobind
  onClick() {
    // Retrieve current js event
    const { target } = window.d3.event;
    const d = target.__data__;
    const { radius } = this.getSunburstBounds();

    this._path
      .transition()
      .duration(1000)
      .attrTween('d', this.arcTweenZoom(d, radius));
  }

  @autobind
  onHoverStart() {
    // Fade all but the current sequence and show it in the breadcrumb trail.

    // Retrieve current js event
    const { target } = window.d3.event;
    const d = target.__data__;
    if (!d || Number.isNaN(d.idx) || !d.depth) {
      // Don't display any information for root.
      this.resetExplanations();
      return;
    }

    this._container.attr('fill-opacity', '0.6');

    // prettier-ignore
    const percentage = (100 * d.value) / this._totalSize;
    let percentageString = `${percentage.toPrecision(3)}%`;
    if (percentage < 0.1) {
      percentageString = '< 0.1%';
    }

    this._absoluteElt.text(formatNum(Math.floor(d.value)));
    this._percentageElt.text(percentageString);
    this._identifierElt.text(this.getNodeDisplayName(d));
    this._explanationElt.style('visibility', '');

    const sequenceArray = getAncestors(d);
    this.updateBreadcrumbs(sequenceArray, percentageString);

    const indexes = new Set(sequenceArray.map(data => data.idx));
    indexes.forEach(idx => {
      this._path[0][idx].setAttribute('fill-opacity', '1');
    });

    // Remove attributes on previously selected
    this._selectedItems.forEach(idx => {
      if (!indexes.has(idx)) {
        this._path[0][idx].removeAttribute('fill-opacity');
      }
    });
    this._selectedItems = indexes;
  }

  @autobind
  onHoverEnd() {
    // Deactivate all segments during transition.
    this.resetExplanations();

    // Cleanup last highlighted items
    this._selectedItems.forEach(idx => {
      this._path[0][idx].removeAttribute('fill-opacity');
    });
    this._container.attr('fill-opacity', '1');
  }

  @autobind
  onResize() {
    this.cleanup();
  }

  renderExplanation() {
    return (
      <div
        className="explanation"
        ref={ref => {
          this._explanationRef = ref;
        }}
        style={{ visibility: 'hidden' }}
      >
        <span
          className="identifier"
          ref={ref => {
            this._identifierRef = ref;
          }}
        />
        <span> {t('query_result.sunburst.accounts_for')} </span>
        <span
          className="absolute"
          ref={ref => {
            this._absoluteRef = ref;
          }}
        />
        <br />
        <span
          className="percentage"
          ref={ref => {
            this._percentageRef = ref;
          }}
        />
        <span> {t('query_result.sunburst.of_total')}.</span>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className="sunburst-info-container">
        <div
          className="sequence"
          ref={ref => {
            this._sequenceRef = ref;
          }}
        />
        {this.renderExplanation()}
      </div>
    );
  }

  render() {
    return (
      <Visualization loading={this.props.loading} footer={this.renderFooter()}>
        <div
          className="sunburst"
          ref={ref => {
            this._sunburstRef = ref;
          }}
        />
      </Visualization>
    );
  }
}

export default withScriptLoader(Sunburst, {
  scripts: [VENDOR_SCRIPTS.d3],
  loadingNode: <ProgressBar enabled />,
});
