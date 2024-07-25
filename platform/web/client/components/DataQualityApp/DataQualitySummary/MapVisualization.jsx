// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import ColorBlock from 'components/ui/ColorBlock';
import DataAction from 'models/core/QueryResultSpec/DataAction';
import DataActionRule from 'models/core/QueryResultSpec/DataActionRule';
import DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import DataQualityMap from 'models/DataQualityApp/DataQualityMap';
import Dropdown from 'components/ui/Dropdown';
import GroupBySettings from 'models/core/QueryResultSpec/GroupBySettings';
import I18N from 'lib/I18N';
import InValueRangeRule from 'models/core/QueryResultSpec/ValueRule/InValueRangeRule';
import LegendSettings from 'models/core/QueryResultSpec/VisualizationSettings/LegendSettings';
import MapQueryResultData from 'models/visualizations/MapViz/MapQueryResultData';
import MapSettings from 'models/visualizations/MapViz/MapSettings';
import MapViz from 'components/visualizations/MapViz';
import QueryResultGrouping from 'models/core/QueryResultSpec/QueryResultGrouping';
import QueryResultSeries from 'models/core/QueryResultSpec/QueryResultSeries';
import SeriesSettings from 'models/core/QueryResultSpec/VisualizationSettings/SeriesSettings';
import Well from 'components/ui/Well';
import memoizeOne from 'decorators/memoizeOne';
import { autobind } from 'decorators';
import {
  getScoreColor,
  getScoreInfo,
  INDICATOR_CHARACTERISTICS,
  OVERALL_SCORE,
  OUTLIER_ANALYSIS,
  QUALITY_SCORE_TYPES,
  REPORTING_COMPLETENESS,
  SCORE_LOWER_THRESHOLDS,
} from 'components/DataQualityApp/util';
import { round } from 'util/numberUtil';
import type DataQuality from 'models/DataQualityApp/DataQuality';
import type Dimension from 'models/core/wip/Dimension';
import type {
  QualityScoreType,
  ScoreInfo,
} from 'components/DataQualityApp/util';

type Props = {
  dataQualityMap: DataQualityMap,
  geographyDimensions: $ReadOnlyArray<Dimension>,
  geographyGroupBy: Dimension,
  loading: boolean,
  mapQualityScoreType: QualityScoreType,
  onGeographyGroupBySelected: Dimension => void,
  onMapQualityScoreTypeSelected: QualityScoreType => void,
};

type State = {
  controls: MapSettings,
};

// NOTE: The DQL map viz is smaller than the query tool map viz so we
// reduce the default zoom value.
const DEFAULT_ZOOM = window.__JSON_FROM_BACKEND.mapDefaultZoom - 0.5;

const SCORE = 'SCORE';

const DEFAULT_MAP_PROPS = {
  customFields: [],
  dataFilters: DataFilterGroup.create({}),
  legendSettings: LegendSettings.create({ showLegend: false }),
};

const SCORE_TYPE_TO_TEXT_MAP = {
  [INDICATOR_CHARACTERISTICS]: I18N.text('Indicator Characteristics Score'),
  [OUTLIER_ANALYSIS]: I18N.text('Data Outlier Analysis Score'),
  [OVERALL_SCORE]: I18N.text('Overall Score'),
  [REPORTING_COMPLETENESS]: I18N.text('Reporting Completeness Score'),
};

const QUALITY_SCORE_TYPE_OPTIONS = QUALITY_SCORE_TYPES.map(scoreTypeId => (
  <Dropdown.Option key={scoreTypeId} value={scoreTypeId}>
    {SCORE_TYPE_TO_TEXT_MAP[scoreTypeId]}
  </Dropdown.Option>
));

export default class MapVisualization extends React.PureComponent<
  Props,
  State,
> {
  state: State = {
    controls: MapSettings.create({
      currentDisplay: 'tiles',
      selectedField: SCORE,
      selectedGeoTiles: this.props.geographyGroupBy.id(),
      zoomLevel: DEFAULT_ZOOM,
    }),
  };

  componentDidUpdate(prevProps: Props) {
    const { geographyGroupBy } = this.props;
    if (prevProps.geographyGroupBy !== geographyGroupBy) {
      this.onControlsSettingsChange('selectedGeoTiles', geographyGroupBy.id());
    }
  }

  @memoizeOne
  buildGroupBySettings(geographyGroupBy: Dimension): GroupBySettings {
    return GroupBySettings.create({
      groupings: Zen.Map.create({
        [geographyGroupBy.id()]: QueryResultGrouping.create({
          displayValueFormat: 'DEFAULT',
          id: geographyGroupBy.id(),
          label: geographyGroupBy.name(),
          type: 'STRING',
        }),
      }),
    });
  }

  @memoizeOne
  buildMapQueryResultData(
    dataQualityMap: DataQualityMap,
    mapQualityScoreType: QualityScoreType,
  ): MapQueryResultData {
    const data = dataQualityMap
      .byLocation()
      .entries()
      .filter(([, dataQuality]) => dataQuality.success())
      .map(([key, dataQuality]) => {
        const { dimensions, geo } = dataQuality.modelValues();

        const maxScore = this.getMaxScore(dataQuality, mapQualityScoreType);
        const score = this.getScore(dataQuality, mapQualityScoreType);

        return {
          dimensions,
          key,
          // NOTE: This color doesn't seem to actually do anything but is
          // a required value. The actual coloring is done by the DataActionRule
          color: getScoreColor(score, maxScore),
          lat: geo.lat,
          lng: geo.lng,
          metrics: { [SCORE]: score },
        };
      });

    return MapQueryResultData.create({
      // Date is not needed for a static map
      data: [{ date: '', datedData: data }],
    });
  }

  buildDataActionRules(): Zen.Array<DataActionRule> {
    const { dataQualityMap, mapQualityScoreType } = this.props;
    const maxScore = this.getMaxScore(
      dataQualityMap.overall(),
      mapQualityScoreType,
    );
    const scoreInfos = SCORE_LOWER_THRESHOLDS.map(scoreLowerThreshold =>
      // NOTE: Add a small constant as the threshold check is strict
      // "greater than" check rather than a "greater than or equal to" check.
      getScoreInfo(scoreLowerThreshold + 0.0001, 1),
    );

    const dataActions = scoreInfos
      .map(scoreInfo =>
        DataAction.create({
          color: scoreInfo.color,
          label: '',
          rule: InValueRangeRule.create({
            endValue: scoreInfo.upperThreshold * maxScore,
            startValue: scoreInfo.lowerThreshold * maxScore,
          }),
          transformedText: undefined,
        }),
      )
      // NOTE: Reverse the array so that the color rules get applied in
      // the correct ascending order. This matters because InValueRangeRule is
      // inclusive so a value of 8 will match both 6-8 and 8-10
      .reverse();

    return Zen.Array.create([
      DataActionRule.create({
        dataActions,
        id: 'dql_map_rule',
        series: new Set([SCORE]),
      }),
    ]);
  }

  @autobind
  getMaxScore(
    dataQuality: DataQuality,
    mapQualityScoreType: QualityScoreType,
  ): number {
    if (mapQualityScoreType === INDICATOR_CHARACTERISTICS) {
      return dataQuality.indicatorCharacteristics().maxScore();
    }
    if (mapQualityScoreType === REPORTING_COMPLETENESS) {
      return dataQuality.reportingCompleteness().maxScore();
    }
    if (mapQualityScoreType === OUTLIER_ANALYSIS) {
      return dataQuality.outlierAnalysis().maxScore();
    }

    return dataQuality.maxScore();
  }

  @autobind
  getScore(
    dataQuality: DataQuality,
    mapQualityScoreType: QualityScoreType,
  ): number {
    if (mapQualityScoreType === INDICATOR_CHARACTERISTICS) {
      return dataQuality.indicatorCharacteristics().score();
    }
    if (mapQualityScoreType === REPORTING_COMPLETENESS) {
      return dataQuality.reportingCompleteness().score();
    }
    if (mapQualityScoreType === OUTLIER_ANALYSIS) {
      return dataQuality.outlierAnalysis().score();
    }

    return dataQuality.score();
  }

  @autobind
  getSeriesSettings(): SeriesSettings {
    const { mapQualityScoreType } = this.props;

    return SeriesSettings.create({
      dataActionRules: this.buildDataActionRules(),
      seriesObjects: {
        [SCORE]: QueryResultSeries.create({
          id: SCORE,
          label: SCORE_TYPE_TO_TEXT_MAP[mapQualityScoreType],
        }),
      },
      seriesOrder: [SCORE],
    });
  }

  @autobind
  onControlsSettingsChange(controlKey: string, value: any) {
    this.setState(({ controls }) => ({
      controls: controls.set(controlKey, value),
    }));
  }

  maybeRenderDimensionSelectionDropdown(): React.Node {
    const { geographyGroupBy, onGeographyGroupBySelected } = this.props;

    const options = this.renderDimensionOptions();

    if (options.length <= 1) {
      return null;
    }

    return (
      <Dropdown
        buttonWidth="100%"
        menuClassName="dq-map-viz__dimension-selector-dropdown"
        onSelectionChange={onGeographyGroupBySelected}
        value={geographyGroupBy}
      >
        {options}
      </Dropdown>
    );
  }

  maybeRenderMapQualityScoreSelectionDropdown(): React.Node {
    const { mapQualityScoreType, onMapQualityScoreTypeSelected } = this.props;

    return (
      <React.Fragment>
        <Dropdown
          buttonClassName="dq-map-viz__quality-score-button-dropdown"
          buttonWidth="100%"
          defaultDisplayContent="Quality Score"
          menuClassName="dq-map-viz__quality-score-selector-dropdown"
          onSelectionChange={onMapQualityScoreTypeSelected}
          value={mapQualityScoreType}
        >
          {QUALITY_SCORE_TYPE_OPTIONS}
        </Dropdown>
        <div className="dq-map-viz-key__dividing-line" />
      </React.Fragment>
    );
  }

  renderDimensionOptions(): $ReadOnlyArray<
    React.Element<Class<Dropdown.Option<Dimension>>>,
  > {
    const { geographyDimensions } = this.props;
    return geographyDimensions.map(dimension => (
      <Dropdown.Option key={dimension.id()} value={dimension}>
        {dimension.name()}
      </Dropdown.Option>
    ));
  }

  @autobind
  renderKeyLabel(scoreInfo: ScoreInfo): React.Node {
    const { dataQualityMap, mapQualityScoreType } = this.props;
    const maxScore = this.getMaxScore(
      dataQualityMap.overall(),
      mapQualityScoreType,
    );

    const text = `${round(scoreInfo.lowerThreshold * maxScore, 1)} - ${round(
      scoreInfo.upperThreshold * maxScore,
      1,
    )}`;

    return (
      <div key={scoreInfo.color}>
        <ColorBlock color={scoreInfo.color} shape="circle" size={12} />
        <span className="dq-map-viz-key__label">{text}</span>
      </div>
    );
  }

  renderMapKey(): React.Node {
    const scoreInfos = SCORE_LOWER_THRESHOLDS.map(scoreLowerThreshold =>
      // NOTE: Add a small constant as the threshold check is strict
      // "greater than" check rather than a "greater than or equal to" check.
      getScoreInfo(scoreLowerThreshold + 0.0001, 1),
    );

    return (
      <Well className="dq-map-viz-key">
        {this.maybeRenderDimensionSelectionDropdown()}
        {this.maybeRenderMapQualityScoreSelectionDropdown()}
        {scoreInfos.map(this.renderKeyLabel)}
      </Well>
    );
  }

  renderMap(): React.Node {
    const {
      dataQualityMap,
      geographyGroupBy,
      loading,
      mapQualityScoreType,
    } = this.props;

    return (
      <MapViz
        controls={this.state.controls}
        groupBySettings={this.buildGroupBySettings(geographyGroupBy)}
        loading={loading}
        onControlsSettingsChange={this.onControlsSettingsChange}
        queryResult={this.buildMapQueryResultData(
          dataQualityMap,
          mapQualityScoreType,
        )}
        seriesSettings={this.getSeriesSettings()}
        {...DEFAULT_MAP_PROPS}
      />
    );
  }

  render(): React.Node {
    return (
      <div className="dq-map-viz visualization-container">
        {this.renderMap()}
        {this.renderMapKey()}
      </div>
    );
  }
}
