// @flow
import type { DataQualityScore } from 'models/AdvancedQueryApp/Insights/DataQualityInsight/types';

/**
 * Returns a readable score as a string in the form value/maxScore given a
 * DataQualityScore object.
 */
export function getDisplayScore(score: DataQualityScore): string {
  return `${score.value}/${score.maxScore}`;
}
