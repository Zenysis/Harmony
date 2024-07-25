// @flow
import * as React from 'react';
import { useFragment } from 'react-relay/hooks';

import Colors from 'components/ui/Colors';
import DataQualityService from 'services/wip/DataQualityService';
import Field from 'models/core/wip/Field';
import Group from 'components/ui/Group';
import Heading from 'components/ui/Heading';
import I18N from 'lib/I18N';
import InfoTooltip from 'components/ui/InfoTooltip';
import LoadingSpinner from 'components/ui/LoadingSpinner';
import OverallScoreCard from 'components/common/DataQuality/OverallScoreCard';
import { cancelPromise } from 'util/promiseUtil';
import { relayIdToDatabaseId } from 'util/graphql';
import type DataQuality from 'models/DataQualityApp/DataQuality';
import type { FieldProfilingSection_field$key } from './__generated__/FieldProfilingSection_field.graphql';

type Props = {
  field: FieldProfilingSection_field$key,
  fieldId: string,
};

function FieldProfilingSection({ field, fieldId }: Props) {
  const data = useFragment(
    graphql`
      fragment FieldProfilingSection_field on field {
        name
        shortName: short_name
        serializedCalculation: calculation
      }
    `,
    field,
  );

  const [dataQuality, setDataQuality] = React.useState<DataQuality | void>(
    undefined,
  );

  React.useEffect(() => {
    if (!data) {
      return;
    }

    const newField = Field.UNSAFE_deserialize({
      calculation: data.serializedCalculation,
      canonicalName: data.name || '',
      id: relayIdToDatabaseId(fieldId),
      shortName: data.shortName || '',
    });

    const promise = DataQualityService.getOverallQuality(newField, true).then(
      dq => {
        setDataQuality(dq);
      },
    );

    /* eslint-disable consistent-return */
    // disable this to able to return a function to cancel a promise
    return () => cancelPromise(promise);
  }, [data, fieldId]);

  const maybeRenderFieldCompleteness = () => {
    if (!dataQuality) {
      return null;
    }

    const indicatorCharacteristics = dataQuality.indicatorCharacteristics();
    const completenessTrendIsUp = indicatorCharacteristics.completenessTrendIsUp();
    const lastReportDate = indicatorCharacteristics.lastReportDate();

    const completenessTrend = completenessTrendIsUp
      ? I18N.textById('Positive')
      : I18N.textById('Negative');

    const completenessColor = completenessTrendIsUp
      ? Colors.SUCCESS
      : Colors.ERROR;

    return (
      <>
        <div className="field-profiling-section__trend">
          <p className="field-profiling-section__title">
            {I18N.text('Completeness trend')}
          </p>
          <p
            className="field-profiling-section__text"
            style={{ color: completenessColor }}
          >
            {completenessTrend}
          </p>
        </div>
        <div className="field-profiling-section__reporting">
          <p className="field-profiling-section__title">
            {I18N.text('Last reporting date')}
          </p>
          <p className="field-profiling-section__text">
            {lastReportDate.fromNow()}
          </p>
        </div>
      </>
    );
  };

  const maybeRenderCharacteristics = () => {
    if (!dataQuality) {
      return null;
    }
    const indicatorCharacteristics = dataQuality.indicatorCharacteristics();
    const displayedEstimatedReportingPeriod = indicatorCharacteristics.displayedEstimatedReportingPeriod();
    return (
      <Group flex flexValue={1} marginTop="xl" spacing="none">
        {/* TODO: Add popularity, last refresh and number of points values */}
        <Group>
          <div className="field-profiling-section__trend">
            <p className="field-profiling-section__title">
              {I18N.text('Reporting frequency')}
            </p>
            <p className="field-profiling-section__text">
              {displayedEstimatedReportingPeriod}
            </p>
          </div>
        </Group>
      </Group>
    );
  };

  return (
    <div className="field-profiling-section">
      <Heading size={Heading.Sizes.SMALL}>
        {I18N.text('Profiling information')}
      </Heading>
      <Group flex itemFlexValue={1} spacing="none">
        <div className="field-profiling-section__card">
          <Heading.Small>{I18N.text('characteristics')}</Heading.Small>
          {maybeRenderCharacteristics()}
        </div>
        <div className="field-profiling-section__card field-profiling-section__card--dq">
          <Heading.Small>
            {I18N.textById('Data Quality')}{' '}
            <InfoTooltip
              text={I18N.text(
                'This section and quality score aim to quantify the reporting and data quality for this indicator based on the factors detailed within. It should not be taken as an authoritative score on its own but a low score is worth investigating to ensure it does not significantly impact the results of your analysis. You can expand this section and click through to the full data quality tool to investigate.',
              )}
            />
          </Heading.Small>
          {dataQuality ? (
            <Group flex flexValue={1} marginTop="xl" spacing="none">
              <OverallScoreCard
                className="field-profiling-section__score-badge"
                fieldId={relayIdToDatabaseId(fieldId)}
                filters={[]}
                maxScore={dataQuality.maxScore()}
                score={dataQuality.score()}
              />

              {maybeRenderFieldCompleteness()}
            </Group>
          ) : (
            <div className="field-profiling-section__spinner">
              <LoadingSpinner className="" />
            </div>
          )}
        </div>
      </Group>
    </div>
  );
}

export default (React.memo<Props>(
  FieldProfilingSection,
): React.AbstractComponent<Props>);
