// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import applyCustomFieldsToHierarchy from 'models/visualizations/ExpandoTree/applyCustomFieldsToHierarchy';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { HierarchyNode } from 'models/visualizations/ExpandoTree/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {
  levels: $ReadOnlyArray<string>,
  root: HierarchyNode,
};

// The serialized result is identical to the deserialized version.
type SerializedExpandoTreeQueryResult = DefaultValues;

/**
 * Check if there are no metrics in the root hierarchy node
 */
export function checkIfNoMetricsExist({ metrics }: HierarchyNode): boolean {
  const metricKeys = Object.keys(metrics);
  const hasNoMetrics = metricKeys.length === 0;
  return hasNoMetrics;
}

/**
 * Check if all metrics are zero or null
 */
function checkIfAllMetricsAreEmpty({ metrics }: HierarchyNode): boolean {
  const allMetricsAreEmpty = Object.keys(metrics).every(
    key => metrics[key] === 0 || metrics[key] === null,
  );
  return allMetricsAreEmpty;
}

class ExpandoTreeQueryResultData
  extends Zen.BaseModel<ExpandoTreeQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<ExpandoTreeQueryResultData>,
    Serializable<SerializedExpandoTreeQueryResult> {
  static defaultValues: DefaultValues = {
    levels: [],
    root: {
      dimension: '',
      metrics: {},
      name: '',
    },
  };

  static deserialize(
    values: SerializedExpandoTreeQueryResult,
  ): Zen.Model<ExpandoTreeQueryResultData> {
    return ExpandoTreeQueryResultData.create({ ...values });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<ExpandoTreeQueryResultData> {
    return this._.root(
      applyCustomFieldsToHierarchy(this._.root(), customFields),
    );
  }

  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filters: DataFilterGroup,
  ): Zen.Model<ExpandoTreeQueryResultData> {
    // NOTE(stephen): Filtering is not possible right now with hierarchy data
    // because the parent node's value cannot be recomputed on the frontend.
    return this._;
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<ExpandoTreeQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  isEmpty(): boolean {
    const root = this._.root();
    return checkIfNoMetricsExist(root) || checkIfAllMetricsAreEmpty(root);
  }

  serialize(): SerializedExpandoTreeQueryResult {
    return this.modelValues();
  }
}

export default ((ExpandoTreeQueryResultData: $Cast): Class<
  Zen.Model<ExpandoTreeQueryResultData>,
>);
