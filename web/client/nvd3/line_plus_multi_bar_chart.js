/* eslint-disable no-param-reassign */
import memoizeOne from 'memoize-one';

import { wrapText } from 'nvd3/util';

const GOAL_LINE_LABEL_MAX_WIDTH = 150;
let TEXT_MEASUREMENT_DIV;
const GOAL_LINE_DRAG_ENABLED = false;

// The NVD3 builtin linePlusBarChart doesn't support multibars. This small
// stub adds support for multibars to this chart type and fixes the annoying
// quirks that arise.
//
// Usage: This chart follows the standard linePlusBarChart with the added
// ability to treat bars and bars2 as multibars. You can also choose to have
// bars on the second y-axis instead of the default lines. The linePlusBarChart
// implementation has a strong dependency on the x-axis using a linear scale.
// This clashes with the multiBar's ordinal scale requirement. To work around
// this, you should use linear values for the x axis and use
//   chart.xAxis.tickFormat
// to convert the linear values back to their ordinal values for display. The
// final quirk is that the xAxis labels are not properly drawn on initial chart
// render. If the user moves the focus window around, though, the xAxis labels
// are rendered properly. To fix the initial render bug, you should chain a
// draw call to the x-axis like this:
//   d3.select(this.refs.graph)
//     .datum(data)
//     .call(chart)
//     .call(chart.updateXAxis)
const NVLinePlusMultiBarChart = (useBarForSecondAxis = false) => {
  // Secretly swap out the historical bar the chart uses with a multibar.
  const originalHistoricalBar = nv.models.historicalBar;
  const originalLine = nv.models.line;
  nv.models.historicalBar = nv.models.multiBar;

  // Swapping between bars and lines on the second y axis can only be
  // done during chart instantiation.
  // TODO(stephen): If we really want to support toggling between the
  // two, get your hands dirty and implement the NVD3 chart directly
  // and get rid of all these overrides.
  if (useBarForSecondAxis) {
    nv.models.line = () => {
      const bar = nv.models.multiBar();
      // Add dummy methods that NVD3 can call without error
      bar.interactive = () => {};
      bar.pointActive = () => {};
      return bar;
    };
  }

  const chart = nv.models.linePlusBarChart();

  // Reset the historicalBar to its original value
  nv.models.historicalBar = originalHistoricalBar;
  nv.models.line = originalLine;

  // Utility function for checking if a domain is empty.
  // A domain === [-1, 1] is considered empty
  const domainIsEmpty = domain =>
    !domain ||
    !domain.length ||
    (domain.length === 2 && domain[0] === -1 && domain[1] === 1);

  // Manually update the x-axis labels independent of when linePlusBarChart
  // is updated. There are a few different times we want to force a
  // rerender on the x-axis: on initial render of the chart and after the
  // focus area is changed.
  // TODO(stephen): I would love if there were a way to do this automatically
  // when the linePlusBarChart is called by d3, but so far I have not found
  // a way to do this. (linePlusBarChart is a function object so any changes
  // to its constructor would lose the object properties we need to pass on)
  chart.updateXAxis = () => {
    d3.select(chart.container)
      .select('.nv-x.nv-axis')
      .transition()
      .call(chart.xAxis);
  };

  // Rewrite how the xAxis scale method works so that we can cancel out the
  // ability to set domain on this axis. NVD3 wants to explicitly set the
  // domain on this axis using the focus window size. Since we are using
  // an ordinal scale instead of a linear scale, this breaks the axis
  // labeling. The original scale method will set the appropriate domain,
  // so just disable the domain method so that NVD3 can't override the
  // domain.
  // github.com/novus/nvd3/blob/v1.8.5/src/models/linePlusBarChart.js#L475
  chart.xAxis.__scale = chart.xAxis.scale;
  chart.xAxis.scale = (...args) => {
    const output = chart.xAxis.__scale(...args);
    chart.xAxis.domain = () => {};
    return output;
  };

  // Some bar graph visualization settings can only be applied correctly
  // after the bars successfully render. Here we handle updating the
  // data value displays and the bar spacing.
  function onBarsRenderEnd() {
    chart._updateValueDisplay();
    chart._updateBarSpacing();
    chart._updateRotateXAxisLabels();
    chart._updateGridLines();
  }

  // If only a single bar is displayed on the graph, an error will be thrown
  // in linePlusBarChart. There is an expectation that the bars xRange will
  // always have two elements. For ordinal scales, that is not guaranteed.
  // We use rangeExtent (which returns the range boundaries) instead
  // to meet the desired behavior.
  // github.com/novus/nvd3/blob/v1.8.5/src/models/linePlusBarChart.js#L514
  const hookRange = xScale => {
    if (xScale.__range) {
      return;
    }

    xScale.__range = xScale.range;
    xScale.range = (...args) => {
      const result = xScale.__range(...args);

      if (args.length) {
        return result;
      }

      return xScale.rangeExtent();
    };
  };

  // Because we use a multibar instead of a historicalbar, the individual
  // points that make up the line series will not be aligned proprly.
  // Calculate where the lines should start and end. The multibar chart
  // will center its x labels in the center of a bar group, while the line
  // will normally center its points at the exact x index the point represents.
  // Shift the range that the line starts and ends so that it is aligned
  // with the labels.
  const hookRangeBands = xScale => {
    // Only override rangeBands if the second y axis chart type is lines
    if (xScale.__rangeBands || useBarForSecondAxis) {
      return;
    }

    xScale.__rangeBands = xScale.rangeBands;
    xScale.rangeBands = (...args) => {
      const result = xScale.__rangeBands(...args);

      // If no bars are being shown, let the line chart's default behavior
      // happen.
      const domain = xScale.domain();
      if (domainIsEmpty(domain)) {
        return result;
      }

      // Calculate where the first and last bar groups start. Use the
      // non-patched range to retrieve the aligned start and end points
      // instead of the range boundaries.
      const range = xScale.__range();
      const firstGroupStart = range[0];
      const lastGroupStart = range[range.length - 1];

      // Use the bar group's width to calculate the start offset
      // needed to reach the center of the bar group
      const barGroupWidth = xScale.rangeBand();
      const startOffset = barGroupWidth / 2;

      // Override the line chart's xRange so that the individual line points
      // align with the x axis label.
      chart.lines.xRange([
        firstGroupStart + startOffset,
        lastGroupStart + startOffset,
      ]);

      return result;
    };
  };

  // Attach and initialize all the hooks that affect the xScale
  const hookXScale = model => {
    if (model.__xScale) {
      return;
    }

    model.__xScale = model.xScale;
    model.xScale = (...args) => {
      // Any time the xScale is set, patch in our range hack.
      const output = model.__xScale(...args);
      hookRange(output);
      hookRangeBands(output);
      return output;
    };

    // Initialize the current xScale with our patch
    model.xScale();
  };

  // TODO(stephen): So when do you want to create your own version of NVD3
  // or fork it? It'd be a lot better to apply this font size during the
  // render call and not afterwards so that the display doesn't jump around
  const addAxisProperty = (axis, property) => {
    axis[property] = d => {
      if (typeof d === 'undefined') {
        return axis[`_${property}`];
      }
      axis[`_${property}`] = d;
      return axis;
    };
  };

  // Add new public method for setting the axis label font size
  const addAdditionalFontSizeMethods = axis => {
    addAxisProperty(axis, 'labelFontSize');
  };

  // Add new public method for setting the axis label font size
  const addAdditionalFontColorMethods = axis => {
    addAxisProperty(axis, 'labelFontColor');
    addAxisProperty(axis, 'tickFontColor');
    addAxisProperty(axis, 'labelFontFamily');
    addAxisProperty(axis, 'tickFontFamily');
    addAxisProperty(axis, 'additionalAxisTitleDistance');
  };

  // Add new public methods for setting goal line properties
  const addGoalLineMethods = axis => {
    // only add goalLine support for y axes
    if (axis !== chart.xAxis) {
      const properties = [
        'goalLineValue',
        'goalLineLabel',
        'goalLineFontSize',
        'goalLineColor',
        'goalLineThickness',
        'goalLineStyle',
      ];
      properties.forEach(property => addAxisProperty(axis, property));
    }

    axis.clearGoalLine = goalLineClass => {
      d3.select(chart.container)
        .select(`.${goalLineClass}`)
        .remove();
    };
  };

  // Calculates the height of the text in the goal line label by
  // creating a hidden div of the same width, font and text and measuring
  // its height. Used to align the initial position of the goal line label.
  const getTextHeight = memoizeOne((text, maxWidth, fontSize) => {
    if (!TEXT_MEASUREMENT_DIV) {
      TEXT_MEASUREMENT_DIV = document.createElement('div');
      document.body.append(TEXT_MEASUREMENT_DIV);
    }
    TEXT_MEASUREMENT_DIV.style.visibility = 'hidden';
    TEXT_MEASUREMENT_DIV.style.fontSize = fontSize;
    TEXT_MEASUREMENT_DIV.style.position = 'absolute';
    TEXT_MEASUREMENT_DIV.style.width = `${maxWidth}px`;
    TEXT_MEASUREMENT_DIV.innerHTML = text;
    return TEXT_MEASUREMENT_DIV.clientHeight;
  });

  // Add support for the additional rendering that NVD3 doesn't support:
  // - axis label (title) font size
  // - maxMin tick font sizes
  // - goal line rendering
  const addAxisRenderEndCallback = axis => {
    axis.dispatch.on('renderEnd', function onAxisRenderEnd() {
      // Handle axis label font size
      const labelFontSize = axis.labelFontSize();
      const labelFontColor = axis.labelFontColor();
      const labelFontFamily = axis.labelFontFamily();
      const additionalAxisTitleDistance = axis.additionalAxisTitleDistance();
      if (typeof labelFontSize !== 'undefined') {
        // Use the parent node, which points to the axis wrapper, to reliably
        // find the axis label
        d3.select(this.parentNode)
          .select('text.nv-axislabel')
          .style('font-size', labelFontSize)
          .style('fill', labelFontColor)
          .style('font-family', labelFontFamily);
      }

      const distance =
        additionalAxisTitleDistance === undefined
          ? 0
          : Number.parseInt(additionalAxisTitleDistance, 10);

      // Only apply the offset distance if an axis label has been set and the
      // user has provided a non-zero offset.
      if (distance !== 0) {
        const labelNode = d3
          .select(this.parentNode)
          .select('text.nv-axislabel');
        if (labelNode.size() === 1) {
          const offsetY = Number.parseFloat(labelNode.attr('y')) + distance;
          labelNode.attr('y', `${offsetY}`);
        }
      }

      const tickFontColor = axis.tickFontColor();
      const tickFontFamily = axis.tickFontFamily();
      if (typeof tickFontColor !== 'undefined') {
        d3.select(this.parentNode)
          .selectAll('.nv-axis .tick')
          .selectAll('text')
          .style('fill', tickFontColor)
          .style('font-family', tickFontFamily);
      }

      // Handle maxMin tick font sizes (they should be the same size as
      // the rest of the ticks)
      const tickFontSize = axis.fontSize();
      if (typeof tickFontSize !== 'undefined') {
        d3.select(this.parentNode)
          .selectAll('.nv-axisMaxMin')
          .select('text')
          .style('font-size', tickFontSize)
          .style('fill', tickFontColor)
          .style('font-family', tickFontFamily)
          .attr('y', `-${Math.ceil(parseInt(tickFontSize, 10) / 2)}`);
      }

      // Handle goal line rendering
      if (axis !== chart.xAxis) {
        const axisName = chart.y1Axis === axis ? 'y1Axis' : 'y2Axis';
        const goalLineValue = parseFloat(axis.goalLineValue());
        const goalLineLabel = axis.goalLineLabel();
        const goalLineFontSize = axis.goalLineFontSize();
        const goalLineClass = `nv-goalLineWrap-${axisName}`;
        const goalLineColor = axis.goalLineColor();
        const goalLineThickness = axis.goalLineThickness();
        const lineStyleIsDashed =
          axis.goalLineStyle() ===
          t(
            'visualizations.common.SettingsModal.AxesSettingsTab.goalLineStyleDashed',
          );
        const goalLineDashWidth = lineStyleIsDashed ? 20 : 0;

        axis.clearGoalLine(goalLineClass);

        // parseFloat will return NaN if the string is empty or not a number
        if (!Number.isNaN(goalLineValue)) {
          const [min, max] = axis.domain();
          if (goalLineValue > min && goalLineValue < max) {
            const graphWidth = chart.xAxis.range()[1];
            const graphHeight = axis.range()[0];

            // To place the goal line, we can scale it
            // based on the min/max values and graphHeight
            const goalLineYPos =
              graphHeight - (graphHeight * (goalLineValue - min)) / (max - min);

            const goalLineLabelHeight = getTextHeight(
              goalLineLabel,
              GOAL_LINE_LABEL_MAX_WIDTH,
              goalLineFontSize,
            );

            // TODO (david): use persisted positions when draggability has been
            // included. See D1805 for more details.
            const goalLineLabelXPosition =
              graphWidth - GOAL_LINE_LABEL_MAX_WIDTH;
            const goalLineLabelYPosition =
              goalLineYPos - goalLineLabelHeight + 7;

            const lineFunction = d3.svg
              .line()
              .x(d => d.x)
              .y(d => d.y)
              .interpolate('linear');

            const goalLineEndCoordinates = [
              { x: 0, y: goalLineYPos },
              { x: graphWidth, y: goalLineYPos },
            ];

            const focusElt = d3.select(chart.container).select('.nv-focus');
            const goalLineWrap = focusElt
              .append('g')
              .attr('class', goalLineClass);

            goalLineWrap
              .append('path')
              .attr('d', lineFunction(goalLineEndCoordinates))
              .attr('stroke-width', goalLineThickness)
              .attr('stroke', goalLineColor)
              .attr('stroke-dasharray', `${goalLineDashWidth}`)
              .style('fill', 'none');

            const goalLineLabelDrag = d3.behavior
              .drag()
              .on('dragstart', () => {
                d3.event.sourceEvent.stopPropagation();
              })
              .on('drag', function onDrag() {
                d3.select(this)
                  .selectAll('tspan')
                  .attr('y', d3.event.y)
                  .attr('x', d3.event.x);
              })
              .on('dragend', function onDragEnd() {
                // eslint-disable-next-line no-unused-vars
                const x = d3
                  .select(this)
                  .select('tspan')
                  .attr('x');
                // eslint-disable-next-line no-unused-vars
                const y = d3
                  .select(this)
                  .select('tspan')
                  .attr('y');
                // TODO (david): persist these new positions
              });

            goalLineWrap
              .append('text')
              .attr('x', goalLineLabelXPosition)
              .attr('y', goalLineLabelYPosition)
              .style('font-size', goalLineFontSize)
              .style('fill', goalLineColor)
              .text(goalLineLabel)
              // Add an outline in case it overlaps with axis ticks
              .attr('paint-order', 'stroke')
              .attr('stroke', 'white')
              .attr('stroke-width', 5)
              .style('font-weight', 800);

            if (GOAL_LINE_DRAG_ENABLED) {
              goalLineWrap.call(goalLineLabelDrag);
            }

            wrapText(
              goalLineWrap.select('text'),
              GOAL_LINE_LABEL_MAX_WIDTH,
              goalLineFontSize,
            );
          }
        }
      }
    });
  };

  // TODO(stephen): It isn't really necessary to put this in a function, but
  // it makes it more separated from the other hacks and addons.
  const addValueDisplaySupport = () => {
    const TEXT_WRAP_CLASS = 'nv-textWrap';

    // Add ability to format chart values based on series specific settings
    chart._valueFormatter = d => d.y;
    chart.valueFormatter = formatter => {
      if (typeof formatter === 'undefined') {
        return chart._valueFormatter;
      }
      chart._valueFormatter = formatter;
      return chart;
    };

    // Render data labels for the bar series that have enabled it. To trigger
    // a series to display value labels, set the property `showValues` to true
    // on the series definition. The `valueFontSize` can optionally be used
    // to set the desired font size of the label.
    // TODO(stephen): Fix bug where second y-axis values aren't displayed
    chart._updateValueDisplay = () => {
      // Always clear the text annotations before checking whether to
      // show values or not. Because we trigger value display on a renderEnd
      // event, we will receive the new value for showValues(). If we were to
      // clear after the check, we would still leave the values displayed
      // since the previous value was true and the new value is false.
      chart._clearValueDisplay();
      const focusElt = d3.select(chart.container).select('.nv-focus');

      // Find the series that have annotations enabled
      const groupData = focusElt.select('.nv-focus .nv-groups').data();
      if (!groupData || !groupData.length || !groupData[0]) {
        return;
      }

      const enabledSeries = {};
      let numSeries = 0;
      groupData[0].forEach(group => {
        if (group.showValues && !group.disabled) {
          // TODO(stephen): Find a cleaner way to do this.
          const { key, valueFontSize } = group;
          enabledSeries[key] = { valueFontSize };
          numSeries++;
        }
      });

      if (!numSeries) {
        return;
      }

      // Draw the text outside the bar section so that it is not affected
      // by the bar's clipping path.
      // TODO(stephen): Check to see if the annotations can accidentally
      // extend too far outside their container and collide with the title
      // TODO(stephen): Is there a way we can reuse the text wrap element
      // and not destroy/recreate it each render pass?
      const textWrap = focusElt.append('g').attr('class', TEXT_WRAP_CLASS);

      // Loop through each data series and process the bars
      focusElt
        .selectAll('.nv-group')
        .each(function processBarSeries(seriesData) {
          const { key } = seriesData;
          if (!enabledSeries[key]) {
            return;
          }

          const { valueFontSize } = enabledSeries[key];

          // Loop through all the bars in this series and add a
          // text element for each bar we want to display
          d3.select(this)
            .selectAll('.nv-bar')
            .each(function addText(data) {
              const barElt = d3.select(this);

              // Position the labels rotated and above the bars they represent
              const width = parseInt(barElt.attr('width'), 10);

              // Use the x and y positioning of the bar to know where in
              // the group to draw the label
              // prettier-ignore
              const x = parseInt(barElt.attr('x'), 10) + (width / 2);
              const y = parseInt(barElt.attr('y'), 10) - 3;
              const transform = barElt.attr('transform');
              const rotate = chart._rotateDataValueLabels
                ? `rotate(-45 ${x},${y})`
                : '';

              textWrap
                .append('text')
                .attr('x', x)
                .attr('y', y)
                .attr('transform', `${transform} ${rotate}`)
                .style('font-size', valueFontSize)
                .style('font-weight', 600)
                .style(
                  'text-anchor',
                  chart._rotateDataValueLabels ? 'start' : 'middle',
                )
                .classed('data-label', true)
                .text(chart.valueFormatter()(data));
            });
        });
    };

    // Clear any displayed data labels
    chart._clearValueDisplay = () => {
      d3.select(chart.container)
        .selectAll(`.${TEXT_WRAP_CLASS}`)
        .remove();
    };
  };

  // TODO(pablo): It isn't really necessary to put this in a function, but
  // it makes it more separated from the other hacks and addons.
  // HACK(pablo): this is fine for now given that our whole bar chart is
  // basically a whole series of hacks. Figure out a better way of handling
  // these bar spacing customizations.
  // bar spacing customization when the bar graph is refactored away from nvd3.
  // $CycloneIdaiHack
  const addRemoveBarSpacingSupport = () => {
    // Add ability to format bar spacing based on visualization settings
    chart.removeBarSpacing = removeSpacing => {
      if (typeof removeSpacing === 'undefined') {
        return chart._removeBarSpacing;
      }
      chart._removeBarSpacing = removeSpacing;
      return chart;
    };

    chart._updateBarSpacing = () => {
      if (!chart.removeBarSpacing()) {
        return;
      }

      // Instruct the browser to possibly turn off anti-aliasing to ensure there
      // are no tiny tiny gaps between bars.
      chart.container.setAttribute('shape-rendering', 'crispEdges');

      const bars = d3
        .select(chart.container)
        .select('.nv-barsWrap')
        .selectAll('.nv-group')
        .selectAll('.nv-bar');
      const numBars = bars[0].length;
      const barContainerWidth = d3
        .select(chart.container)
        .select('.nv-context')
        .select('.nv-barsWrap')
        .node()
        .getBoundingClientRect().width;
      const barWidth = barContainerWidth / numBars;

      // get the initial translateX value for the first bar
      const baseXTranslation = d3.transform(
        d3.select(bars[0][0]).attr('transform'),
      ).translate[0];
      bars.each(function modifyBarSpacing(_, i) {
        d3.select(this)
          .attr('width', barWidth)
          .attr('transform', `translate(${baseXTranslation + i * barWidth})`);
      });
    };
  };

  const addRemoveRotatedLabelsSupport = () => {
    // Add ability to remove rotated x-axis labels based on visualization
    // settings

    // Rotate by default
    chart._rotateXAxisLabels = true;
    chart._rotateDataValueLabels = true;

    chart.rotateXAxisLabels = rotateLabels => {
      if (typeof rotateLabels === 'undefined') {
        return chart._rotateXAxisLabels;
      }
      chart._rotateXAxisLabels = rotateLabels;
      return chart;
    };

    chart.rotateDataValueLabels = rotateLabels => {
      if (typeof rotateLabels === 'undefined') {
        return chart._rotateDataValueLabels;
      }
      chart._rotateDataValueLabels = rotateLabels;
      return chart;
    };

    chart._updateRotateXAxisLabels = () => {
      const transform = chart._rotateXAxisLabels
        ? 'rotate(45 0,14)'
        : 'translate(0, 5)';
      const textAnchor = chart._rotateXAxisLabels ? 'start' : 'middle';
      d3.select(chart.container)
        .select('.nv-axis')
        .selectAll('.tick text')
        .each(function eachText() {
          d3.select(this)
            .attr('transform', transform)
            .style('text-anchor', textAnchor);
        });
    };
  };

  const addHideGridLinesSupport = () => {
    // Add ability to remove the grid lines based on visualization settings
    chart.hideGridLines = hideLines => {
      if (typeof hideLines === 'undefined') {
        return chart._hideGridLines;
      }
      chart._hideGridLines = hideLines;
      return chart;
    };

    chart._updateGridLines = () => {
      // hide the horizontal lines
      d3.select(chart.container)
        .select('.nv-y1')
        .selectAll('.tick')
        .select('line')
        .each(function hideGridLine(_, i) {
          // don't hide the main x-axis line
          if (i !== 0) {
            d3.select(this).style(
              'display',
              chart._hideGridLines ? 'none' : 'block',
            );
          }
        });
    };
  };

  const clearAxisCustomizations = () => {
    chart._clearValueDisplay();
  };

  chart.dispatch.on('brush', ({ brush }) => {
    // Since NVD3 doesn't expose the brush on this chart publicly, we need
    // to capture it when the first brush event fires.
    if (!chart.brush) {
      // When we switched to using an ordinal scale and prevented domain from
      // being set, a bug emerged where the xAxis labels wouldn't set properly
      // after a brush event (the labels would work if you dragged the
      // focus area forward but not backward). Attach a listener to the brush
      // end event and explicilty call d3 with the xAxis data to ensure
      // the correct axis labels are set.
      brush.on('brushend', chart.updateXAxis);

      // Clear the displayed values every time the user interacts with the
      // focus bar since it would be jarring to try and update them live.
      brush.on('brushstart', clearAxisCustomizations);
      chart.brush = brush;
    }
  });

  const multiBars = [chart.bars, chart.bars2];
  if (useBarForSecondAxis) {
    multiBars.push(chart.lines);
    multiBars.push(chart.lines2);

    // Copy the bar event listeners and register them with the new bars
    chart.lines.dispatch.on(
      'elementMouseover.tooltip',
      chart.bars.dispatch.elementMouseover,
    );
    chart.lines.dispatch.on(
      'elementMousemove.tooltip',
      chart.bars.dispatch.elementMousemove,
    );
  } else {
    // Fix bug handled in upstream NVD3 code. There is an issue with scatter
    // plots not cleaning up their points sometimes.
    // https://github.com/novus/nvd3/pull/1912
    chart.lines.dispatch.on('renderEnd', () => {
      if (domainIsEmpty(chart.lines.xScale().domain())) {
        const wrap = d3.select(chart.container).select('.nv-scatterWrap');
        wrap
          .select('.nv-point-clips')
          .selectAll('clipPath')
          .remove();
        wrap
          .select('.nv-point-paths')
          .selectAll('path')
          .remove();
      }
    });
  }

  // Add support for multiBar options to the base chart
  chart.groupSpacing = value => {
    multiBars.forEach(item => item.groupSpacing(value));
    return chart;
  };

  // Patch the xScale of all multiBars being displayed to ensure the scale
  // based calculations work correctly with linePlusBarChart's assumptions
  multiBars.forEach(item => hookXScale(item));

  // Add support for additional axis functionality
  const axes = [chart.xAxis, chart.y1Axis, chart.y2Axis];
  const axisSupplements = [
    addAdditionalFontSizeMethods,
    addAdditionalFontColorMethods,
    addAxisRenderEndCallback,
    addGoalLineMethods,
  ];
  axisSupplements.forEach(supplementFn => axes.forEach(supplementFn));

  // add support for the extra features that are processed after rendering
  addValueDisplaySupport(chart);
  addRemoveBarSpacingSupport(chart);
  addRemoveRotatedLabelsSupport(chart);
  addHideGridLinesSupport(chart);

  // Need to trigger the value annotation rendering, and the bar spacing
  // modification, after the bars have finished drawing. This is because
  // we need the bar coordinates and dimensions to accurately position these
  // customizations.
  chart.bars.dispatch.on('renderEnd', onBarsRenderEnd);

  return chart;
};

export default NVLinePlusMultiBarChart;
