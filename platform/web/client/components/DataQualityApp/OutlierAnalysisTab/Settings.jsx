// @flow
import * as React from 'react';

import Dropdown from 'components/ui/Dropdown';
import I18N from 'lib/I18N';
import LabelWrapper from 'components/ui/LabelWrapper';
import { OUTLIER_TYPE } from 'components/DataQualityApp/OutlierAnalysisTab/util';
import type Dimension from 'models/core/wip/Dimension';
import type { OutlierType } from 'components/DataQualityApp/OutlierAnalysisTab/util';

type Props = {
  aggregation: Dimension,
  geographyDimensions: $ReadOnlyArray<Dimension>,
  onAggregationSelected: Dimension => void,
  onOutlierTypeSelected: OutlierType => void,
  outlierType: OutlierType,
};

const OUTLIER_TYPE_OPTIONS = [
  <Dropdown.Option key={OUTLIER_TYPE.ALL} value={OUTLIER_TYPE.ALL}>
    {I18N.text('All (2+ stdev from mean)')}
  </Dropdown.Option>,
  <Dropdown.Option key={OUTLIER_TYPE.MODERATE} value={OUTLIER_TYPE.MODERATE}>
    {I18N.text('Moderate (2-3 stdev from mean)')}
  </Dropdown.Option>,
  <Dropdown.Option key={OUTLIER_TYPE.EXTREME} value={OUTLIER_TYPE.EXTREME}>
    {I18N.text('Extreme (3+ stdev from mean)')}
  </Dropdown.Option>,
];

function Settings({
  aggregation,
  geographyDimensions,
  onAggregationSelected,
  onOutlierTypeSelected,
  outlierType,
}: Props) {
  function renderDimensionOptions(): $ReadOnlyArray<
    React.Element<Class<Dropdown.Option<Dimension>>>,
  > {
    return geographyDimensions.map(dimension => (
      <Dropdown.Option key={dimension.id()} value={dimension}>
        {dimension.name()}
      </Dropdown.Option>
    ));
  }

  function renderOutlierTypeSelector() {
    return (
      <LabelWrapper
        className="dq-tab-specific-filters-settings__right"
        inline
        label={I18N.text('Outlier type')}
      >
        <Dropdown
          buttonMinWidth={250}
          menuClassName="dq-map-viz__dimension-selector-dropdown"
          onSelectionChange={onOutlierTypeSelected}
          value={outlierType}
        >
          {OUTLIER_TYPE_OPTIONS}
        </Dropdown>
      </LabelWrapper>
    );
  }

  function renderAggregationSelector() {
    return (
      <LabelWrapper
        className="dq-tab-specific-filters-settings__left"
        inline
        label={I18N.textById('Aggregation')}
      >
        <Dropdown
          buttonMinWidth={150}
          menuClassName="dq-map-viz__dimension-selector-dropdown"
          onSelectionChange={onAggregationSelected}
          value={aggregation}
        >
          {renderDimensionOptions()}
        </Dropdown>
      </LabelWrapper>
    );
  }

  return (
    <LabelWrapper
      className="dq-tab-specific-filters-settings"
      contentClassName="dq-tab-specific-filters-settings__content"
      inline
      label={I18N.textById('Settings')}
      labelClassName="dq-tab-specific-filters-settings__label"
    >
      {renderAggregationSelector()}
      {renderOutlierTypeSelector()}
    </LabelWrapper>
  );
}

export default (React.memo(Settings): React.AbstractComponent<Props>);
