// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilter from 'models/core/QueryResultSpec/QueryResultFilter/DataFilter';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { HierarchyNode } from 'components/visualizations/ExpandoTree/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

type DefaultValues = {|
  levels: $ReadOnlyArray<string>,
  root: HierarchyNode,
|};

// The serialized result is identical to the deserialized version.
type SerializedExpandoTreeQueryResult = DefaultValues;

function _applyCustomFieldsHelper(
  node: HierarchyNode,
  customFields: $ReadOnlyArray<CustomField>,
): HierarchyNode {
  const metrics = { ...node.metrics };
  customFields.forEach(field => {
    const formula = field.formula();
    metrics[field.id()] = formula.evaluateFormula(metrics);
  });
  const children =
    node.children !== undefined
      ? node.children.map(child =>
          _applyCustomFieldsHelper(child, customFields),
        )
      : undefined;
  return {
    ...node,
    children,
    metrics,
  };
}

class ExpandoTreeQueryResultData
  extends Zen.BaseModel<ExpandoTreeQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<ExpandoTreeQueryResultData>,
    Serializable<SerializedExpandoTreeQueryResult> {
  static defaultValues = {
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
    return this._.root(_applyCustomFieldsHelper(this._.root(), customFields));
  }

  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filterMap: Zen.Map<DataFilter>,
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

  serialize(): SerializedExpandoTreeQueryResult {
    return this.modelValues();
  }
}

export default ((ExpandoTreeQueryResultData: any): Class<
  Zen.Model<ExpandoTreeQueryResultData>,
>);
