import React from 'react';
import ReactDOM from 'react-dom';

import BoxPlotQueryResultData from 'components/visualizations/BoxPlot/models/BoxPlotQueryResultData';
import BoxPlotTooltip from 'components/visualizations/BoxPlot/BoxPlotTooltip';
import ProgressBar from 'components/ui/ProgressBar';
import PropDefs from 'util/PropDefs';
import ResizeService from 'services/ResizeService';
import Visualization from 'components/visualizations/common/Visualization';
import withScriptLoader from 'components/common/withScriptLoader';
import ZenPropTypes from 'util/ZenPropTypes';
import { debounce, omit } from 'util/util';
import { splitCamelCase } from 'util/stringUtil';
import { VENDOR_SCRIPTS } from 'vendor/registry';
import { visualizationPropDefs } from 'components/visualizations/common/commonPropDefs';

const propDefs = PropDefs.create('boxPlot').addGroup(
  visualizationPropDefs
    .propTypes({
      queryResult: BoxPlotQueryResultData.type(),
      resizeService: ZenPropTypes.singleton(ResizeService),
    })
    .defaultProps({
      queryResult: BoxPlotQueryResultData.create(),
      resizeService: ResizeService,
    }),
);

let TOOLTIP_CONTAINER_ELT = null;

const CHART_COLORS = {
  0: '#D13913',
  1: '#E16512',
  2: '#FF6347',
  3: '#D99E0B',
  4: '#29A634',
  5: '#00FF00',
  6: '#00B3A4',
  7: '#2965CC',
  8: '#00BFFF',
  9: '#7157D9',
  10: '#8F398F',
  11: '#DB2C6F',
};

// TODO(pablo): BoxPlot does not take into account selected filters
// in Filter/Color modal
// TODO(pablo): clean up BoxPlot by moving all d3 logic from ExplodingBoxplot.js
// into React components
class BoxPlot extends React.PureComponent {
  constructor(props) {
    super(props);
    this._resizeSubscription = undefined;
    this._chartElt = React.createRef();

    this.onResize = debounce(this.onResize.bind(this), 250);
    this.showTooltip = this.showTooltip.bind(this);
    this.removeTooltip = this.removeTooltip.bind(this);

    if (!TOOLTIP_CONTAINER_ELT) {
      TOOLTIP_CONTAINER_ELT = document.createElement('div');
      document.body.appendChild(TOOLTIP_CONTAINER_ELT);
    }
  }

  componentDidMount() {
    this._chart = this.createChart(this.props);

    if (this.props.queryResult.data().length > 0) {
      this.updateChartData();
    }
    this._resizeSubscription = this.props.resizeService.subscribe(
      this.onResize,
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.controls !== this.props.controls) {
      this._chart = this.createChart(this.props);
    }

    this.updateChartData();

    // HACK(pablo, stephen): This visualization relies on the query result to be
    // able to
    if (
      prevProps.queryResult !== this.props.queryResult &&
      this.props.queryResult.data().length > 0
    ) {
      // Now that we have data, we also have to change the default groupBy
      // control. We set it to the last groupable key. In the backend we're
      // enforcing that the last key is equal to selections.granularity.
      // If selections.granularity is a geo granularity, then the last
      // item of this array will be the largest administrative division.
      // e.g. if selections.granularity = WoredaName, then the last
      // key in this array will be RegionName
      const keys = this.props.queryResult.groupableKeys();
      const groupByKey = keys[keys.length - 1];

      if (groupByKey && this.props.controls.groupBy !== groupByKey) {
        this.props.onControlsSettingsChange('groupBy', groupByKey);
      }
    }
  }

  componentWillUnmount() {
    this.props.resizeService.unsubscribe(this._resizeSubscription);
  }

  // eslint-disable-next-line class-methods-use-this
  showTooltip(data, x, y) {
    const value = data.val;
    const metadata = omit(data, 'val');
    ReactDOM.render(
      <BoxPlotTooltip x={x} y={y} metadata={metadata} value={value} />,
      TOOLTIP_CONTAINER_ELT,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  removeTooltip() {
    ReactDOM.unmountComponentAtNode(TOOLTIP_CONTAINER_ELT);
  }

  updateDimensions() {
    if (this._chartElt.current) {
      const { height, width } = this._chartElt.current.getBoundingClientRect();
      this._chart.height(height).update();
      this._chart.width(width).update();
    }
  }

  createChart({ controls }) {
    const { groupBy } = controls;
    const chart = ExplodingBoxplot();
    chart.colors(CHART_COLORS);
    chart.events({
      point: {
        mouseover: data => {
          const [x, y] = d3.mouse(document.body);
          this.showTooltip(data, x, y);
        },
        mouseout: this.removeTooltip,
      },
    });

    // TODO(pablo): feed the group and color_index through the
    // settings modal props (which well be retrieved from the backend).
    // Same goes for the axes labels. Nothing should be hardcoded.
    chart.options({
      data: {
        group: groupBy,
        color_index: groupBy,
      },
      logy: false,
      axes: {
        x: { label: splitCamelCase(groupBy) },
        y: { key: 'val', label: 'Value' },
      },
      margins: {
        bottom: 120,
        left: 120,
        right: 20,
      },
    });
    return chart;
  }

  updateChartData() {
    // render the data on the chart
    if (this._chartElt.current) {
      $(this._chartElt.current).empty();
      this._chart.data(this.props.queryResult.data());
      d3.select(this._chartElt.current).call(this._chart);
      this.updateDimensions();
    }
  }

  onResize() {
    this._chart = this.createChart(this.props);
    this.updateChartData();
  }

  render() {
    return (
      <Visualization
        className="box-plot-visualization"
        loading={this.props.loading}
      >
        <div ref={this._chartElt} className="box-plot-chart" />
      </Visualization>
    );
  }
}

PropDefs.setComponentProps(BoxPlot, propDefs);

export default withScriptLoader(BoxPlot, {
  scripts: [VENDOR_SCRIPTS.explodingBoxplot],
  loadingNode: <ProgressBar enabled />,
});
