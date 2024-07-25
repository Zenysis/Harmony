// @flow
import * as React from 'react';
import numeral from 'numeral';

import AuthorizationService from 'services/AuthorizationService';
import HypertextLink from 'components/ui/HypertextLink';
import I18N from 'lib/I18N';
import IndicatorSectionRow from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorSectionRow';
import LabelWithTooltip from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/LabelWithTooltip';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import MultiLineText from 'components/DataCatalogApp/common/MultiLineText';
import buildFieldDetailsPageLink from 'components/DataCatalogApp/buildFieldDetailsPageLink';
import useCalculationReportingStats from 'components/common/QueryBuilder/CustomizableIndicatorTag/IndicatorCustomizationModule/IndicatorAboutPanel/useCalculationReportingStats';
import { CALCULATION_DISPLAY_NAMES } from 'models/core/wip/Calculation/registry';
import {
  RESOURCE_TYPES,
  SITE_PERMISSIONS,
} from 'services/AuthorizationService/registry';
import { relayIdToDatabaseId } from 'util/graphql';
import type { Calculation } from 'models/core/wip/Calculation/types';

type Props = {
  calculation: Calculation,
  category: string | void,
  categoryPath: React.Node,
  dataSource: string,
  defaultName: string,
  description: string,
  fieldId: string,
};

const DATE_FORMAT = 'D MMM YYYY';
const LOADING_SPINNER = <LoadingSpinner />;

export default function IndicatorDetailsSection({
  calculation,
  category,
  categoryPath,
  dataSource,
  defaultName,
  description,
  fieldId,
}: Props): React.Node {
  const [canViewDataCatalog, setCanViewDataCatalog] = React.useState<boolean>(
    false,
  );

  const calculationName = React.useMemo(
    () => CALCULATION_DISPLAY_NAMES[calculation.tag] || calculation.tag,
    [calculation],
  );
  const stats = useCalculationReportingStats(calculation, false);

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

  React.useEffect(() => {
    AuthorizationService.isAuthorized(
      SITE_PERMISSIONS.CAN_VIEW_DATA_CATALOG,
      RESOURCE_TYPES.SITE,
    ).then(canNowViewDataCatalog => {
      setCanViewDataCatalog(canNowViewDataCatalog);
    });
  }, []);

  function renderDefaultNameValue() {
    return canViewDataCatalog ? (
      <HypertextLink
        className="indicator-details-section__link"
        url={buildFieldDetailsPageLink(fieldId, defaultName)}
      >
        {defaultName}
      </HypertextLink>
    ) : (
      defaultName
    );
  }

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
      <IndicatorSectionRow title={I18N.textById('description')}>
        {label}
      </IndicatorSectionRow>
    );
  }

  return (
    <div className="indicator-details-section">
      <IndicatorSectionRow title={I18N.text('Default name', 'defaultName')}>
        {renderDefaultNameValue()}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={I18N.textById('Data source')}>
        {dataSource}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={I18N.textById('Location')}>
        {maybeRenderCategoryValue()}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={I18N.text('Default calculation type')}>
        {calculationName}
      </IndicatorSectionRow>
      {maybeRenderDescriptionRow()}
      <IndicatorSectionRow title={I18N.text('Data points')}>
        {count}
      </IndicatorSectionRow>
      <IndicatorSectionRow title={I18N.text('Data availability')}>
        {dateRange}
      </IndicatorSectionRow>
    </div>
  );
}
