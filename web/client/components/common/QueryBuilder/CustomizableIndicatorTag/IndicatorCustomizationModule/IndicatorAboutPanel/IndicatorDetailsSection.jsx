// @flow
import * as React from 'react';
import numeral from 'numeral';

import I18N from 'lib/I18N';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import LabelWithTooltip from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/LabelWithTooltip';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import MultiLineText from 'components/DataCatalogApp/common/MultiLineText';
import useCalculationReportingStats from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/useCalculationReportingStats';
import { CALCULATION_DISPLAY_NAMES } from 'models/core/wip/Calculation/registry';
import type { Calculation } from 'models/core/wip/Calculation/types';

type Props = {
  calculation: Calculation,
  category: string | void,
  categoryPath: React.Node,
  dataSource: string,
  defaultName: string,
  description: string,
};

const TEXT = t(
  'common.QueryBuilder.CustomizableIndicatorTag.IndicatorCustomizationModule.IndicatorAboutPanel.IndicatorDetailsSection',
);

const DATE_FORMAT = 'D MMM YYYY';
const LOADING_SPINNER = <LoadingSpinner />;

export default function IndicatorDetailsSection({
  calculation,
  category,
  categoryPath,
  dataSource,
  defaultName,
  description,
}: Props): React.Node {
  const calculationName = React.useMemo(
    () => CALCULATION_DISPLAY_NAMES[calculation.tag] || calculation.tag,
    [calculation],
  );
  const stats = useCalculationReportingStats(calculation);

  const count = React.useMemo(
    () =>
      stats !== undefined
        ? numeral(stats.count).format('0,0')
        : LOADING_SPINNER,
    [stats],
  );
  const dateRange = React.useMemo(() => {
    if (stats === undefined) {
      return LOADING_SPINNER;
    }

    if (stats.count === 0) {
      return '-';
    }

    const startDateStr = stats.startDate.format(DATE_FORMAT);
    const endDateStr = stats.endDate.format(DATE_FORMAT);
    return `${startDateStr} - ${endDateStr}`;
  }, [stats]);

  function maybeRenderCategoryValue() {
    if (category === undefined) {
      return null;
    }

    return <LabelWithTooltip label={category} tooltipContent={categoryPath} />;
  }

  function maybeRenderDescriptionRow() {
    if (description.length === 0) {
      return null;
    }

    const label = (
      <LabelWithTooltip
        label={description}
        tooltipContent={<MultiLineText text={description} />}
      />
    );

    return (
      <IndicatorSectionRow title={TEXT.description}>
        {label}
      </IndicatorSectionRow>
    );
  }

  return (
    <div className="indicator-details-section">
      <IndicatorSectionRow title={I18N.text('Default name', 'defaultName')}>
        {defaultName}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={TEXT.dataSource}>
        {dataSource}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={TEXT.category}>
        {maybeRenderCategoryValue()}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={TEXT.defaultCalculationType}>
        {calculationName}
      </IndicatorSectionRow>
      {maybeRenderDescriptionRow()}
      <IndicatorSectionRow title={TEXT.dataPointCount}>
        {count}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={TEXT.dateRange}>
        {dateRange}
      </IndicatorSectionRow>
    </div>
  );
}
