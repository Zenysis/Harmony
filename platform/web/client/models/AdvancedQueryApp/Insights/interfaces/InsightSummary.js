// @flow

/**
 * Each InsightSummary is used to show information about the current insight to
 * the user in an easy to understand format.
 */
export interface InsightSummary {
  /**
   * Produce a human readable description of the current insight.
   */
  summary(): string;

  /**
   * The title of this insight to display to the user.
   */
  title(): string;
}
