// @flow
import type { InsightSummary } from 'models/AdvancedQueryApp/Insights/interfaces/InsightSummary';
import type { QueryFilterItem } from 'models/core/wip/QueryFilterItem/types';

/**
 * Each DataQualityInsight stores insights about the reporting health of the
 * current query. Depending on the type of score metric used, there are
 * different information messages and actions that can be surfaced.
 */
export interface DataQualityInsight extends InsightSummary {
  /**
   * Link to open DataQualityLab and show the user the individual data quality insight
   * that was surfaced.
   *
   * NOTE: Right now, DQL will be opened in a new tab and the user will
   * be taken away from AQT.
   */
  getURL(filters: $ReadOnlyArray<QueryFilterItem>): string;
}
