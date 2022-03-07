// @flow
import * as React from 'react';

import * as Zen from 'lib/Zen';
import Field from 'models/core/wip/Field';
import Moment from 'models/core/wip/DateTime/Moment';
import Query from 'components/visualizations/common/Query/Query';
import QuerySelections from 'models/core/wip/QuerySelections';
import { API_VERSION } from 'services/APIService';
import { cancelPromise } from 'util/promiseUtil';
import type { Calculation } from 'models/core/wip/Calculation/types';
import type { SerializedQuerySelectionsForQuery } from 'models/core/wip/QuerySelections';

type CalculationReportingStats = {
  count: number,
  dateCount: number,
  endDate: Moment,
  startDate: Moment,
};

type FieldReportingStatsQueryResponse = $ReadOnlyArray<{
  +dimensions: { +[string]: mixed },
  +metrics: {
    +[string]: {
      count: number,
      dateCount: number,
      endDate: string,
      startDate: string,
    },
  },
}>;

// The endpoint for computing stats about a given field's calculation.
const FIELD_REPORTING_STATS_ENDPOINT = 'query/field_reporting_stats';
const DATE_FORMAT = 'YYYY-MM-DD';

// We use the same field ID each time since all we care about is the statistics
// about the calculation passed in. By reusing the same field ID, we can
// potentially improve caching of the response by the QueryInterface.
const STATIC_FIELD_ID = 'reporting_stats';

function buildQuery(
  calculation: Calculation,
): Query<SerializedQuerySelectionsForQuery, FieldReportingStatsQueryResponse> {
  const querySelections = QuerySelections.create({
    fields: Zen.Array.create([
      Field.create({
        calculation,
        canonicalName: '',
        id: STATIC_FIELD_ID,
        shortName: '',
      }),
    ]),
    filter: Zen.Array.create(),
    groups: Zen.Array.create(),
  });

  return Query.create(
    FIELD_REPORTING_STATS_ENDPOINT,
    querySelections.serializeForQuery(),
    API_VERSION.V2,
  );
}

// Calculate simple statistics about the provided calculation including number
// of data points, number of dates data was reported, and date range this
// calculation will find data.
export default function useCalculationReportingStats(
  calculation: Calculation,
): CalculationReportingStats | void {
  const [
    reportingStats,
    setReportingStats,
  ] = React.useState<CalculationReportingStats | void>(undefined);

  React.useEffect(() => {
    const promise = buildQuery(calculation)
      .run()
      .then((response: FieldReportingStatsQueryResponse) => {
        // We should only receive one result back from the server.
        if (response.length !== 1) {
          return undefined;
        }

        // We always issue the query with the same field ID. This helps with
        // caching on the frontend, since we don't have to worry about the
        // customized field ID breaking the cache.
        const rawStats = response[0].metrics[STATIC_FIELD_ID];
        if (rawStats === undefined) {
          return undefined;
        }

        const { count, dateCount, endDate, startDate } = rawStats;
        return {
          count,
          dateCount,
          endDate: Moment.utc(endDate, DATE_FORMAT),
          startDate: Moment.utc(startDate, DATE_FORMAT),
        };
      })
      .then(parsedResponse => setReportingStats(parsedResponse));
    return () => cancelPromise(promise);
  }, [calculation]);

  return reportingStats;
}
