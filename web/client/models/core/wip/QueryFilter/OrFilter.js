// @flow
import Promise from 'bluebird';

import * as Zen from 'lib/Zen';
import QueryFilterUtil from 'models/core/wip/QueryFilter/QueryFilterUtil';
import type {
  QueryFilter,
  SerializedQueryFilter,
} from 'models/core/wip/QueryFilter/types';
import type { Serializable } from 'lib/Zen';

type Values = {
  fields: Zen.Array<QueryFilter>,
};

export type SerializedOrFilter = {
  fields: Array<SerializedQueryFilter>,
  type: 'OR',
};

class OrFilter extends Zen.BaseModel<OrFilter, Values>
  implements Serializable<SerializedOrFilter> {
  tag: 'OR' = 'OR';

  static deserializeAsync(
    values: SerializedOrFilter,
  ): Promise<Zen.Model<OrFilter>> {
    const filterPromises = values.fields.map(QueryFilterUtil.deserializeAsync);
    return Promise.all(filterPromises).then(fields =>
      OrFilter.create({ fields: Zen.Array.create(fields) }),
    );
  }

  static UNSAFE_deserialize(values: SerializedOrFilter): Zen.Model<OrFilter> {
    const fields = values.fields.map(QueryFilterUtil.UNSAFE_deserialize);
    return OrFilter.create({ fields: Zen.Array.create(fields) });
  }

  serialize(): SerializedOrFilter {
    return {
      fields: this._.fields().mapValues(filter => filter.serialize()),
      type: this.tag,
    };
  }
}

export default ((OrFilter: $Cast): Class<Zen.Model<OrFilter>>);
