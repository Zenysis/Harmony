// @flow
import * as React from 'react';

import NumberTrendCore from 'components/ui/visualizations/NumberTrend';
import NumberTrendQueryResultData from 'models/visualizations/NumberTrend/NumberTrendQueryResultData';
import QueryScalingContext from 'components/common/QueryScalingContext';
import Visualization from 'components/visualizations/common/Visualization';
import { DEFAULT_THEME } from 'components/ui/visualizations/NumberTrend/defaults';
import { autobind, memoizeOne } from 'decorators';
import { visualizationDefaultProps } from 'components/visualizations/common/commonTypes';
import type {
  NumberTrendTheme,
  TrendPoint,
} from 'components/ui/visualizations/NumberTrend/types';
import type { StyleObject } from 'types/jsCore';
import type {
  VisualizationDefaultProps,
  VisualizationProps,
} from 'components/visualizations/common/commonTypes';

type Props = VisualizationProps<'NUMBER_TREND'>;

export default class NumberTrend extends React.PureComponent<Props> {
  static defaultProps: VisualizationDefaultProps<'NUMBER_TREND'> = {
    ...visualizationDefaultProps,
    queryResult: NumberTrendQueryResultData.create({}),
  };

  static contextType: typeof QueryScalingContext = QueryScalingContext;
  context: $ContextType<typeof QueryScalingContext>;

  buildPrimaryNumber(): {
    primaryFieldColor: string,
    primaryNumber: { label: string, value: string },
  } {
    const { controls, queryResult } = this.props;
    const { children } = queryResult.root();
    let { metrics } = queryResult.root();
    let colorValues;
    const selectedFieldId = controls.selectedField();
    if (children !== undefined && controls.showLastValue()) {
      const lastNode = children[children.length - 1];
      metrics = lastNode.metrics;
      colorValues = children.map(
        childNode => childNode.metrics[selectedFieldId],
      );
    }
    const { color, ...primaryNumber } = this.getDataPoint(
      metrics,
      selectedFieldId,
      colorValues,
    );
    return { primaryNumber, primaryFieldColor: color };
  }

  buildTheme(
    primaryColor: string,
    secondaryColor: string,
    visualizationHeight: number,
    visualizationWidth: number,
  ): NumberTrendTheme {
    const { primaryNumber, secondaryNumber } = DEFAULT_THEME;
    return {
      primaryNumber: {
        ...primaryNumber,
        displayValueAsPill: this.props.controls.displayValueAsPill(),
        valueFontColor: primaryColor,
      },
      secondaryNumber: {
        ...secondaryNumber,
        valueFontColor: secondaryColor,
      },
      ...this.buildTrendDimensions(visualizationHeight, visualizationWidth),
    };
  }

  buildTrendDimensions(
    visualizationHeight: number,
    visualizationWidth: number,
  ): { trendHeight: number, trendWidth: number } {
    const scaleFactor = this.context ? this.context.scaleFactor : 1;

    const trendHeight = DEFAULT_THEME.trendHeight * scaleFactor;
    const trendWidth = DEFAULT_THEME.trendWidth * scaleFactor;

    // NOTE(nina): The trend line should never be cut off by its container.
    // This is a check to prevent that from happening
    return {
      trendHeight:
        trendHeight > visualizationHeight ? visualizationHeight : trendHeight,
      trendWidth:
        trendWidth > visualizationWidth ? visualizationWidth : trendWidth,
    };
  }

  @memoizeOne
  buildTrendPoints(
    selectedField: string,
    queryResult: NumberTrendQueryResultData,
  ): $ReadOnlyArray<TrendPoint> {
    const points = [];
    const { children } = queryResult.root();
    if (children !== undefined) {
      children.forEach(child => {
        const { metrics, name } = child;
        const rawValue = metrics[selectedField];

        if (rawValue === undefined || rawValue === null) {
          return;
        }
        points.push({ date: name, value: rawValue });
      });
    }
    return points;
  }

  getContentStyle(height: number, width: number): StyleObject | void {
    if (this.context === undefined) {
      return { height: '100%' };
    }
    const scaleFactor = this.getScaleFactor();
    // NOTE(nina): We are dividing the dimensions by the scale factor because
    // we receive the already-scaled dimensions. If we want to scale
    // everything contained by this element, then we need to reset the
    // dimensions to their unscaled versions. Ideally, we would like to
    // receive the true dimensions from the parent.
    return {
      height: height / scaleFactor,
      width: width / scaleFactor,
      transform: `scale(${scaleFactor})`,
      transformOrigin: 'top left',
    };
  }

  getDataPoint(
    metrics: { [string]: number | null },
    selectedFieldID: string,
    dataValues: $ReadOnlyArray<number | null> | void = undefined,
  ): { value: string, label: string, color: string } {
    const { seriesSettings } = this.props;

    const field = seriesSettings.getSeriesObject(selectedFieldID);
    const rawValue = metrics[selectedFieldID];

    if (rawValue === undefined || field === undefined) {
      return { value: '', label: '', color: '#000' };
    }

    const dataActionGroup = seriesSettings.getSeriesDataActionGroup(
      selectedFieldID,
    );

    const color = dataActionGroup
      ? dataActionGroup.getValueColor(
          rawValue,
          dataValues === undefined ? [rawValue] : dataValues,
        )
      : '#000';

    const newValue = dataActionGroup
      ? dataActionGroup.getTransformedText(
          rawValue,
          dataValues === undefined ? [rawValue] : dataValues,
        )
      : undefined;

    const formattedValue = field.formatFieldValue(rawValue);

    return {
      value: newValue || formattedValue,
      label: field.label(),
      color: color === undefined ? '#000' : color,
    };
  }

  getScaleFactor(): number {
    if (this.context === undefined) {
      return 1;
    }

    return this.context.scaleFactor || 1;
  }

  getTrendPoints(): $ReadOnlyArray<TrendPoint> {
    const { controls, queryResult } = this.props;
    return this.buildTrendPoints(controls.selectedField(), queryResult);
  }

  @autobind
  maybeRenderNumberTrend(height: number, width: number): React.Node {
    const { controls, groupBySettings, loading, queryResult } = this.props;
    if (loading || queryResult.isEmpty()) {
      return null;
    }

    const { primaryFieldColor, primaryNumber } = this.buildPrimaryNumber();

    let secondaryNumber;
    let secondaryFieldColor = '#000';
    const secondarySelectedField = controls.secondarySelectedField();

    if (secondarySelectedField !== undefined) {
      const field = this.getDataPoint(
        queryResult.root().metrics,
        secondarySelectedField,
      );
      secondaryNumber = { label: field.label, value: field.value };
      secondaryFieldColor = field.color;
    }

    // TODO(nina): Currently the value returns in the default (unmodified)
    // data format, but we want to change the default to 0 decimals with
    // separator. We can use fromViewType (like AxesSettings.fromViewType) to
    // set the default in SeriesSettings
    return (
      <div style={this.getContentStyle(height, width)}>
        <NumberTrendCore
          groupBySettings={groupBySettings}
          primaryNumber={primaryNumber}
          secondaryNumber={secondaryNumber}
          theme={this.buildTheme(
            primaryFieldColor,
            secondaryFieldColor,
            height,
            width,
          )}
          trendPoints={this.getTrendPoints()}
        />
      </div>
    );
  }

  render(): React.Node {
    return (
      <Visualization loading={this.props.loading}>
        {this.maybeRenderNumberTrend}
      </Visualization>
    );
  }
}
