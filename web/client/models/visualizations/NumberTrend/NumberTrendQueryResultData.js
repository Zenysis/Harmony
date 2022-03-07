// @flow
import type Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import ExpandoTreeQueryResultData, {
  checkIfNoMetricsExist,
} from 'models/visualizations/ExpandoTree/ExpandoTreeQueryResultData';
import applyCustomFieldsToHierarchy from 'models/visualizations/ExpandoTree/applyCustomFieldsToHierarchy';
import { defaultApplyTransformations } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type CustomField from 'models/core/Field/CustomField';
import type DataFilterGroup from 'models/core/QueryResultSpec/DataFilterGroup';
import type QueryResultSpec from 'models/core/QueryResultSpec';
import type { HierarchyNode } from 'models/visualizations/ExpandoTree/types';
import type { QueryResultData } from 'models/core/QueryResultState/interfaces/QueryResultData';
import type { Serializable } from 'lib/Zen';

// NumberTrend uses the same structure as the ExpandoTreeQueryResultData
type DefaultValues = {
  levels: $ReadOnlyArray<string>,
  root: HierarchyNode,
};

// NumberTrend uses the same endpoint as the ExpandoTree, so the serialized
// type is the same as the serialized ExpandoTreeQueryResultData
type SerializedNumberQueryResultData = {
  ...Zen.Serialized<ExpandoTreeQueryResultData>,
};

// This is basically copy of the ExpandoTreeQueryResultData class,
// except it has a minor difference in how it checks if data is empty.
class NumberTrendQueryResultData
  extends Zen.BaseModel<NumberTrendQueryResultData, {}, DefaultValues>
  implements
    QueryResultData<NumberTrendQueryResultData>,
    Serializable<SerializedNumberQueryResultData> {
  static defaultValues: DefaultValues = {
    levels: [],
    root: {
      dimension: '',
      metrics: {},
      name: '',
    },
  };

  static deserialize(
    values: SerializedNumberQueryResultData,
  ): Zen.Model<NumberTrendQueryResultData> {
    return NumberTrendQueryResultData.create({ ...values });
  }

  applyCustomFields(
    customFields: $ReadOnlyArray<CustomField>,
  ): Zen.Model<NumberTrendQueryResultData> {
    return this._.root(
      applyCustomFieldsToHierarchy(this._.root(), customFields),
    );
  }

  applyFilters(
    // eslint-disable-next-line no-unused-vars
    filters: DataFilterGroup,
  ): Zen.Model<NumberTrendQueryResultData> {
    // NOTE(stephen): Filtering is not possible right now with hierarchy data
    // because the parent node's value cannot be recomputed on the frontend.
    return this._;
  }

  applyTransformations(
    queryResultSpec: QueryResultSpec,
  ): Promise<Zen.Model<NumberTrendQueryResultData>> {
    return defaultApplyTransformations(this._, queryResultSpec);
  }

  isEmpty(): boolean {
    return checkIfNoMetricsExist(this._.root());
  }

  serialize(): SerializedNumberQueryResultData {
    return this.modelValues();
  }
}

export default ((NumberTrendQueryResultData: $Cast): Class<
  Zen.Model<NumberTrendQueryResultData>,
>);
