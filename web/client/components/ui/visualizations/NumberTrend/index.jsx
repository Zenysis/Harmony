// @flow
import * as React from 'react';
import classNames from 'classnames';

import Group from 'components/ui/Group';
import Trend from 'components/ui/visualizations/NumberTrend/Trend';
import { DEFAULT_THEME } from 'components/ui/visualizations/NumberTrend/defaults';
import type GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import type {
  NumberTrendTheme,
  NumberProperties,
  TrendPoint,
} from 'components/ui/visualizations/NumberTrend/types';
import type { StyleObject } from 'types/jsCore';

type DefaultProps = {
  /** The (optional) secondary field to display */
  secondaryNumber?: NumberProperties,

  /** Optional style to introduce that is different than the default. */
  theme: NumberTrendTheme,
};

type Props = {
  ...DefaultProps,
  groupBySettings: GroupBySettings,

  /** The primary field to display */
  primaryNumber: NumberProperties,

  /** List of data points grouped by date */
  trendPoints: $ReadOnlyArray<TrendPoint>,
};

export default class NumberTrend extends React.PureComponent<Props> {
  static defaultProps: DefaultProps = {
    secondaryNumber: undefined,
    theme: DEFAULT_THEME,
  };

  getNumberValueStyle(): StyleObject {
    const { primaryNumber } = this.props.theme;
    const colorStyle = primaryNumber.displayValueAsPill
      ? { backgroundColor: primaryNumber.valueFontColor }
      : { color: primaryNumber.valueFontColor };

    return {
      fontSize: primaryNumber.valueFontSize,
      ...colorStyle,
    };
  }

  getNumberLabelStyle(): StyleObject {
    const { primaryNumber } = this.props.theme;
    return {
      fontSize: primaryNumber.labelFontSize,
    };
  }

  getSecondaryNumberStyle(): StyleObject {
    const { secondaryNumber } = this.props.theme;
    return {
      color: secondaryNumber.valueFontColor,
      fontSize: secondaryNumber.fontSize,
    };
  }

  getTrendLineStyle(): { height: number, width: number } {
    const { trendHeight, trendWidth } = this.props.theme;
    return { height: trendHeight, width: trendWidth };
  }

  maybeRenderTrend(): React.Node {
    const { groupBySettings, trendPoints } = this.props;
    if (trendPoints.length === 0) {
      return null;
    }
    return (
      <Trend
        groupBySettings={groupBySettings}
        points={trendPoints}
        {...this.getTrendLineStyle()}
      />
    );
  }

  maybeRenderSecondaryNumber(): React.Node {
    const { secondaryNumber } = this.props;

    if (secondaryNumber === undefined) {
      return null;
    }

    const { color, fontSize } = this.getSecondaryNumberStyle();

    return (
      <Group.Horizontal
        flex
        justifyContent="center"
        spacing="xxs"
        style={{ fontSize, flexWrap: 'wrap' }}
      >
        <Group.Item style={{ color }}>{secondaryNumber.value}</Group.Item>
        {secondaryNumber.label}
      </Group.Horizontal>
    );
  }

  renderPrimaryNumber(): React.Node {
    const { primaryNumber, theme } = this.props;
    const { displayValueAsPill } = theme.primaryNumber;
    const valueClassName = classNames('primary-number-value', {
      'primary-number-value__pill': displayValueAsPill,
    });

    const spacing = displayValueAsPill ? 'm' : 's';

    return (
      <Group.Vertical
        flex
        alignItems="center"
        spacing={spacing}
        marginBottom={spacing}
      >
        <div
          className="primary-number-label"
          style={this.getNumberLabelStyle()}
        >
          {primaryNumber.label}
        </div>
        <div className={valueClassName} style={this.getNumberValueStyle()}>
          {primaryNumber.value}
        </div>
      </Group.Vertical>
    );
  }

  render(): React.Node {
    return (
      <Group.Vertical
        flex
        justifyContent="center"
        style={{ height: '100%' }}
        spacing="none"
      >
        {this.renderPrimaryNumber()}
        {this.maybeRenderSecondaryNumber()}
        {this.maybeRenderTrend()}
      </Group.Vertical>
    );
  }
}
