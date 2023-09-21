// @flow
export opaque type DatasourceId: string = string;

/**
 * Cast a string to an opaque DatasourceId type.
 */
export function makeDatasourceId(source: string): DatasourceId {
  return source;
}

export const GLOBAL_PIPELINE_SUMMARY_KEY: DatasourceId = 'ALL_SOURCES';

export function isGlobalDatasourceId(source: DatasourceId): boolean {
  return source === GLOBAL_PIPELINE_SUMMARY_KEY;
}
